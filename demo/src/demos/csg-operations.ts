/**
 * CSG operations demo: Union, Intersection, Subtraction.
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
import { initWasm, parseMeshResult, tessellateCsg } from "../wasm";

const CSG_CODE = `// Constructive Solid Geometry
// Shapes: 0=Sphere, 1=Box, 2=Torus

let a = make_shape(shape_a);
let b = make_shape(shape_b);

let result = match operation {
    0 => Union::new(a, b),
    1 => Intersection::new(a, b),
    _ => Subtraction::new(a, b),
};

// WASM call:
tessellate_csg(shape_a, shape_b, op, cell_size)`;

export default async function init(
  container: HTMLElement
): Promise<{ dispose: () => void }> {
  await initWasm();

  container.innerHTML = `
    <div class="demo-page">
      <div class="demo-header">
        <h2>CSG Operations</h2>
        <p>Combine shapes with Union, Intersection, and Subtraction.</p>
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

  let shapeA = 0;
  let shapeB = 1;
  let operation = 0;
  let cellSize = 0.15;

  const readout = createReadout();
  const codePanel = createCodePanel(CSG_CODE);

  const shapeOpts = [
    { value: "0", text: "Sphere" },
    { value: "1", text: "Box" },
    { value: "2", text: "Torus" },
  ];

  const shapeASelect = createDropdown("Shape A", shapeOpts, "0", (v) => {
    shapeA = Number(v);
    update();
  });

  const shapeBSelect = createDropdown("Shape B", shapeOpts, "1", (v) => {
    shapeB = Number(v);
    update();
  });

  const opSelect = createDropdown(
    "Operation",
    [
      { value: "0", text: "Union (A ∪ B)" },
      { value: "1", text: "Intersection (A ∩ B)" },
      { value: "2", text: "Subtraction (A − B)" },
    ],
    "0",
    (v) => {
      operation = Number(v);
      update();
    }
  );

  const resolutionSlider = createSlider("Cell Size", 0.05, 0.5, cellSize, 0.01, (v) => {
    cellSize = v;
    update();
  });

  const wireframeToggle = createCheckbox("Wireframe", false, (v) => {
    renderer.setWireframe(v);
  });

  function update(): void {
    const data = tessellateCsg(shapeA, shapeB, operation, cellSize);
    const result = parseMeshResult(data);
    updateReadout(readout, [
      { label: "Vertices", value: result.vertCount.toLocaleString() },
      { label: "Faces", value: result.faceCount.toLocaleString() },
      { label: "Time", value: `${result.elapsedMs.toFixed(1)} ms` },
    ]);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    shapeASelect,
    shapeBSelect,
    opSelect,
    createSeparator(),
    resolutionSlider,
    wireframeToggle,
    createSeparator(),
    readout,
    codePanel.element
  );
  update();

  return { dispose: () => renderer.dispose() };
}
