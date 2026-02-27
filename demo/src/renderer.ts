/**
 * Three.js 3D renderer for tessellation mesh demos.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class DemoRenderer {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private readonly container: HTMLElement;
  private animationId: number | null = null;
  private wireframe = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8f9fb);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(3, 3, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -3, -5);
    this.scene.add(backLight);

    const gridHelper = new THREE.GridHelper(6, 12, 0xe2e5ea, 0xeef0f3);
    this.scene.add(gridHelper);

    window.addEventListener("resize", this.boundResize);
    this.animate();
  }

  private handleResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  updateMesh(
    vertices: Float32Array,
    indices: Uint32Array,
    normals: Float32Array
  ): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }

    const faceCount = indices.length / 3;
    const posExpanded = new Float32Array(faceCount * 9);
    const normExpanded = new Float32Array(faceCount * 9);
    for (let i = 0; i < faceCount; i++) {
      for (let j = 0; j < 3; j++) {
        const vi = indices[i * 3 + j] * 3;
        const outIdx = i * 9 + j * 3;
        posExpanded.set(vertices.subarray(vi, vi + 3), outIdx);
        normExpanded.set(
          normals.subarray(outIdx, outIdx + 3),
          outIdx
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posExpanded, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(normExpanded, 3)
    );
    geometry.computeBoundingSphere();

    const material = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      flatShading: true,
      wireframe: this.wireframe,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  setWireframe(enabled: boolean): void {
    this.wireframe = enabled;
    if (this.mesh && this.mesh.material instanceof THREE.MeshPhongMaterial) {
      this.mesh.material.wireframe = enabled;
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private boundResize = () => this.handleResize();

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.boundResize);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
