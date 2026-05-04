// Held-weapon mesh builders. Each returns a `THREE.Group` ready to attach
// to a pivot. No shared state — pure constructors.

import * as THREE from 'three';

export function buildKnifeMesh() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.04, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xdde6ee, emissive: 0x223344 })
  );
  blade.position.x = 0.18;
  g.add(blade);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.12, 4),
    new THREE.MeshLambertMaterial({ color: 0xdde6ee })
  );
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.49;
  g.add(tip);
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x3a1f10 })
  );
  handle.position.x = -0.16;
  g.add(handle);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.12, 0.10),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  guard.position.x = -0.06;
  g.add(guard);
  return g;
}

export function buildPistolMesh() {
  const g = new THREE.Group();
  const matBody  = new THREE.MeshLambertMaterial({ color: 0x1a1a1c });
  const matSlide = new THREE.MeshLambertMaterial({ color: 0x2a2a2e });
  const matGrip  = new THREE.MeshLambertMaterial({ color: 0x14100c });
  const matAccent= new THREE.MeshBasicMaterial({ color: 0x666666 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.32), matSlide);
  slide.position.set(0, 0.04, -0.06);
  g.add(slide);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), matBody);
  frame.position.set(0, -0.01, -0.04);
  g.add(frame);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 10), matBody);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, -0.245);
  g.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.022, 10), matAccent);
  muzzle.position.set(0, 0.04, -0.275);
  muzzle.rotation.y = Math.PI;
  g.add(muzzle);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.08), matGrip);
  grip.position.set(0, -0.12, 0.06);
  grip.rotation.x = -0.18;
  g.add(grip);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), matBody);
  guard.position.set(0, -0.04, 0.02);
  guard.rotation.x = -Math.PI / 2;
  guard.rotation.z = Math.PI;
  g.add(guard);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.012), matAccent);
  trigger.position.set(0, -0.045, 0.02);
  g.add(trigger);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.01), matAccent);
  sight.position.set(0, 0.085, -0.21);
  g.add(sight);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.0 });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), flashMat);
  flash.position.set(0, 0.04, -0.31);
  flash.scale.set(1.2, 1.2, 0.6);
  g.add(flash);
  g.userData.flash = flash;
  return g;
}

export function buildAKMesh() {
  const g = new THREE.Group();
  const wood   = new THREE.MeshLambertMaterial({ color: 0x6b3a18 });
  const metal  = new THREE.MeshLambertMaterial({ color: 0x262628 });
  const dark   = new THREE.MeshLambertMaterial({ color: 0x14100c });
  const accent = new THREE.MeshBasicMaterial({ color: 0x666666 });
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.42), metal);
  receiver.position.set(0, 0.04, -0.05);
  g.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.44, 10), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.06, -0.42);
  g.add(barrel);
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.22), wood);
  handguard.position.set(0, 0.025, -0.32);
  g.add(handguard);
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.22, 8), metal);
  gas.rotation.x = Math.PI / 2;
  gas.position.set(0, 0.10, -0.32);
  g.add(gas);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.014), metal);
  sight.position.set(0, 0.115, -0.62);
  g.add(sight);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.045, 10), dark);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.06, -0.66);
  g.add(muzzle);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.28), wood);
  stock.position.set(0, 0.01, 0.24);
  g.add(stock);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.06), wood);
  grip.position.set(0, -0.10, 0.06);
  grip.rotation.x = -0.32;
  g.add(grip);
  const mag1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.07), dark);
  mag1.position.set(0, -0.10, -0.06);
  mag1.rotation.x = -0.18;
  g.add(mag1);
  const mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.06), dark);
  mag2.position.set(0, -0.21, -0.10);
  mag2.rotation.x = -0.45;
  g.add(mag2);
  const tg = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI), metal);
  tg.position.set(0, -0.035, 0.03);
  tg.rotation.x = -Math.PI / 2;
  tg.rotation.z = Math.PI;
  g.add(tg);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.038, 0.012), accent);
  trigger.position.set(0, -0.04, 0.03);
  g.add(trigger);
  const sel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.05), metal);
  sel.position.set(0.034, 0.04, 0.02);
  g.add(sel);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0 });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), flashMat);
  flash.position.set(0, 0.06, -0.71);
  flash.scale.set(1.5, 1.5, 0.7);
  g.add(flash);
  g.userData.flash = flash;
  return g;
}

export function buildRocketLauncherMesh() {
  const g = new THREE.Group();
  const tubeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
  const dark    = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wood    = new THREE.MeshLambertMaterial({ color: 0x5a3220 });
  const accent  = new THREE.MeshBasicMaterial({ color: 0xff6644 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.95, 14), tubeMat);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0.04, -0.30);
  g.add(tube);
  const venturi = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.075, 0.10, 14), dark);
  venturi.rotation.x = Math.PI / 2;
  venturi.position.set(0, 0.04, 0.22);
  g.add(venturi);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.05, 14), dark);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.04, -0.78);
  g.add(muzzle);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.5), dark);
  rail.position.set(0, 0.13, -0.30);
  g.add(rail);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.02), dark);
  sight.position.set(0, 0.17, -0.60);
  g.add(sight);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.07), wood);
  grip.position.set(0, -0.08, -0.10);
  grip.rotation.x = -0.20;
  g.add(grip);
  const tg = new THREE.Mesh(new THREE.TorusGeometry(0.030, 0.006, 6, 12, Math.PI), dark);
  tg.position.set(0, -0.025, -0.10);
  tg.rotation.set(-Math.PI/2, 0, Math.PI);
  g.add(tg);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.13, 12), accent);
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0.04, -0.70);
  g.add(head);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0 });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), flashMat);
  flash.position.set(0, 0.04, -0.85);
  g.add(flash);
  g.userData.flash = flash;
  g.userData.warhead = head;
  return g;
}

export function buildSprayCanMesh() {
  const g = new THREE.Group();
  const canMat   = new THREE.MeshLambertMaterial({ color: 0xd4d428 });
  const labelMat = new THREE.MeshBasicMaterial({ color: 0x2a6a1f });
  const dark     = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const nozzleMat= new THREE.MeshLambertMaterial({ color: 0xbb1e1e });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.32, 16), canMat);
  body.position.set(0, 0.0, -0.05);
  g.add(body);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0755, 0.0755, 0.14, 16, 1, true), labelMat);
  label.position.set(0, 0.0, -0.05);
  g.add(label);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.04, 16), dark);
  cap.position.set(0, 0.18, -0.05);
  g.add(cap);
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.05), nozzleMat);
  btn.position.set(0, 0.21, -0.05);
  g.add(btn);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8), dark);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0.21, -0.10);
  g.add(nozzle);
  const mistMat = new THREE.MeshBasicMaterial({ color: 0xc8ff66, transparent: true, opacity: 0.0, depthWrite: false });
  const mist = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 14, 1, true), mistMat);
  mist.rotation.x = Math.PI / 2;
  mist.position.set(0, 0.21, -0.42);
  g.add(mist);
  g.userData.mist = mist;
  g.userData.nozzle = nozzle;
  return g;
}
