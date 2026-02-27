//! Composable Signed Distance Function (SDF) primitives and operations.
//!
//! All types implement [`ImplicitFunction`] and can be directly tessellated
//! with [`ManifoldDualContouring`].
//!
//! # Example
//! ```rust
//! use tessellation::sdf;
//! use tessellation::ManifoldDualContouring;
//!
//! let sphere = sdf::Sphere::new(1.0);
//! let mut mdc = ManifoldDualContouring::new(&sphere, 0.2, 0.1);
//! let mesh = mdc.tessellate().unwrap();
//! ```

use crate::{BoundingBox, ImplicitFunction};
use nalgebra as na;
use std::fmt::Debug;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/// Sphere centered at the origin.
pub struct Sphere<S: na::Scalar> {
    /// Radius of the sphere.
    pub radius: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> Sphere<S> {
    /// Create a sphere of given `radius`.
    pub fn new(radius: S) -> Self {
        Sphere {
            radius,
            bbox: BoundingBox::new(
                &na::Point3::new(-radius, -radius, -radius),
                &na::Point3::new(radius, radius, radius),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for Sphere<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        na::Vector3::new(p.x, p.y, p.z).norm() - self.radius
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        na::Vector3::new(p.x, p.y, p.z).normalize()
    }
}

/// Axis-aligned box with rounded edges, centered at the origin.
pub struct RoundedBox<S: na::Scalar> {
    half_extents: na::Vector3<S>,
    radius: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> RoundedBox<S> {
    /// Create a rounded box.
    /// `half_extents` is the half-size along each axis *before* rounding.
    /// `radius` is the rounding radius applied to edges.
    pub fn new(half_extents: na::Vector3<S>, radius: S) -> Self {
        let total = half_extents + na::Vector3::new(radius, radius, radius);
        RoundedBox {
            half_extents,
            radius,
            bbox: BoundingBox::new(
                &na::Point3::new(-total.x, -total.y, -total.z),
                &na::Point3::new(total.x, total.y, total.z),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for RoundedBox<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let zero: S = From::from(0f32);
        let q = na::Vector3::new(
            p.x.abs() - self.half_extents.x,
            p.y.abs() - self.half_extents.y,
            p.z.abs() - self.half_extents.z,
        );
        let outside = na::Vector3::new(q.x.max(zero), q.y.max(zero), q.z.max(zero)).norm();
        let inside = q.x.max(q.y.max(q.z)).min(zero);
        outside + inside - self.radius
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        finite_difference_normal(self, p)
    }
}

/// Torus centered at the origin, lying in the XZ plane.
pub struct Torus<S: na::Scalar> {
    /// Distance from the center of the tube to the center of the torus.
    pub major_radius: S,
    /// Radius of the tube.
    pub minor_radius: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> Torus<S> {
    /// Create a torus with given major and minor radii.
    pub fn new(major_radius: S, minor_radius: S) -> Self {
        let extent = major_radius + minor_radius;
        Torus {
            major_radius,
            minor_radius,
            bbox: BoundingBox::new(
                &na::Point3::new(-extent, -minor_radius, -extent),
                &na::Point3::new(extent, minor_radius, extent),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for Torus<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let xz_len = (p.x * p.x + p.z * p.z).sqrt();
        let q_x = xz_len - self.major_radius;
        (q_x * q_x + p.y * p.y).sqrt() - self.minor_radius
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        let xz_len = (p.x * p.x + p.z * p.z).sqrt();
        let zero: S = From::from(0f32);
        if xz_len < From::from(1e-10f32) {
            return na::Vector3::new(
                zero,
                if p.y >= zero {
                    From::from(1f32)
                } else {
                    From::from(-1f32)
                },
                zero,
            );
        }
        let center_x = p.x * self.major_radius / xz_len;
        let center_z = p.z * self.major_radius / xz_len;
        na::Vector3::new(p.x - center_x, p.y, p.z - center_z).normalize()
    }
}

/// Infinite cylinder along the Y axis, centered at the origin.
pub struct Cylinder<S: na::Scalar> {
    /// Radius of the cylinder.
    pub radius: S,
    /// Half-height of the cylinder (capped).
    pub half_height: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> Cylinder<S> {
    /// Create a capped cylinder along Y with given radius and half-height.
    pub fn new(radius: S, half_height: S) -> Self {
        Cylinder {
            radius,
            half_height,
            bbox: BoundingBox::new(
                &na::Point3::new(-radius, -half_height, -radius),
                &na::Point3::new(radius, half_height, radius),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for Cylinder<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let zero: S = From::from(0f32);
        let d_radial = (p.x * p.x + p.z * p.z).sqrt() - self.radius;
        let d_height = p.y.abs() - self.half_height;
        let outside = na::Vector2::new(d_radial.max(zero), d_height.max(zero)).norm();
        let inside = d_radial.max(d_height).min(zero);
        outside + inside
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        finite_difference_normal(self, p)
    }
}

/// Gyroid minimal surface: `sin(sx)cos(sy) + sin(sy)cos(sz) + sin(sz)cos(sx) - threshold`.
pub struct Gyroid<S: na::Scalar> {
    /// Scaling factor applied to coordinates (controls period).
    pub scale: S,
    /// Iso-value threshold (typically 0 for the surface).
    pub threshold: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> Gyroid<S> {
    /// Create a gyroid with given `scale` and `threshold`, bounded by `bounds`.
    pub fn new(scale: S, threshold: S, bounds: S) -> Self {
        Gyroid {
            scale,
            threshold,
            bbox: BoundingBox::new(
                &na::Point3::new(-bounds, -bounds, -bounds),
                &na::Point3::new(bounds, bounds, bounds),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for Gyroid<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let sx = (p.x * self.scale).sin();
        let cx = (p.x * self.scale).cos();
        let sy = (p.y * self.scale).sin();
        let cy = (p.y * self.scale).cos();
        let sz = (p.z * self.scale).sin();
        let cz = (p.z * self.scale).cos();
        sx * cy + sy * cz + sz * cx - self.threshold
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        let s = self.scale;
        let sx = (p.x * s).sin();
        let cx = (p.x * s).cos();
        let sy = (p.y * s).sin();
        let cy = (p.y * s).cos();
        let sz = (p.z * s).sin();
        let cz = (p.z * s).cos();
        na::Vector3::new(
            s * (cx * cy - sz * sx),
            s * (-sx * sy + cy * cz),
            s * (-sy * sz + cz * cx),
        )
        .normalize()
    }
}

/// Schwarz P minimal surface: `cos(sx) + cos(sy) + cos(sz) - threshold`.
pub struct SchwartzP<S: na::Scalar> {
    /// Scaling factor applied to coordinates.
    pub scale: S,
    /// Iso-value threshold.
    pub threshold: S,
    bbox: BoundingBox<S>,
}

impl<S: na::RealField + Copy + From<f32>> SchwartzP<S> {
    /// Create a Schwarz P surface with given `scale` and `threshold`, bounded by `bounds`.
    pub fn new(scale: S, threshold: S, bounds: S) -> Self {
        SchwartzP {
            scale,
            threshold,
            bbox: BoundingBox::new(
                &na::Point3::new(-bounds, -bounds, -bounds),
                &na::Point3::new(bounds, bounds, bounds),
            ),
        }
    }
}

impl<S: na::RealField + Copy + Debug + From<f32>> ImplicitFunction<S> for SchwartzP<S> {
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        (p.x * self.scale).cos() + (p.y * self.scale).cos() + (p.z * self.scale).cos()
            - self.threshold
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        let s = self.scale;
        na::Vector3::new(
            -s * (p.x * s).sin(),
            -s * (p.y * s).sin(),
            -s * (p.z * s).sin(),
        )
        .normalize()
    }
}

// ---------------------------------------------------------------------------
// CSG Operations
// ---------------------------------------------------------------------------

/// CSG union of two implicit functions (boolean OR).
pub struct Union<S: na::Scalar, A, B> {
    /// First operand.
    pub a: A,
    /// Second operand.
    pub b: B,
    bbox: BoundingBox<S>,
}

impl<S, A, B> Union<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    /// Create the union of `a` and `b`.
    pub fn new(a: A, b: B) -> Self {
        let bbox = a.bbox().union(b.bbox());
        Union { a, b, bbox }
    }
}

impl<S, A, B> ImplicitFunction<S> for Union<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let va = self.a.value(p);
        let vb = self.b.value(p);
        if va <= vb {
            va
        } else {
            vb
        }
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        if self.a.value(p) <= self.b.value(p) {
            self.a.normal(p)
        } else {
            self.b.normal(p)
        }
    }
}

/// CSG intersection of two implicit functions (boolean AND).
pub struct Intersection<S: na::Scalar, A, B> {
    /// First operand.
    pub a: A,
    /// Second operand.
    pub b: B,
    bbox: BoundingBox<S>,
}

impl<S, A, B> Intersection<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    /// Create the intersection of `a` and `b`.
    pub fn new(a: A, b: B) -> Self {
        let bbox = a.bbox().union(b.bbox());
        Intersection { a, b, bbox }
    }
}

impl<S, A, B> ImplicitFunction<S> for Intersection<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let va = self.a.value(p);
        let vb = self.b.value(p);
        if va >= vb {
            va
        } else {
            vb
        }
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        if self.a.value(p) >= self.b.value(p) {
            self.a.normal(p)
        } else {
            self.b.normal(p)
        }
    }
}

/// CSG subtraction: `a` minus `b` (boolean A AND NOT B).
pub struct Subtraction<S: na::Scalar, A, B> {
    /// Shape to subtract from.
    pub a: A,
    /// Shape to subtract.
    pub b: B,
    bbox: BoundingBox<S>,
}

impl<S, A, B> Subtraction<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    /// Create `a` minus `b`.
    pub fn new(a: A, b: B) -> Self {
        let bbox = a.bbox().clone();
        Subtraction { a, b, bbox }
    }
}

impl<S, A, B> ImplicitFunction<S> for Subtraction<S, A, B>
where
    S: na::RealField + Copy + Debug + From<f32>,
    A: ImplicitFunction<S>,
    B: ImplicitFunction<S>,
{
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let va = self.a.value(p);
        let neg_vb = -self.b.value(p);
        if va >= neg_vb {
            va
        } else {
            neg_vb
        }
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        let va = self.a.value(p);
        let neg_vb = -self.b.value(p);
        if va >= neg_vb {
            self.a.normal(p)
        } else {
            -self.b.normal(p)
        }
    }
}

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

/// Translates an implicit function by an offset.
pub struct Translate<S: na::Scalar, T> {
    inner: T,
    offset: na::Vector3<S>,
    bbox: BoundingBox<S>,
}

impl<S, T> Translate<S, T>
where
    S: na::RealField + Copy + Debug + From<f32>,
    T: ImplicitFunction<S>,
{
    /// Translate `inner` by `offset`.
    pub fn new(inner: T, offset: na::Vector3<S>) -> Self {
        let src = inner.bbox();
        let bbox = BoundingBox::new(
            &na::Point3::new(
                src.min.x + offset.x,
                src.min.y + offset.y,
                src.min.z + offset.z,
            ),
            &na::Point3::new(
                src.max.x + offset.x,
                src.max.y + offset.y,
                src.max.z + offset.z,
            ),
        );
        Translate {
            inner,
            offset,
            bbox,
        }
    }
}

impl<S, T> ImplicitFunction<S> for Translate<S, T>
where
    S: na::RealField + Copy + Debug + From<f32>,
    T: ImplicitFunction<S>,
{
    fn bbox(&self) -> &BoundingBox<S> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<S>) -> S {
        let q = na::Point3::new(
            p.x - self.offset.x,
            p.y - self.offset.y,
            p.z - self.offset.z,
        );
        self.inner.value(&q)
    }
    fn normal(&self, p: &na::Point3<S>) -> na::Vector3<S> {
        let q = na::Point3::new(
            p.x - self.offset.x,
            p.y - self.offset.y,
            p.z - self.offset.z,
        );
        self.inner.normal(&q)
    }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/// Compute the normal of an implicit function at a point using central finite differences.
pub fn finite_difference_normal<S: na::RealField + Copy + Debug + From<f32>>(
    f: &dyn ImplicitFunction<S>,
    p: &na::Point3<S>,
) -> na::Vector3<S> {
    let eps: S = From::from(0.0001f32);
    let dx = f.value(&na::Point3::new(p.x + eps, p.y, p.z))
        - f.value(&na::Point3::new(p.x - eps, p.y, p.z));
    let dy = f.value(&na::Point3::new(p.x, p.y + eps, p.z))
        - f.value(&na::Point3::new(p.x, p.y - eps, p.z));
    let dz = f.value(&na::Point3::new(p.x, p.y, p.z + eps))
        - f.value(&na::Point3::new(p.x, p.y, p.z - eps));
    na::Vector3::new(dx, dy, dz).normalize()
}
