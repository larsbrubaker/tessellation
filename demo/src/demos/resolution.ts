/**
 * Resolution demo: quality vs performance tradeoff.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import { DemoRenderer } from "../renderer";
import {
  createSlider,
  createToggle,
  createStats,
} from "../controls";
import { initWasm, parseMeshResult, tessellateSphere } from "../wasm";

const EXPLANATION =
  "Smaller cell size = higher resolution and more vertices/faces, but slower tessellation. " +
  "Larger cell size = faster generation with a coarser mesh.";

export default async function init(container: HTMLElement): Promise<{ dispose: () => void }> {
  await initWasm();

  const viewport = document.createElement("div");
  viewport.className = "viewport";
  const controlsPanel = document.createElement("div");
  controlsPanel.className = "controls-panel";

  container.appendChild(viewport);
  container.appendChild(controlsPanel);

  const renderer = new DemoRenderer(viewport);

  let cellSize = 0.15;
  let wireframe = false;

  const stats = createStats();

  const cellSizeSlider = createSlider({
    label: "Cell size (resolution)",
    min: 0.02,
    max: 0.5,
    step: 0.01,
    value: cellSize,
    onChange: (v) => {
      cellSize = v;
      update();
    },
  });
  cellSizeSlider.classList.add("control-row-prominent");

  const wireframeToggle = createToggle({
    label: "Wireframe",
    checked: wireframe,
    onChange: (v) => {
      wireframe = v;
      renderer.setWireframe(v);
    },
  });

  const explanation = document.createElement("p");
  explanation.className = "demo-explanation";
  explanation.textContent = EXPLANATION;

  function update(): void {
    const data = tessellateSphere(1.0, cellSize);
    const result = parseMeshResult(data);
    stats.update(result.vertCount, result.faceCount, result.elapsedMs);
    renderer.updateMesh(result.vertices, result.indices, result.normals);
  }

  controlsPanel.append(
    cellSizeSlider,
    wireframeToggle,
    stats.element,
    explanation
  );
  update();

  return { dispose: () => renderer.dispose() };
}
