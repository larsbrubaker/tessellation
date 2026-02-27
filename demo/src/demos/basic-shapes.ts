/**
 * Basic shapes demo: Sphere, Rounded Box, Torus.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import { DemoRenderer } from "../renderer";
import {
  createSlider,
  createSelect,
  createToggle,
  createStats,
  createCodePanel,
} from "../controls";
import {
  initWasm,
  parseMeshResult,
  tessellateSphere,
  tessellateRoundedBox,
  tessellateTorus,
} from "../wasm";

const SPHERE_CODE = `// Rust SDF: Sphere
impl ImplicitFunction<f64> for Sphere {
  fn sample(&self, p: &Vector3<f64>) -> f64 {
    p.norm() - self.radius
  }
}

// WASM call:
tessellate_sphere(radius, cell_size)`;

const ROUNDED_BOX_CODE = `// Rust SDF: RoundedBox
impl ImplicitFunction<f64> for RoundedBox {
  fn sample(&self, p: &Vector3<f64>) -> f64 {
    let q = p.abs() - self.half_extents;
    q.map(|x| x.max(0.0)).norm()
      + q.x.max(q.y).max(q.z).min(0.0)
      - self.radius
  }
}

// WASM call:
tessellate_rounded_box(hx, hy, hz, radius, cell_size)`;

const TORUS_CODE = `// Rust SDF: Torus
impl ImplicitFunction<f64> for Torus {
  fn sample(&self, p: &Vector3<f64>) -> f64 {
    let q = Vector2::new(
      Vector2::new(p.x, p.z).norm() - self.major_radius,
      p.y
    );
    q.norm() - self.minor_radius
  }
}

// WASM call:
tessellate_torus(major_radius, minor_radius, cell_size)`;

export default async function init(container: HTMLElement): Promise<{ dispose: () => void }> {
  await initWasm();

  const viewport = document.createElement("div");
  viewport.className = "viewport";
  const controlsPanel = document.createElement("div");
  controlsPanel.className = "controls-panel";

  container.appendChild(viewport);
  container.appendChild(controlsPanel);

  const renderer = new DemoRenderer(viewport);

  let shape: "sphere" | "box" | "torus" = "sphere";
  let radius = 1.0;
  let size = 0.8;
  let cornerRadius = 0.05;
  let majorRadius = 0.8;
  let minorRadius = 0.25;
  let cellSize = 0.15;
  let wireframe = false;

  const stats = createStats();
  const codePanel = createCodePanel(SPHERE_CODE);

  const shapeSelect = createSelect({
    label: "Shape",
    options: [
      { value: "sphere", text: "Sphere" },
      { value: "box", text: "Rounded Box" },
      { value: "torus", text: "Torus" },
    ],
    value: "sphere",
    onChange: (v) => {
      shape = v as "sphere" | "box" | "torus";
      updateControlVisibility();
      updateCodePanel();
      update();
    },
  });

  const sphereRadiusSlider = createSlider({
    label: "Radius",
    min: 0.3,
    max: 2.0,
    step: 0.01,
    value: radius,
    onChange: (v) => { radius = v; update(); },
  });

  const boxSizeSlider = createSlider({
    label: "Size",
    min: 0.3,
    max: 1.5,
    step: 0.01,
    value: size,
    onChange: (v) => { size = v; update(); },
  });

  const boxCornerSlider = createSlider({
    label: "Corner radius",
    min: 0,
    max: 0.3,
    step: 0.01,
    value: cornerRadius,
    onChange: (v) => { cornerRadius = v; update(); },
  });

  const torusMajorSlider = createSlider({
    label: "Major radius",
    min: 0.3,
    max: 1.5,
    step: 0.01,
    value: majorRadius,
    onChange: (v) => { majorRadius = v; update(); },
  });

  const torusMinorSlider = createSlider({
    label: "Minor radius",
    min: 0.1,
    max: 0.5,
    step: 0.01,
    value: minorRadius,
    onChange: (v) => { minorRadius = v; update(); },
  });

  const resolutionSlider = createSlider({
    label: "Resolution (cell size)",
    min: 0.05,
    max: 0.5,
    step: 0.01,
    value: cellSize,
    onChange: (v) => { cellSize = v; update(); },
  });

  const wireframeToggle = createToggle({
    label: "Wireframe",
    checked: wireframe,
    onChange: (v) => { wireframe = v; renderer.setWireframe(v); },
  });

  function updateControlVisibility(): void {
    sphereRadiusSlider.style.display = shape === "sphere" ? "" : "none";
    boxSizeSlider.style.display = shape === "box" ? "" : "none";
    boxCornerSlider.style.display = shape === "box" ? "" : "none";
    torusMajorSlider.style.display = shape === "torus" ? "" : "none";
    torusMinorSlider.style.display = shape === "torus" ? "" : "none";
  }

  function updateCodePanel(): void {
    if (shape === "sphere") codePanel.setCode(SPHERE_CODE);
    else if (shape === "box") codePanel.setCode(ROUNDED_BOX_CODE);
    else codePanel.setCode(TORUS_CODE);
  }

  function update(): void {
    let data: Float32Array;
    if (shape === "sphere") {
      data = tessellateSphere(radius, cellSize);
    } else if (shape === "box") {
      const h = size / 2;
      data = tessellateRoundedBox(h, h, h, cornerRadius, cellSize);
    } else {
      data = tessellateTorus(majorRadius, minorRadius, cellSize);
    }
    const result = parseMeshResult(data);
    stats.update(result.vertCount, result.faceCount, result.elapsedMs);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    shapeSelect,
    sphereRadiusSlider,
    boxSizeSlider,
    boxCornerSlider,
    torusMajorSlider,
    torusMinorSlider,
    resolutionSlider,
    wireframeToggle,
    stats.element,
    codePanel.element
  );
  updateControlVisibility();
  updateCodePanel();
  update();

  return { dispose: () => renderer.dispose() };
}
