/**
 * Tessellation demo SPA — hash router and entry point.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import "./main.css";
import { initWasm } from "./wasm";

type DemoInit = (container: HTMLElement) => Promise<{ dispose?: () => void } | void>;
const demoModules: Record<string, () => Promise<{ default: DemoInit }>> = {
  "basic-shapes": () => import("./demos/basic-shapes"),
  "csg-operations": () => import("./demos/csg-operations"),
  "resolution": () => import("./demos/resolution"),
  "custom-functions": () => import("./demos/custom-functions"),
};

function renderAlgorithmPage(container: HTMLElement) {
  const base = import.meta.env.BASE_URL;
  container.innerHTML = `
    <div class="home-page">
      <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">The Algorithm</h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px; max-width: 700px; line-height: 1.7;">
        This library implements <strong>Manifold Dual Contouring</strong>, described in the paper
        <em>"Manifold Dual Contouring"</em> by Scott Schaefer, Tao Ju, and Joe Warren (IEEE TVCG 2007).
        The algorithm converts signed distance functions into 2-manifold triangle meshes while preserving
        sharp features &mdash; producing clean, watertight geometry suitable for 3D printing and simulation.
      </p>
      <div style="margin-bottom: 32px;">
        <a href="${base}manifold-dual-contouring.pdf" target="_blank"
           style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
                  background: var(--accent); color: white; border-radius: 6px;
                  text-decoration: none; font-weight: 600; font-size: 14px;
                  transition: background 150ms ease;"
           onmouseover="this.style.background='var(--accent-hover)'"
           onmouseout="this.style.background='var(--accent)'">
          &#128196; Read the Paper (PDF, 2.6 MB)
        </a>
      </div>
      <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
        <iframe src="${base}manifold-dual-contouring.pdf"
                style="width: 100%; height: 85vh; border: none;"
                title="Manifold Dual Contouring paper"></iframe>
      </div>
      <div class="about-section">
        <h2>Key Properties</h2>
        <ul style="color: var(--text-secondary); line-height: 1.8; padding-left: 20px; max-width: 700px;">
          <li><strong>2-Manifold output</strong> &mdash; every edge is shared by exactly two triangles, producing watertight meshes</li>
          <li><strong>Sharp feature preservation</strong> &mdash; uses QEF (Quadratic Error Function) minimization to place vertices on sharp edges and corners</li>
          <li><strong>Adaptive resolution</strong> &mdash; octree-based subdivision concentrates detail where the surface has high curvature</li>
          <li><strong>Dual contouring</strong> &mdash; places vertices inside cells (not on edges like Marching Cubes), enabling better feature capture</li>
        </ul>
      </div>
    </div>
  `;
}

let currentCleanup: (() => void) | null = null;

const menuToggle = document.getElementById("menu-toggle")!;
const sidebar = document.getElementById("sidebar")!;
const sidebarOverlay = document.getElementById("sidebar-overlay")!;

function openSidebar() {
  sidebar.classList.add("open");
  menuToggle.classList.add("open");
  sidebarOverlay.classList.add("visible");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  menuToggle.classList.remove("open");
  sidebarOverlay.classList.remove("visible");
}

menuToggle.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

sidebarOverlay.addEventListener("click", closeSidebar);

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

function getRoute(): string {
  const hash = window.location.hash.slice(2) || "";
  return hash || "home";
}

function updateNav(route: string) {
  document.querySelectorAll(".nav-link").forEach((el) => {
    const r = (el as HTMLElement).dataset.route;
    el.classList.toggle("active", r === route);
  });
}

function renderHome(container: HTMLElement) {
  container.innerHTML = `
    <div class="home-page">
      <div class="github-badge">
        <a href="https://github.com/larsbrubaker/tessellation" target="_blank" class="github-badge-link">
          <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          <span>larsbrubaker/tessellation</span>
        </a>
      </div>
      <div class="hero">
        <h1>Tessellation <span>for Rust</span></h1>
        <p>
          A 3D tessellation library implementing Manifold Dual Contouring with sharp feature preservation.
          Explore interactive demos showcasing SDF primitives, CSG operations,
          and mathematical surfaces &mdash; all running in your browser via WebAssembly.
        </p>
      </div>
      <div class="feature-grid">
        <a href="#/basic-shapes" class="feature-card">
          <span class="card-icon">&#9679;</span>
          <h3>Basic Shapes</h3>
          <p>Tessellate spheres, rounded boxes, and tori with adjustable parameters and resolution control.</p>
        </a>
        <a href="#/csg-operations" class="feature-card">
          <span class="card-icon">&#9645;</span>
          <h3>CSG Operations</h3>
          <p>Combine shapes with Union, Intersection, and Subtraction &mdash; constructive solid geometry in action.</p>
        </a>
        <a href="#/resolution" class="feature-card">
          <span class="card-icon">&#9638;</span>
          <h3>Resolution &amp; Quality</h3>
          <p>Explore the quality vs. performance tradeoff by adjusting cell size and viewing real-time mesh stats.</p>
        </a>
        <a href="#/custom-functions" class="feature-card">
          <span class="card-icon">&#8734;</span>
          <h3>Mathematical Surfaces</h3>
          <p>Tessellate gyroid, Schwarz P, and other implicit surfaces defined by mathematical formulas.</p>
        </a>
      </div>

      <div style="margin-top: 32px;">
        <a href="#/the-algorithm" class="feature-card" style="max-width: 600px; border-color: var(--accent); background: var(--accent-light);">
          <span class="card-icon">&#128214;</span>
          <h3>The Algorithm &mdash; Manifold Dual Contouring</h3>
          <p>Read the original paper and learn how MDC produces 2-manifold meshes with sharp feature preservation from signed distance functions.</p>
        </a>
      </div>

      <div class="about-section">
        <h2>About This Project</h2>
        <p>
          This library implements
          <a href="#/the-algorithm">Manifold Dual Contouring</a>,
          an algorithm that produces 2-manifold triangle meshes from signed distance functions while preserving
          sharp features. Originally created by Henning Meyer, now maintained and enhanced with built-in SDF
          primitives and CSG operations.
        </p>
        <p style="margin-top: 12px">
          Maintained by <strong>Lars Brubaker</strong>, sponsored by
          <a href="https://www.matterhackers.com" target="_blank">MatterHackers</a>.
        </p>
        <div class="stats-row">
          <div class="stat">
            <div class="stat-value">6</div>
            <div class="stat-label">SDF Primitives</div>
          </div>
          <div class="stat">
            <div class="stat-value">4</div>
            <div class="stat-label">CSG Operations</div>
          </div>
          <div class="stat">
            <div class="stat-value">17</div>
            <div class="stat-label">Tests Passing</div>
          </div>
          <div class="stat">
            <div class="stat-value">2-Manifold</div>
            <div class="stat-label">Output Meshes</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function navigate(route: string) {
  const container = document.getElementById("main-content")!;

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  updateNav(route);

  if (route === "home") {
    renderHome(container);
    return;
  }

  if (route === "the-algorithm") {
    renderAlgorithmPage(container);
    return;
  }

  const loader = demoModules[route];
  if (!loader) {
    container.innerHTML = `<div class="home-page"><h2>Page not found</h2><p>Unknown route: ${route}</p></div>`;
    return;
  }

  container.innerHTML = `<div class="home-page" style="display:flex;align-items:center;justify-content:center;height:80vh;"><p style="color:var(--text-muted)">Loading demo...</p></div>`;

  try {
    await initWasm();
    const mod = await loader();
    container.innerHTML = "";
    const result = await mod.default(container);
    if (result?.dispose) currentCleanup = result.dispose;
  } catch (e) {
    console.error("Failed to load demo:", e);
    container.innerHTML = `<div class="home-page"><h2>Error loading demo</h2><pre style="color:#eb4444">${e}</pre></div>`;
  }
}

window.addEventListener("hashchange", () => navigate(getRoute()));

navigate(getRoute());
