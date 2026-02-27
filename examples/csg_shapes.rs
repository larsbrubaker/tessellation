use nalgebra as na;
use tessellation::{sdf, ManifoldDualContouring};

fn main() {
    println!("=== CSG Union: Sphere + Translated Sphere ===");
    let s1 = sdf::Sphere::new(1.0);
    let s2 = sdf::Translate::new(sdf::Sphere::new(0.8), na::Vector3::new(0.7, 0.0, 0.0));
    let union = sdf::Union::new(s1, s2);
    let mut mdc = ManifoldDualContouring::new(&union, 0.1, 0.1);
    let mesh = mdc.tessellate().unwrap();
    println!(
        "  Union: {} vertices, {} faces\n",
        mesh.vertices.len(),
        mesh.faces.len()
    );

    println!("=== CSG Intersection: Sphere & Box ===");
    let sphere = sdf::Sphere::new(1.0);
    let cube = sdf::RoundedBox::new(na::Vector3::new(0.7, 0.7, 0.7), 0.0);
    let intersection = sdf::Intersection::new(sphere, cube);
    let mut mdc = ManifoldDualContouring::new(&intersection, 0.1, 0.1);
    let mesh = mdc.tessellate().unwrap();
    println!(
        "  Intersection: {} vertices, {} faces\n",
        mesh.vertices.len(),
        mesh.faces.len()
    );

    println!("=== CSG Subtraction: Sphere - Cylinder ===");
    let sphere = sdf::Sphere::new(1.0);
    let hole = sdf::Cylinder::new(0.4, 2.0);
    let result = sdf::Subtraction::new(sphere, hole);
    let mut mdc = ManifoldDualContouring::new(&result, 0.1, 0.1);
    let mesh = mdc.tessellate().unwrap();
    println!(
        "  Subtraction: {} vertices, {} faces",
        mesh.vertices.len(),
        mesh.faces.len()
    );
}
