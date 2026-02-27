use nalgebra as na;
use tessellation::{sdf, ManifoldDualContouring, Mesh};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

fn mesh_to_flat_arrays(mesh: &Mesh<f64>) -> (Vec<f32>, Vec<u32>, Vec<f32>) {
    let mut vertices = Vec::with_capacity(mesh.vertices.len() * 3);
    let mut normals = Vec::with_capacity(mesh.faces.len() * 3 * 3);
    let mut indices = Vec::with_capacity(mesh.faces.len() * 3);

    for v in &mesh.vertices {
        vertices.push(v[0] as f32);
        vertices.push(v[1] as f32);
        vertices.push(v[2] as f32);
    }

    for face in &mesh.faces {
        indices.push(face[0] as u32);
        indices.push(face[1] as u32);
        indices.push(face[2] as u32);
    }

    for i in 0..mesh.faces.len() {
        let n = mesh.normal32(i);
        for _ in 0..3 {
            normals.push(n[0]);
            normals.push(n[1]);
            normals.push(n[2]);
        }
    }

    (vertices, indices, normals)
}

fn pack_result(mesh: &Mesh<f64>, elapsed_ms: f64) -> Vec<f32> {
    let (vertices, indices, normals) = mesh_to_flat_arrays(mesh);
    let vert_count = (vertices.len() / 3) as f32;
    let face_count = (indices.len() / 3) as f32;

    let mut result = Vec::new();
    result.push(vert_count);
    result.push(face_count);
    result.push(elapsed_ms as f32);
    result.push(vertices.len() as f32);
    result.extend_from_slice(&vertices);
    result.push(indices.len() as f32);
    for idx in &indices {
        result.push(*idx as f32);
    }
    result.push(normals.len() as f32);
    result.extend_from_slice(&normals);
    result
}

#[wasm_bindgen]
pub fn tessellate_sphere(radius: f64, cell_size: f64) -> Vec<f32> {
    let start = web_time();
    let sphere = sdf::Sphere::new(radius);
    let mut mdc = ManifoldDualContouring::new(&sphere, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

#[wasm_bindgen]
pub fn tessellate_rounded_box(hx: f64, hy: f64, hz: f64, radius: f64, cell_size: f64) -> Vec<f32> {
    let start = web_time();
    let shape = sdf::RoundedBox::new(na::Vector3::new(hx, hy, hz), radius);
    let mut mdc = ManifoldDualContouring::new(&shape, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

#[wasm_bindgen]
pub fn tessellate_torus(major_radius: f64, minor_radius: f64, cell_size: f64) -> Vec<f32> {
    let start = web_time();
    let shape = sdf::Torus::new(major_radius, minor_radius);
    let mut mdc = ManifoldDualContouring::new(&shape, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

#[wasm_bindgen]
pub fn tessellate_csg(shape_a: u32, shape_b: u32, operation: u32, cell_size: f64) -> Vec<f32> {
    let start = web_time();

    let a = make_shape(shape_a, 0.5, 0.0, 0.0);
    let b = make_shape(shape_b, -0.5, 0.0, 0.0);

    let mesh = match operation {
        0 => {
            let op = sdf::Union::new(a, b);
            let mut mdc = ManifoldDualContouring::new(&op, cell_size, 0.1);
            mdc.tessellate().unwrap()
        }
        1 => {
            let op = sdf::Intersection::new(a, b);
            let mut mdc = ManifoldDualContouring::new(&op, cell_size, 0.1);
            mdc.tessellate().unwrap()
        }
        _ => {
            let op = sdf::Subtraction::new(a, b);
            let mut mdc = ManifoldDualContouring::new(&op, cell_size, 0.1);
            mdc.tessellate().unwrap()
        }
    };

    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

fn make_shape(
    kind: u32,
    tx: f64,
    ty: f64,
    tz: f64,
) -> sdf::Translate<f64, Box<dyn tessellation::ImplicitFunction<f64>>> {
    let inner: Box<dyn tessellation::ImplicitFunction<f64>> = match kind {
        0 => Box::new(sdf::Sphere::new(0.8)),
        1 => Box::new(sdf::RoundedBox::new(na::Vector3::new(0.6, 0.6, 0.6), 0.05)),
        _ => Box::new(sdf::Torus::new(0.6, 0.25)),
    };
    sdf::Translate::new(inner, na::Vector3::new(tx, ty, tz))
}

#[wasm_bindgen]
pub fn tessellate_gyroid(scale: f64, cell_size: f64, bounds: f64) -> Vec<f32> {
    let start = web_time();
    let shape = sdf::Gyroid::new(scale, 0.0, bounds);
    let mut mdc = ManifoldDualContouring::new(&shape, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

#[wasm_bindgen]
pub fn tessellate_schwartz_p(scale: f64, cell_size: f64, bounds: f64) -> Vec<f32> {
    let start = web_time();
    let shape = sdf::SchwartzP::new(scale, 0.0, bounds);
    let mut mdc = ManifoldDualContouring::new(&shape, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

#[wasm_bindgen]
pub fn tessellate_sphere_hole(cell_size: f64) -> Vec<f32> {
    let start = web_time();
    let sphere = sdf::Sphere::new(1.0);
    let hole = sdf::Cylinder::new(0.4, 2.0);
    let shape = sdf::Subtraction::new(sphere, hole);
    let mut mdc = ManifoldDualContouring::new(&shape, cell_size, 0.1);
    let mesh = mdc.tessellate().unwrap();
    let elapsed = web_time() - start;
    pack_result(&mesh, elapsed)
}

fn web_time() -> f64 {
    #[cfg(target_arch = "wasm32")]
    {
        js_sys::Date::now()
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_tessellate_sphere() {
        console_error_panic_hook::set_once();
        let result = tessellate_sphere(1.0, 0.15);
        assert!(
            !result.is_empty(),
            "tessellate_sphere returned empty result"
        );
    }

    #[wasm_bindgen_test]
    fn test_tessellate_rounded_box() {
        console_error_panic_hook::set_once();
        let result = tessellate_rounded_box(0.4, 0.4, 0.4, 0.05, 0.15);
        assert!(
            !result.is_empty(),
            "tessellate_rounded_box returned empty result"
        );
    }

    #[wasm_bindgen_test]
    fn test_tessellate_torus() {
        console_error_panic_hook::set_once();
        let result = tessellate_torus(0.8, 0.25, 0.15);
        assert!(!result.is_empty(), "tessellate_torus returned empty result");
    }

    #[wasm_bindgen_test]
    fn test_tessellate_gyroid() {
        console_error_panic_hook::set_once();
        let result = tessellate_gyroid(3.14, 0.1, 2.0);
        assert!(
            !result.is_empty(),
            "tessellate_gyroid returned empty result"
        );
    }

    #[wasm_bindgen_test]
    fn test_tessellate_schwartz_p() {
        console_error_panic_hook::set_once();
        let result = tessellate_schwartz_p(3.14, 0.1, 2.0);
        assert!(
            !result.is_empty(),
            "tessellate_schwartz_p returned empty result"
        );
    }

    #[wasm_bindgen_test]
    fn test_tessellate_sphere_hole() {
        console_error_panic_hook::set_once();
        let result = tessellate_sphere_hole(0.1);
        assert!(
            !result.is_empty(),
            "tessellate_sphere_hole returned empty result"
        );
    }

    #[wasm_bindgen_test]
    fn test_tessellate_csg() {
        console_error_panic_hook::set_once();
        let result = tessellate_csg(0, 1, 0, 0.15);
        assert!(!result.is_empty(), "tessellate_csg returned empty result");
    }
}
