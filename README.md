# tessellation

[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE-MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://larsbrubaker.github.io/tessellation/)

A Rust library for generating triangle meshes from implicit functions (signed distance fields) using **Manifold Dual Contouring**.

**[Live Demo](https://larsbrubaker.github.io/tessellation/)** — Interactive 3D demos running entirely in the browser via WebAssembly.

## Features

- **Manifold Dual Contouring** — Produces guaranteed 2-manifold triangle meshes
- **Sharp feature preservation** — Maintains sharp edges and corners through QEF minimization
- **Adaptive octree simplification** — Automatic mesh LOD with configurable error threshold
- **Built-in SDF primitives** — Sphere, RoundedBox, Torus, Cylinder, Gyroid, Schwarz P
- **CSG operations** — Union, Intersection, Subtraction with composable API
- **Parallel grid sampling** — Uses Rayon for multi-threaded value grid generation

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
tessellation = "0.9"
nalgebra = "0.33"
```

### Using built-in SDF primitives

```rust
use tessellation::{sdf, ManifoldDualContouring};

// Create a sphere
let sphere = sdf::Sphere::new(1.0);
let mut mdc = ManifoldDualContouring::new(&sphere, 0.1, 0.1);
let mesh = mdc.tessellate().unwrap();

println!("{} vertices, {} faces", mesh.vertices.len(), mesh.faces.len());
```

### CSG operations

```rust
use nalgebra as na;
use tessellation::{sdf, ManifoldDualContouring};

let sphere = sdf::Sphere::new(1.0);
let hole = sdf::Cylinder::new(0.4, 2.0);
let result = sdf::Subtraction::new(sphere, hole);

let mut mdc = ManifoldDualContouring::new(&result, 0.1, 0.1);
let mesh = mdc.tessellate().unwrap();
```

### Custom implicit function

```rust
use nalgebra as na;

struct UnitSphere {
    bbox: tessellation::BoundingBox<f64>,
}

impl UnitSphere {
    fn new() -> Self {
        UnitSphere {
            bbox: tessellation::BoundingBox::new(
                &na::Point3::new(-1., -1., -1.),
                &na::Point3::new(1., 1., 1.),
            ),
        }
    }
}

impl tessellation::ImplicitFunction<f64> for UnitSphere {
    fn bbox(&self) -> &tessellation::BoundingBox<f64> {
        &self.bbox
    }
    fn value(&self, p: &na::Point3<f64>) -> f64 {
        na::Vector3::new(p.x, p.y, p.z).norm() - 1.0
    }
    fn normal(&self, p: &na::Point3<f64>) -> na::Vector3<f64> {
        na::Vector3::new(p.x, p.y, p.z).normalize()
    }
}
```

## SDF Primitives

| Primitive | Description |
|-----------|-------------|
| `sdf::Sphere` | Sphere centered at origin |
| `sdf::RoundedBox` | Axis-aligned box with rounded edges |
| `sdf::Torus` | Torus in the XZ plane |
| `sdf::Cylinder` | Capped cylinder along Y axis |
| `sdf::Gyroid` | Gyroid triply periodic minimal surface |
| `sdf::SchwartzP` | Schwarz P minimal surface |

### CSG Operations

| Operation | Description |
|-----------|-------------|
| `sdf::Union<A, B>` | Boolean OR of two shapes |
| `sdf::Intersection<A, B>` | Boolean AND of two shapes |
| `sdf::Subtraction<A, B>` | First shape minus second |
| `sdf::Translate<T>` | Translate a shape by an offset |

## Parameters

`ManifoldDualContouring::new(function, resolution, relative_error)`

- **`function`** — Any type implementing `ImplicitFunction<S>`
- **`resolution`** — Grid cell size. Smaller = more detail, more compute time
- **`relative_error`** — Error threshold for octree simplification. `0.0` = no simplification

## Examples

```bash
cargo run --example sphere
cargo run --example csg_shapes
cargo run --example sharp_features
```

## Development

### Building the demo locally

```bash
# Build WASM
cd demo/wasm
wasm-pack build --target web --out-dir ../public/pkg

# Install dependencies and start dev server
cd ..
npm install
npx vite
```

### Running tests

```bash
cargo test
```

## Algorithm

This library implements [Manifold Dual Contouring](http://faculty.cs.tamu.edu/schaefer/research/dualsimp_tvcg.pdf) by Schaefer, Ju, and Warren. The algorithm:

1. Samples the implicit function on an adaptive octree grid
2. Finds zero-crossings on grid edges via bisection
3. Computes Quadratic Error Functions (QEFs) to position vertices optimally
4. Generates quads/triangles connecting vertices across cells
5. Simplifies via octree merging while maintaining 2-manifold topology

## Acknowledgments

This project is based on the original [tessellation](https://github.com/hmeyer/tessellation) crate by Henning Meyer. The codebase has been modernized with updated dependencies and extended with composable SDF primitives and interactive web demos.

## License

Licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT License ([LICENSE-MIT](LICENSE-MIT))

at your option.
