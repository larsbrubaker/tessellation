/**
 * WASM loader and tessellation API bindings for the tessellation library.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

export interface MeshResult {
  vertCount: number;
  faceCount: number;
  elapsedMs: number;
  vertices: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

let wasmModule: {
  tessellate_sphere: (radius: number, cell_size: number) => Float32Array;
  tessellate_rounded_box: (
    hx: number,
    hy: number,
    hz: number,
    radius: number,
    cell_size: number
  ) => Float32Array;
  tessellate_torus: (
    major_radius: number,
    minor_radius: number,
    cell_size: number
  ) => Float32Array;
  tessellate_csg: (
    shape_a: number,
    shape_b: number,
    operation: number,
    cell_size: number
  ) => Float32Array;
  tessellate_gyroid: (
    scale: number,
    cell_size: number,
    bounds: number
  ) => Float32Array;
  tessellate_schwartz_p: (
    scale: number,
    cell_size: number,
    bounds: number
  ) => Float32Array;
  tessellate_sphere_hole: (cell_size: number) => Float32Array;
} | null = null;

export async function initWasm(): Promise<void> {
  if (wasmModule) return;
  const base = import.meta.env.BASE_URL;
  const pkg = await import(/* @vite-ignore */ `${base}pkg/tessellation_wasm.js`);
  await pkg.default();
  wasmModule = pkg as typeof wasmModule;
}

export function parseMeshResult(data: Float32Array): MeshResult {
  let i = 0;
  const vertCount = data[i++];
  const faceCount = data[i++];
  const elapsedMs = data[i++];
  const vertLen = data[i++];
  const vertices = data.slice(i, i + vertLen);
  i += vertLen;
  const idxLen = data[i++];
  const idxF32 = data.slice(i, i + idxLen);
  i += idxLen;
  const normLen = data[i++];
  const normals = data.slice(i, i + normLen);

  const indices = new Uint32Array(idxLen);
  for (let j = 0; j < idxLen; j++) {
    indices[j] = Math.floor(idxF32[j]);
  }

  return {
    vertCount,
    faceCount,
    elapsedMs,
    vertices,
    indices,
    normals: new Float32Array(normals),
  };
}

export function tessellateSphere(radius: number, cellSize: number): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_sphere(radius, cellSize);
}

export function tessellateRoundedBox(
  hx: number,
  hy: number,
  hz: number,
  radius: number,
  cellSize: number
): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_rounded_box(hx, hy, hz, radius, cellSize);
}

export function tessellateTorus(
  majorRadius: number,
  minorRadius: number,
  cellSize: number
): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_torus(majorRadius, minorRadius, cellSize);
}

export function tessellateCsg(
  shapeA: number,
  shapeB: number,
  operation: number,
  cellSize: number
): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_csg(shapeA, shapeB, operation, cellSize);
}

export function tessellateGyroid(
  scale: number,
  cellSize: number,
  bounds: number
): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_gyroid(scale, cellSize, bounds);
}

export function tessellateSchwartzP(
  scale: number,
  cellSize: number,
  bounds: number
): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_schwartz_p(scale, cellSize, bounds);
}

export function tessellateSphereHole(cellSize: number): Float32Array {
  if (!wasmModule) throw new Error("WASM not initialized. Call initWasm() first.");
  return wasmModule.tessellate_sphere_hole(cellSize);
}
