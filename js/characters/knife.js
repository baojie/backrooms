// Companion knife — chunky blade visible from far away so the team's
// "armed" status is obvious. Used by both procedural and GLTF companions.

import * as THREE from 'three';

export function buildCompanionKnife() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.55, 0.02),
    new THREE.MeshLambertMaterial({ color: 0xeef2ff, emissive: 0x445566, emissiveIntensity: 0.6 })
  );
  blade.position.y = -0.27;
  g.add(blade);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.10, 4),
    blade.material
  );
  tip.position.y = -0.60;
  tip.rotation.z = Math.PI;
  g.add(tip);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.04, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  guard.position.y = 0.02;
  g.add(guard);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a2a14 })
  );
  grip.position.y = 0.10;
  g.add(grip);
  return g;
}

export function attachCompanionKnife(mesh) {
  // GLTF girl: attach to the right-hand bone if exposed
  const gltf = mesh.userData.gltf;
  if (gltf && gltf.righthandBone) {
    const knife = buildCompanionKnife();
    knife.position.set(0, 0.06, 0.0);
    knife.rotation.set(Math.PI / 2, 0, 0);
    gltf.righthandBone.add(knife);
    return knife;
  }
  // Procedural rig: attach to the right elbow group
  const rig = mesh.userData.rig;
  if (!rig || !rig.rightArm) return null;
  const elbow = rig.rightArm.children.find(o => o.isGroup);
  if (!elbow) return null;
  const knife = buildCompanionKnife();
  knife.position.set(0.0, -0.40, 0.05);
  knife.rotation.set(Math.PI / 2, 0, 0);
  elbow.add(knife);
  return knife;
}
