/**
 * Custom SDF functions demo: Gyroid, Schwarz P, Sphere + Hole.
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
  tessellateGyroid,
  tessellateSchwartzP,
  tessellateSphereHole,
} from "../wasm";

const GYROID_CODE = `// Gyroid - triply periodic minimal surface
// implicit: sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x) = 0
// Scale controls frequency, bounds limits domain

tessellate_gyroid(scale, cell_size, bounds)`;

const SCHWARTZ_P_CODE = `// Schwarz P - minimal surface
// implicit: cos(x) + cos(y) + cos(z) = 0
// Scale controls cell size, bounds limits domain

tessellate_schwartz_p(scale, cell_size, bounds)`;

const SPHERE_HOLE_CODE = `// Sphere with cylindrical hole (CSG subtraction)
// sphere(1.0) - cylinder(0.4, 2.0)
// Demonstrates sharp feature handling

tessellate_sphere_hole(cell_size)`;

export default async function init(container: HTMLElement): Promise<{ dispose: () => void }> {
  await initWasm();

  const viewport = document.createElement("div");
  viewport.className = "viewport";
  const controlsPanel = document.createElement("div");
  controlsPanel.className = "controls-panel";

  container.appendChild(viewport);
  container.appendChild(controlsPanel);

  const renderer = new DemoRenderer(viewport);

  let surface: "gyroid" | "schwartz" | "sphere_hole" = "gyroid";
  let scale = 3.14;
  let cellSize = 0.1;
  let bounds = 2.0;
  let wireframe = false;

  const stats = createStats();
  const codePanel = createCodePanel(GYROID_CODE);

  const surfaceSelect = createSelect({
    label: "Surface",
    options: [
      { value: "gyroid", text: "Gyroid" },
      { value: "schwartz", text: "Schwarz P" },
      { value: "sphere_hole", text: "Sphere + Hole" },
    ],
    value: "gyroid",
    onChange: (v) => {
      surface = v as "gyroid" | "schwartz" | "sphere_hole";
      updateControlVisibility();
      updateCodePanel();
      update();
    },
  });

  const scaleSlider = createSlider({
    label: "Scale",
    min: 1.0,
    max: 10.0,
    step: 0.01,
    value: scale,
    onChange: (v) => { scale = v; update(); },
  });

  const boundsSlider = createSlider({
    label: "Bounds",
    min: 1.0,
    max: 4.0,
    step: 0.1,
    value: bounds,
    onChange: (v) => { bounds = v; update(); },
  });

  const resolutionSlider = createSlider({
    label: "Resolution (cell size)",
    min: 0.05,
    max: 0.3,
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
    stats.update(result.vertCount, result.faceCount, result.elapsedMs);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    surfaceSelect,
    scaleSlider,
    boundsSlider,
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
