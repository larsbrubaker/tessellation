/**
 * Tessellation demo SPA — hash router and entry point.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import "./main.css";
import { initWasm } from "./wasm";

const routes = [
  { hash: "", name: "Home", id: "home" },
  { hash: "basic-shapes", name: "Basic Shapes", id: "basic-shapes" },
  { hash: "csg-operations", name: "CSG Operations", id: "csg-operations" },
  { hash: "resolution", name: "Resolution", id: "resolution" },
  { hash: "custom-functions", name: "Custom Functions", id: "custom-functions" },
];


function getRoute(): string {
  const hash = window.location.hash.slice(1).replace(/^\/?/, "") || "";
  return hash;
}

function renderSidebar(activeRoute: string): void {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <h2 style="padding: 0 1rem; margin: 0 0 0.5rem; font-size: 1rem;">Tessellation</h2>
    ${routes
      .map(
        (r) =>
          `<a href="#/${r.hash}" class="${r.hash === activeRoute ? "active" : ""}">${r.name}</a>`
      )
      .join("")}
  `;
}

function renderHome(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="content" style="flex-direction: column;">
      <h1 style="margin: 0 0 1rem;">Tessellation — Interactive 3D Demos</h1>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
        ${routes
          .filter((r) => r.hash)
          .map(
            (r) => `
          <a href="#/${r.hash}" style="
            display: block;
            padding: 1.5rem;
            background: var(--bg-panel);
            border-radius: 8px;
            color: var(--text);
            text-decoration: none;
            border: 1px solid var(--border);
            transition: border-color 0.15s;
          " onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <strong>${r.name}</strong>
          </a>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

let currentDispose: (() => void) | null = null;

async function loadAndRunDemo(
  route: string,
  content: HTMLElement
): Promise<void> {
  content.innerHTML = "";
  content.classList.add("demo-content");

  currentDispose?.();
  currentDispose = null;

  const demoModules: Record<
    string,
    () => Promise<{
      default: (c: HTMLElement) => Promise<{ dispose?: () => void } | void>;
    }>
  > = {
    "basic-shapes": () => import("./demos/basic-shapes"),
    "csg-operations": () => import("./demos/csg-operations"),
    "resolution": () => import("./demos/resolution"),
    "custom-functions": () => import("./demos/custom-functions"),
  };

  try {
    const loader = demoModules[route];
    const mod = loader ? await loader() : null;
    if (mod?.default) {
      const result = await mod.default(content);
      if (result?.dispose) currentDispose = result.dispose;
    }
  } catch (e) {
    content.innerHTML = `<p style="color: #e88;">Failed to load demo: ${e}</p>`;
  }
}

async function router(): Promise<void> {
  const route = getRoute();
  renderSidebar(route);

  const content = document.getElementById("content");
  if (!content) return;

  if (!route || route === "home") {
    currentDispose?.();
    currentDispose = null;
    content.classList.remove("demo-content");
    renderHome();
    return;
  }

  content.innerHTML = '<p style="padding: 1rem;">Loading...</p>';
  await loadAndRunDemo(route, content);
}

window.addEventListener("hashchange", router);

async function main(): Promise<void> {
  document.title = "Tessellation — Interactive 3D Demos";

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <aside id="sidebar" class="sidebar"></aside>
    <main class="main">
      <div id="content" class="content"></div>
    </main>
  `;

  await initWasm();
  await router();
}

main();
