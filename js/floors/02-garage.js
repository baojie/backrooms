// Floor 2 — 车库 (garage): one open hall with parked cars and concrete pillars.

import { buildParking } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, wallBoxes } = ctx;
  // Open garage: rows of parked cars, support pillars, painted bay-line markers.
  const limit = (GRID/2) * CELL - 4;        // stay clear of outer walls
  const rowZs = [-14, -6, 6, 14];           // four parking rows
  const carBodyPalette = [0x1f2c44, 0x6b1f1f, 0x303236, 0xa0982a, 0x3a3a3a, 0x4a5a45, 0x6a4828, 0x202028];

  function buildCarMesh(bodyColor) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const cabinMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x152030, transparent: true, opacity: 0.65 });
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x101010 });
    const rimMat  = new THREE.MeshLambertMaterial({ color: 0x888888 });
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 4.0), bodyMat);
    body.position.y = 0.62;
    g.add(body);
    // Cabin (greenhouse)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.55, 2.0), cabinMat);
    cabin.position.set(0, 1.10, 0.10);
    g.add(cabin);
    // Windshield + rear window
    const wsh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.50, 0.05), glassMat);
    wsh.position.set(0, 1.10, -0.92);
    g.add(wsh);
    const rwh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.50, 0.05), glassMat);
    rwh.position.set(0, 1.10, 1.12);
    g.add(rwh);
    // Side windows
    const swg = new THREE.BoxGeometry(0.05, 0.45, 1.95);
    const lW = new THREE.Mesh(swg, glassMat); lW.position.set(-0.86, 1.12, 0.10);
    const rW = new THREE.Mesh(swg, glassMat); rW.position.set( 0.86, 1.12, 0.10);
    g.add(lW); g.add(rW);
    // Wheels (cylinders rotated to roll along Z direction of the car)
    const wheelG = new THREE.CylinderGeometry(0.34, 0.34, 0.20, 16);
    const rimG   = new THREE.CylinderGeometry(0.18, 0.18, 0.21, 12);
    for (const [dx, dz] of [[-0.85,-1.40],[0.85,-1.40],[-0.85,1.40],[0.85,1.40]]) {
      const tire = new THREE.Mesh(wheelG, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(dx, 0.34, dz);
      g.add(tire);
      const rim = new THREE.Mesh(rimG, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(dx, 0.34, dz);
      g.add(rim);
    }
    // Headlights / taillights
    const hlG = new THREE.SphereGeometry(0.10, 8, 8);
    const hlM = new THREE.MeshBasicMaterial({ color: 0xfff2cc });
    const tlM = new THREE.MeshBasicMaterial({ color: 0x661a1a });
    const lh = new THREE.Mesh(hlG, hlM); lh.scale.set(1, 0.6, 1); lh.position.set(-0.62, 0.65, -1.98); g.add(lh);
    const rh = new THREE.Mesh(hlG, hlM); rh.scale.set(1, 0.6, 1); rh.position.set( 0.62, 0.65, -1.98); g.add(rh);
    const lt = new THREE.Mesh(hlG, tlM); lt.scale.set(1, 0.5, 1); lt.position.set(-0.62, 0.65,  1.98); g.add(lt);
    const rt = new THREE.Mesh(hlG, tlM); rt.scale.set(1, 0.5, 1); rt.position.set( 0.62, 0.65,  1.98); g.add(rt);
    // Plate strip
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.10, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xeeddaa }));
    plate.position.set(0, 0.45, -2.01);
    g.add(plate);
    return g;
  }

  // Painted bay-line strips (under the cars, between rows)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0 });
  const bayLineGeom = new THREE.PlaneGeometry(0.10, 4.2);
  for (const z of rowZs) {
    for (let bx = -limit + 1.25; bx <= limit + 0.5; bx += 2.5) {
      const line = new THREE.Mesh(bayLineGeom, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(bx, 0.02, z);
      levelGroup.add(line);
    }
  }
  // Aisle direction arrows (subtle)
  const arrowGeom = new THREE.PlaneGeometry(1.4, 0.4);
  for (let z = -10; z <= 10; z += 4) {
    const a = new THREE.Mesh(arrowGeom, lineMat);
    a.rotation.x = -Math.PI / 2;
    a.position.set(0, 0.025, z);
    a.material = lineMat;
    levelGroup.add(a);
  }

  // Cars in each row
  for (let ri = 0; ri < rowZs.length; ri++) {
    const z = rowZs[ri];
    const facing = (ri % 2 === 0) ? 0 : Math.PI;  // alternate rows face opposite
    // Player spawn is roughly at (0, 0). Don't park on top of them.
    for (let bx = -limit + 1.25; bx <= limit - 1.25; bx += 2.5) {
      if (Math.abs(bx) < 4 && Math.abs(z) < 8) continue;  // keep aisle near spawn clear
      if (Math.random() < 0.18) continue;                // some empty bays
      const color = carBodyPalette[Math.floor(Math.random()*carBodyPalette.length)];
      const car = buildCarMesh(color);
      car.position.set(bx, 0, z);
      car.rotation.y = facing + (Math.random() - 0.5) * 0.04; // slight misalignment
      levelGroup.add(car);
      // Axis-aligned collision box (cars are ~1.85 × 4.0; rotated 0 or π → same axes)
      wallBoxes.push({ x: bx, z, halfX: 0.95, halfZ: 2.05 });
    }
  }

  // Concrete support pillars on a sparse grid for that parking-garage feel
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x9a8e7a });
  const pillarGeom = new THREE.BoxGeometry(0.8, WALL_HEIGHT, 0.8);
  for (let px = -16; px <= 16; px += 8) {
    for (let pz = -18; pz <= 18; pz += 10) {
      // Don't drop pillars right where cars are parked
      if (rowZs.some(rz => Math.abs(pz - rz) < 1.5)) continue;
      const p = new THREE.Mesh(pillarGeom, pillarMat);
      p.position.set(px, WALL_HEIGHT/2, pz);
      levelGroup.add(p);
      // Painted yellow base around pillar
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.05, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xc9a020 })
      );
      base.position.set(px, 0.025, pz);
      levelGroup.add(base);
      wallBoxes.push({ x: px, z: pz, half: 0.45 });
    }
  }

  // Oil stains scattered on the floor
  const oilMat = new THREE.MeshBasicMaterial({ color: 0x101012 });
  for (let i = 0; i < 18; i++) {
    const oil = new THREE.Mesh(new THREE.CircleGeometry(0.4 + Math.random()*0.6, 8), oilMat);
    oil.rotation.x = -Math.PI / 2;
    oil.position.set((Math.random()-0.5) * (limit*1.6), 0.015, (Math.random()-0.5) * (limit*1.6));
    levelGroup.add(oil);
  }
  return;}

export const FLOOR = {
  name: '车库',
  buildLayout: buildParking,
  spawnProps,
  wallRGB:  [120, 120, 124],
  floorRGB: [ 70,  70,  72],
  ceilRGB:  [ 90,  90,  92],
  ambient:  0x484850,
  lightHex: 0xc4c8b0,
  fogHex:   0x202024,
  fogNear:  3,
  fogFar:   24,
  hasCeiling: true,
  props: 'cars',
};
