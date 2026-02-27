use tessellation::{sdf, ManifoldDualContouring};

fn main() {
    let sphere = sdf::Sphere::new(1.0);
    let mut mdc = ManifoldDualContouring::new(&sphere, 0.1, 0.1);
    let mesh = mdc.tessellate().unwrap();

    println!("Sphere mesh: {} vertices, {} faces", mesh.vertices.len(), mesh.faces.len());
    println!("First 5 vertices:");
    for (i, v) in mesh.vertices.iter().take(5).enumerate() {
        println!("  v{}: ({:.4}, {:.4}, {:.4})", i, v[0], v[1], v[2]);
    }
}
