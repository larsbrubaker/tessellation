use nalgebra as na;
use nalgebra::Scalar;
use num_traits::Float;

/// Axis-aligned bounding box in 3D space.
#[derive(Clone, Debug, PartialEq)]
pub struct BoundingBox<S: Scalar> {
    /// Minimum corner of the bounding box.
    pub min: na::Point3<S>,
    /// Maximum corner of the bounding box.
    pub max: na::Point3<S>,
}

impl<S: Scalar + Copy + PartialOrd + std::ops::Add<Output = S> + std::ops::Sub<Output = S>>
    BoundingBox<S>
{
    /// Create a new bounding box from min and max points.
    pub fn new(min: &na::Point3<S>, max: &na::Point3<S>) -> Self {
        BoundingBox {
            min: *min,
            max: *max,
        }
    }

    /// Returns the dimensions (max - min) as a vector.
    pub fn dim(&self) -> na::Vector3<S> {
        na::Vector3::new(
            self.max.x - self.min.x,
            self.max.y - self.min.y,
            self.max.z - self.min.z,
        )
    }

    /// Returns true if the point is inside or on the boundary of this bounding box.
    pub fn contains(&self, point: &na::Point3<S>) -> bool {
        point.x >= self.min.x
            && point.x <= self.max.x
            && point.y >= self.min.y
            && point.y <= self.max.y
            && point.z >= self.min.z
            && point.z <= self.max.z
    }

    /// Returns a new bounding box expanded by `amount` in all directions.
    pub fn dilate(&self, amount: S) -> BoundingBox<S> {
        BoundingBox {
            min: na::Point3::new(
                self.min.x - amount,
                self.min.y - amount,
                self.min.z - amount,
            ),
            max: na::Point3::new(
                self.max.x + amount,
                self.max.y + amount,
                self.max.z + amount,
            ),
        }
    }

    /// Returns the smallest bounding box that contains both `self` and `other`.
    pub fn union(&self, other: &BoundingBox<S>) -> BoundingBox<S> {
        let min_x = if self.min.x <= other.min.x {
            self.min.x
        } else {
            other.min.x
        };
        let min_y = if self.min.y <= other.min.y {
            self.min.y
        } else {
            other.min.y
        };
        let min_z = if self.min.z <= other.min.z {
            self.min.z
        } else {
            other.min.z
        };
        let max_x = if self.max.x >= other.max.x {
            self.max.x
        } else {
            other.max.x
        };
        let max_y = if self.max.y >= other.max.y {
            self.max.y
        } else {
            other.max.y
        };
        let max_z = if self.max.z >= other.max.z {
            self.max.z
        } else {
            other.max.z
        };
        BoundingBox {
            min: na::Point3::new(min_x, min_y, min_z),
            max: na::Point3::new(max_x, max_y, max_z),
        }
    }
}

impl<S: Scalar + Copy + Float> BoundingBox<S> {
    /// Returns a bounding box with min at positive infinity and max at negative infinity.
    /// Useful as an identity element for union operations.
    pub fn neg_infinity() -> Self {
        let inf = S::infinity();
        let neg_inf = S::neg_infinity();
        BoundingBox {
            min: na::Point3::new(inf, inf, inf),
            max: na::Point3::new(neg_inf, neg_inf, neg_inf),
        }
    }
}
