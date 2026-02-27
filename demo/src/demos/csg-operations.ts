/**
 * CSG operations demo: Union, Intersection, Subtraction.
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
import { initWasm, parseMeshResult, tessellateCsg } from "../wasm";

const CSG_CODE = `// Rust CSG operations (Constructive Solid Geometry)
// shape_a, shape_b: 0=Sphere, 1=Box, 2=Torus
// operation: 0=Union, 1=Intersection, 2=Subtraction

let a = make_shape(shape_a, 0.5, 0.0, 0.0);
let b = make_shape(shape_b, -0.5, 0.0, 0.0);

let mesh = match operation {
  0 => Union::new(a, b),        // A ∪ B
  1 => Intersection::new(a, b), // A ∩ B
  _ => Subtraction::new(a, b),  // A - B
};

// WASM call:
tessellate_csg(shape_a, shape_b, operation, cell_size)`;

export default async function init(container: HTMLElement): Promise<{ dispose: () => void }> {
  await initWasm();

  const viewport = document.createElement("div");
  viewport.className = "viewport";
  const controlsPanel = document.createElement("div");
  controlsPanel.className = "controls-panel";

  container.appendChild(viewport);
  container.appendChild(controlsPanel);

  const renderer = new DemoRenderer(viewport);

  let shapeA = 0;
  let shapeB = 1;
  let operation = 0;
  let cellSize = 0.15;
  let wireframe = false;

  const stats = createStats();
  const codePanel = createCodePanel(CSG_CODE);

  const shapeASelect = createSelect({
    label: "Shape A",
    options: [
      { value: "0", text: "Sphere" },
      { value: "1", text: "Box" },
      { value: "2", text: "Torus" },
    ],
    value: "0",
    onChange: (v) => {
      shapeA = Number(v);
      update();
    },
  });

  const shapeBSelect = createSelect({
    label: "Shape B",
    options: [
      { value: "0", text: "Sphere" },
      { value: "1", text: "Box" },
      { value: "2", text: "Torus" },
    ],
    value: "1",
    onChange: (v) => {
      shapeB = Number(v);
      update();
    },
  });

  const opSelect = createSelect({
    label: "Operation",
    options: [
      { value: "0", text: "Union" },
      { value: "1", text: "Intersection" },
      { value: "2", text: "Subtraction" },
    ],
    value: "0",
    onChange: (v) => {
      operation = Number(v);
      update();
    },
  });

  const resolutionSlider = createSlider({
    label: "Resolution (cell size)",
    min: 0.05,
    max: 0.5,
    step: 0.01,
    value: cellSize,
    onChange: (v) => {
      cellSize = v;
      update();
    },
  });

  const wireframeToggle = createToggle({
    label: "Wireframe",
    checked: wireframe,
    onChange: (v) => {
      wireframe = v;
      renderer.setWireframe(v);
    },
  });

  function update(): void {
    const data = tessellateCsg(shapeA, shapeB, operation, cellSize);
    const result = parseMeshResult(data);
    stats.update(result.vertCount, result.faceCount, result.elapsedMs);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    shapeASelect,
    shapeBSelect,
    opSelect,
    resolutionSlider,
    wireframeToggle,
    stats.element,
    codePanel.element
  );
  update();

  return { dispose: () => renderer.dispose() };
}
