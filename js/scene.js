// Three.js scene / renderer / camera / pointer-lock / flashlight setup.
//
// `createScene()` returns the live game-loop primitives in one bundle:
//   { scene, renderer, camera, controls, flashlight }
// The renderer is appended to `document.body`; the camera is parented to
// the PointerLockControls object so WASD movement updates its position.
// The flashlight is a soft, warm 60° SpotLight attached to the camera —
// intensity is 0 by default and the game loop turns it on with `F`.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export function createScene() {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 1.7, 0);

  const controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());
  window.__game = { controls };

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Wide, soft beam — warm and gentle, fades quickly with distance so
  // it doesn't blow out walls when you're close.
  // angle ≈ 60° (Math.PI/3), large penumbra (soft edge), faster decay.
  const flashlight = new THREE.SpotLight(0xffe6b0, 0, 32, Math.PI/3, 0.85, 1.4);
  flashlight.position.set(0, 0, 0.1);
  flashlight.target.position.set(0, 0, -1);
  camera.add(flashlight);
  camera.add(flashlight.target);

  return { scene, renderer, camera, controls, flashlight };
}
