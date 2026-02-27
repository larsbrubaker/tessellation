/**
 * Resolution demo: quality vs. performance tradeoff.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import { DemoRenderer } from "../renderer";
import {
  createSlider,
  createCheckbox,
  createSeparator,
  createReadout,
  updateReadout,
  createInfoBox,
} from "../controls";
import { initWasm, parseMeshResult, tessellateSphere } from "../wasm";

export default async function init(
  container: HTMLElement
): Promise<{ dispose: () => void }> {
  await initWasm();

  container.innerHTML = `
    <div class="demo-page">
      <div class="demo-header">
        <h2>Resolution &amp; Quality</h2>
        <p>Explore the quality vs. performance tradeoff by adjusting cell size.</p>
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

  let cellSize = 0.15;

  const readout = createReadout();

  const cellSizeSlider = createSlider(
    "Cell Size",
    0.02,
    0.5,
    cellSize,
    0.01,
    (v) => {
      cellSize = v;
      update();
    }
  );

  const wireframeToggle = createCheckbox("Wireframe", false, (v) => {
    renderer.setWireframe(v);
  });

  const infoBox = createInfoBox(
    "Smaller cell size = higher resolution and more vertices/faces, but slower tessellation. " +
      "Larger cell size = faster generation with a coarser mesh."
  );

  function update(): void {
    const data = tessellateSphere(1.0, cellSize);
    const result = parseMeshResult(data);
    updateReadout(readout, [
      { label: "Vertices", value: result.vertCount.toLocaleString() },
      { label: "Faces", value: result.faceCount.toLocaleString() },
      { label: "Time", value: `${result.elapsedMs.toFixed(1)} ms` },
    ]);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    infoBox,
    cellSizeSlider,
    wireframeToggle,
    createSeparator(),
    readout
  );
  update();

  return { dispose: () => renderer.dispose() };
}
