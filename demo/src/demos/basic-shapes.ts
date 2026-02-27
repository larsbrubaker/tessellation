/**
 * Basic shapes demo: Sphere, Rounded Box, Torus.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import { DemoRenderer } from "../renderer";
import {
  createSlider,
  createDropdown,
  createCheckbox,
  createSeparator,
  createReadout,
  updateReadout,
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
fn value(&self, p: &Point3<f64>) -> f64 {
    Vector3::new(p.x, p.y, p.z).norm()
        - self.radius
}

// WASM call:
tessellate_sphere(radius, cell_size)`;

const ROUNDED_BOX_CODE = `// Rust SDF: RoundedBox
fn value(&self, p: &Point3<f64>) -> f64 {
    let q = Vector3::new(
        p.x.abs() - self.half.x,
        p.y.abs() - self.half.y,
        p.z.abs() - self.half.z,
    );
    let outer = Vector3::new(
        q.x.max(0.0), q.y.max(0.0), q.z.max(0.0)
    ).norm();
    outer + q.x.max(q.y).max(q.z).min(0.0)
        - self.radius
}

// WASM call:
tessellate_rounded_box(hx, hy, hz, radius, cell_size)`;

const TORUS_CODE = `// Rust SDF: Torus
fn value(&self, p: &Point3<f64>) -> f64 {
    let q_x = (p.x * p.x + p.z * p.z).sqrt()
        - self.major_radius;
    (q_x * q_x + p.y * p.y).sqrt()
        - self.minor_radius
}

// WASM call:
tessellate_torus(major, minor, cell_size)`;

export default async function init(
  container: HTMLElement
): Promise<{ dispose: () => void }> {
  await initWasm();

  container.innerHTML = `
    <div class="demo-page">
      <div class="demo-header">
        <h2>Basic Shapes</h2>
        <p>Tessellate spheres, rounded boxes, and tori with adjustable parameters.</p>
      </div>
      <div class="demo-body">
        <div class="demo-canvas-area" id="demo-viewport">
          <div class="canvas-hint">Drag to rotate &middot; Scroll to zoom</div>
        </div>
        <div class="demo-controls" id="demo-controls"></div>
      </div>
    </div>
  `;

  const viewport = document.getElementById("demo-viewport")!;
  const controlsPanel = document.getElementById("demo-controls")!;
  const renderer = new DemoRenderer(viewport);

  let shape = "sphere";
  let radius = 1.0;
  let size = 0.8;
  let cornerRadius = 0.05;
  let majorRadius = 0.8;
  let minorRadius = 0.25;
  let cellSize = 0.15;

  const readout = createReadout();
  const codePanel = createCodePanel(SPHERE_CODE);

  const shapeSelect = createDropdown(
    "Shape",
    [
      { value: "sphere", text: "Sphere" },
      { value: "box", text: "Rounded Box" },
      { value: "torus", text: "Torus" },
    ],
    "sphere",
    (v) => {
      shape = v;
      updateControlVisibility();
      updateCodePanel();
      update();
    }
  );

  const sphereRadiusSlider = createSlider("Radius", 0.3, 2.0, radius, 0.01, (v) => {
    radius = v;
    update();
  });

  const boxSizeSlider = createSlider("Size", 0.3, 1.5, size, 0.01, (v) => {
    size = v;
    update();
  });

  const boxCornerSlider = createSlider("Corner Radius", 0, 0.3, cornerRadius, 0.01, (v) => {
    cornerRadius = v;
    update();
  });

  const torusMajorSlider = createSlider("Major Radius", 0.3, 1.5, majorRadius, 0.01, (v) => {
    majorRadius = v;
    update();
  });

  const torusMinorSlider = createSlider("Minor Radius", 0.1, 0.5, minorRadius, 0.01, (v) => {
    minorRadius = v;
    update();
  });

  const resolutionSlider = createSlider("Cell Size", 0.05, 0.5, cellSize, 0.01, (v) => {
    cellSize = v;
    update();
  });

  const wireframeToggle = createCheckbox("Wireframe", false, (v) => {
    renderer.setWireframe(v);
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
    updateReadout(readout, [
      { label: "Vertices", value: result.vertCount.toLocaleString() },
      { label: "Faces", value: result.faceCount.toLocaleString() },
      { label: "Time", value: `${result.elapsedMs.toFixed(1)} ms` },
    ]);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    shapeSelect,
    sphereRadiusSlider,
    boxSizeSlider,
    boxCornerSlider,
    torusMajorSlider,
    torusMinorSlider,
    createSeparator(),
    resolutionSlider,
    wireframeToggle,
    createSeparator(),
    readout,
    codePanel.element
  );
  updateControlVisibility();
  update();

  return { dispose: () => renderer.dispose() };
}
