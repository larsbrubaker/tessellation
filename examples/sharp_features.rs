use nalgebra as na;
use tessellation::{sdf, ManifoldDualContouring};

fn main() {
    println!("=== Sharp Cube (no rounding) ===");
    let cube = sdf::RoundedBox::new(na::Vector3::new(1.0, 1.0, 1.0), 0.0);
    let mut mdc = ManifoldDualContouring::new(&cube, 0.1, 0.0);
    let mesh = mdc.tessellate().unwrap();
    println!("  {} vertices, {} faces\n", mesh.vertices.len(), mesh.faces.len());

    println!("=== Rounded Cube (radius=0.1) ===");
    let rounded = sdf::RoundedBox::new(na::Vector3::new(1.0, 1.0, 1.0), 0.1);
    let mut mdc = ManifoldDualContouring::new(&rounded, 0.08, 0.0);
    let mesh = mdc.tessellate().unwrap();
    println!("  {} vertices, {} faces\n", mesh.vertices.len(), mesh.faces.len());

    println!("=== Torus ===");
    let torus = sdf::Torus::new(1.0, 0.3);
    let mut mdc = ManifoldDualContouring::new(&torus, 0.08, 0.1);
    let mesh = mdc.tessellate().unwrap();
    println!("  {} vertices, {} faces\n", mesh.vertices.len(), mesh.faces.len());

    println!("=== Gyroid Surface ===");
    let gyroid = sdf::Gyroid::new(3.14159, 0.0, 2.0);
    let mut mdc = ManifoldDualContouring::new(&gyroid, 0.08, 0.1);
    let mesh = mdc.tessellate().unwrap();
    println!("  {} vertices, {} faces", mesh.vertices.len(), mesh.faces.len());
}
