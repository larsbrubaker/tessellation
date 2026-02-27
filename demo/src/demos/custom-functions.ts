/**
 * Custom SDF functions demo: Gyroid, Schwarz P, Sphere + Hole.
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
  tessellateGyroid,
  tessellateSchwartzP,
  tessellateSphereHole,
} from "../wasm";

const GYROID_CODE = `// Gyroid — triply periodic minimal surface
fn value(&self, p: &Point3<f64>) -> f64 {
    let s = self.scale;
    (p.x * s).sin() * (p.y * s).cos()
      + (p.y * s).sin() * (p.z * s).cos()
      + (p.z * s).sin() * (p.x * s).cos()
}

// WASM: tessellate_gyroid(scale, cell_size, bounds)`;

const SCHWARTZ_P_CODE = `// Schwarz P — minimal surface
fn value(&self, p: &Point3<f64>) -> f64 {
    let s = self.scale;
    (p.x * s).cos()
      + (p.y * s).cos()
      + (p.z * s).cos()
}

// WASM: tessellate_schwartz_p(scale, cell_size, bounds)`;

const SPHERE_HOLE_CODE = `// Sphere with cylindrical hole (CSG subtraction)
let sphere = Sphere::new(1.0);
let cylinder = Cylinder::new(0.4, 2.0);
let result = Subtraction::new(sphere, cylinder);

// WASM: tessellate_sphere_hole(cell_size)`;

export default async function init(
  container: HTMLElement
): Promise<{ dispose: () => void }> {
  await initWasm();

  container.innerHTML = `
    <div class="demo-page">
      <div class="demo-header">
        <h2>Mathematical Surfaces</h2>
        <p>Tessellate implicit surfaces defined by mathematical formulas.</p>
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

  let surface: "gyroid" | "schwartz" | "sphere_hole" = "gyroid";
  let scale = 3.14;
  let cellSize = 0.1;
  let bounds = 2.0;

  const readout = createReadout();
  const codePanel = createCodePanel(GYROID_CODE);

  const surfaceSelect = createDropdown(
    "Surface",
    [
      { value: "gyroid", text: "Gyroid" },
      { value: "schwartz", text: "Schwarz P" },
      { value: "sphere_hole", text: "Sphere + Hole" },
    ],
    "gyroid",
    (v) => {
      surface = v as typeof surface;
      updateControlVisibility();
      updateCodePanel();
      update();
    }
  );

  const scaleSlider = createSlider("Scale", 1.0, 10.0, scale, 0.01, (v) => {
    scale = v;
    update();
  });

  const boundsSlider = createSlider("Bounds", 1.0, 4.0, bounds, 0.1, (v) => {
    bounds = v;
    update();
  });

  const resolutionSlider = createSlider("Cell Size", 0.05, 0.3, cellSize, 0.01, (v) => {
    cellSize = v;
    update();
  });

  const wireframeToggle = createCheckbox("Wireframe", false, (v) => {
    renderer.setWireframe(v);
  });

  function updateControlVisibility(): void {
    const show = surface !== "sphere_hole";
    scaleSlider.style.display = show ? "" : "none";
    boundsSlider.style.display = show ? "" : "none";
  }

  function updateCodePanel(): void {
    if (surface === "gyroid") codePanel.setCode(GYROID_CODE);
    else if (surface === "schwartz") codePanel.setCode(SCHWARTZ_P_CODE);
    else codePanel.setCode(SPHERE_HOLE_CODE);
  }

  function update(): void {
    let data: Float32Array;
    if (surface === "gyroid") {
      data = tessellateGyroid(scale, cellSize, bounds);
    } else if (surface === "schwartz") {
      data = tessellateSchwartzP(scale, cellSize, bounds);
    } else {
      data = tessellateSphereHole(cellSize);
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
    surfaceSelect,
    scaleSlider,
    boundsSlider,
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
