// Floor 4 — 游泳池 (sunken pool): white-tile deck around a single big rectangular
// pool. Fluorescent ceiling grid, metal handrails, electric cables and toxic
// patches lurking in the water, with rowboats moored at the edges.

import { buildOpen } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, pick,
          cells, openCells, wallBoxes,
          lights, electricZones, toxicZones, moths, boats, pool,
          getButterflyProto, makeNoiseTexture } = ctx;
  // Sunken indoor pool — single big rectangular pit cut into a tiled deck.
  // The deck strips around the pool are built in buildLevel; here we add
  // pool walls, pool bottom, dark water, white pillars, handrails, and a
  // dense fluorescent ceiling grid.
  if (!pool) return;

  const tileLightTex = makeNoiseTexture(128, [232, 234, 236], 12, 6);
  const tileFloorTex = makeNoiseTexture(128, [110, 130, 140], 16, 4);
  const tileMat   = new THREE.MeshLambertMaterial({ map: tileLightTex, side: THREE.DoubleSide });
  const tileBot   = new THREE.MeshLambertMaterial({ map: tileFloorTex });

  const innerW = pool.halfX * 2;
  const innerD = pool.halfZ * 2;
  const wallH  = -pool.bottomY;     // 1.6

  // Pool bottom (slightly darker tile).
  const poolBottom = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW, innerD), tileBot
  );
  poolBottom.rotation.x = -Math.PI / 2;
  poolBottom.position.set(pool.x, pool.bottomY, pool.z);
  levelGroup.add(poolBottom);

  // Four pool walls — vertical planes facing into the pool.
  const wallNS = new THREE.PlaneGeometry(innerW, wallH);
  const wallEW = new THREE.PlaneGeometry(innerD, wallH);
  const sides = [
    // North (z = +halfZ, normal -z)
    { geo: wallNS, x: pool.x, z: pool.z + pool.halfZ, ry: Math.PI },
    // South (z = -halfZ, normal +z)
    { geo: wallNS, x: pool.x, z: pool.z - pool.halfZ, ry: 0 },
    // East (x = +halfX, normal -x)
    { geo: wallEW, x: pool.x + pool.halfX, z: pool.z, ry: -Math.PI / 2 },
    // West (x = -halfX, normal +x)
    { geo: wallEW, x: pool.x - pool.halfX, z: pool.z, ry: Math.PI / 2 },
  ];
  for (const s of sides) {
    const w = new THREE.Mesh(s.geo, tileMat);
    w.position.set(s.x, pool.bottomY + wallH / 2, s.z);
    w.rotation.y = s.ry;
    levelGroup.add(w);
  }

  // Translucent pool water — bright canonical Poolrooms turquoise, not the
  // muddy teal of before. Reads as 'lit pool' instead of 'flooded basement'.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW, innerD),
    new THREE.MeshBasicMaterial({
      color: 0x35c0d6, transparent: true, opacity: 0.55,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(pool.x, pool.surfaceY, pool.z);
  levelGroup.add(water);

  // White square pillars on the deck — at the pool corners and midpoints.
  const pillarMat = new THREE.MeshLambertMaterial({ map: tileLightTex });
  const pillarSide = 1.2;
  const pillarGeom = new THREE.BoxGeometry(pillarSide, WALL_HEIGHT, pillarSide);
  const off = 2.0;   // distance from pool edge to pillar center
  const deckPillarPos = [
    // Long-side pillars (north & south of pool)
    [-pool.halfX + 4, +pool.halfZ + off],
    [ 0,              +pool.halfZ + off],
    [+pool.halfX - 4, +pool.halfZ + off],
    [-pool.halfX + 4, -pool.halfZ - off],
    [ 0,              -pool.halfZ - off],
    [+pool.halfX - 4, -pool.halfZ - off],
    // Short-side pillars (east & west of pool)
    [+pool.halfX + off, 0],
    [-pool.halfX - off, 0],
  ];
  for (const [px, pz] of deckPillarPos) {
    const p = new THREE.Mesh(pillarGeom, pillarMat);
    p.position.set(px, WALL_HEIGHT / 2, pz);
    levelGroup.add(p);
    wallBoxes.push({ x: px, z: pz, half: pillarSide / 2 });
  }

  // Metal handrails along the four pool edges.
  const railMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a6, emissive: 0x202020 });
  const railR = 0.05;
  const railH = 0.95;
  const railOff = 0.25;
  function addRail(x1, z1, x2, z2) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const r = new THREE.Mesh(
      new THREE.CylinderGeometry(railR, railR, len, 8), railMat
    );
    r.position.set((x1 + x2) / 2, railH, (z1 + z2) / 2);
    r.rotation.z = Math.PI / 2;
    r.rotation.y = -Math.atan2(dz, dx);
    levelGroup.add(r);
  }
  // Posts — short verticals at each rail corner.
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, railH, 8);
  function addPost(x, z) {
    const p = new THREE.Mesh(postGeom, railMat);
    p.position.set(x, railH / 2, z);
    levelGroup.add(p);
  }
  const x0 = pool.x - pool.halfX - railOff;
  const x1 = pool.x + pool.halfX + railOff;
  const z0 = pool.z - pool.halfZ - railOff;
  const z1 = pool.z + pool.halfZ + railOff;
  addRail(x0, z0, x1, z0);
  addRail(x0, z1, x1, z1);
  addRail(x0, z0, x0, z1);
  addRail(x1, z0, x1, z1);
  // Posts every ~4m along the long sides + corners on the short sides.
  for (let xx = x0; xx <= x1 + 0.01; xx += 4) {
    addPost(xx, z0); addPost(xx, z1);
  }
  addPost(x0, z0); addPost(x0, z1); addPost(x1, z0); addPost(x1, z1);

  // Dense rectangular fluorescent ceiling panels in a regular grid.
  const flMat = new THREE.MeshBasicMaterial({ color: 0xeaffff });
  const flGeom = new THREE.BoxGeometry(2.2, 0.04, 0.5);
  const flStep = 6;
  const flLimit = (GRID / 2) * CELL - 4;
  for (let xx = -flLimit; xx <= flLimit + 0.01; xx += flStep) {
    for (let zz = -flLimit; zz <= flLimit + 0.01; zz += flStep) {
      const fl = new THREE.Mesh(flGeom, flMat);
      fl.position.set(xx, WALL_HEIGHT - 0.05, zz);
      levelGroup.add(fl);
      const li = new THREE.PointLight(0xfff8e8, 0.95, 12, 1.4);
      li.position.set(xx, WALL_HEIGHT - 0.2, zz);
      levelGroup.add(li);
      lights.push({ light: li, panel: fl, base: 0.95, seed: Math.random()*100, broken: Math.random() < 0.05 });
    }
  }

  // Live wires dropped into the pool — sparking cables hanging from above.
  const inPoolPick = (n) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push([
        pool.x + (Math.random() - 0.5) * 2 * (pool.halfX - 1.5),
        pool.z + (Math.random() - 0.5) * 2 * (pool.halfZ - 1.5),
      ]);
    }
    return out;
  };

  const surfY = pool.surfaceY;
  for (const [wx, wz] of inPoolPick(3)) {
    const zoneGroup = new THREE.Group();
    zoneGroup.position.set(wx, 0, wz);

    // Glowing emissive disc on the water surface marking the danger area.
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xeaffff, transparent:true, opacity:0.55, side: THREE.DoubleSide, depthWrite:false })
    );
    disc.rotation.x = -Math.PI/2;
    disc.position.y = surfY + 0.02;
    zoneGroup.add(disc);

    // Frayed cable hanging from ceiling down into the pool water.
    const cableLen = WALL_HEIGHT - surfY;
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, cableLen, 6),
      new THREE.MeshLambertMaterial({ color: 0x202020 })
    );
    cable.position.y = surfY + cableLen / 2;
    zoneGroup.add(cable);
    const plug = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    plug.position.y = surfY;
    zoneGroup.add(plug);

    // Cyan-white spark light pulses from the contact point.
    const sparkLight = new THREE.PointLight(0xaaffff, 1.4, 5, 2);
    sparkLight.position.y = surfY + 0.15;
    zoneGroup.add(sparkLight);

    levelGroup.add(zoneGroup);
    electricZones.push({
      x: wx, z: wz, r: 1.4,
      disc, plug, sparkLight,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Toxic patches — a couple bubbling green slicks floating in the pool.
  for (const [wx, wz] of inPoolPick(2)) {
    const tg = new THREE.Group();
    tg.position.set(wx, 0, wz);
    const slime = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 28),
      new THREE.MeshBasicMaterial({ color: 0x6fbf3a, transparent:true, opacity:0.7, side: THREE.DoubleSide, depthWrite:false })
    );
    slime.rotation.x = -Math.PI/2;
    slime.position.y = surfY + 0.03;
    tg.add(slime);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xa8e070, transparent:true, opacity:0.8 });
    const bubbles = [];
    for (let b = 0; b < 6; b++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 1.3;
      const s = 0.07 + Math.random() * 0.10;
      const sph = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 6), bubbleMat);
      sph.position.set(Math.cos(ang) * rad, surfY + 0.08, Math.sin(ang) * rad);
      tg.add(sph);
      bubbles.push({ mesh: sph, baseY: surfY + 0.08, seed: Math.random() * Math.PI * 2 });
    }
    const glow = new THREE.PointLight(0x9fff66, 0.6, 4, 2);
    glow.position.y = surfY + 0.35;
    tg.add(glow);
    levelGroup.add(tg);
    toxicZones.push({ x: wx, z: wz, r: 1.6, slime, bubbles, glow });
  }

  // Wooden rowboats — float just above the pool surface, inside the pool
  // footprint. Press E adjacent to one to board: the player glides over
  // electric / toxic zones without taking damage.
  for (const [wx, wz] of inPoolPick(2)) {
    const boat = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1a });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x4a2810 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 2.8), woodMat);
    hull.position.y = 0.05;
    boat.add(hull);
    const well = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 2.4), trimMat);
    well.position.y = 0.20;
    boat.add(well);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 4), woodMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.z = Math.PI / 4;
    bow.position.set(0, 0.05, 1.55);
    boat.add(bow);
    const stern = bow.clone();
    stern.position.z = -1.55;
    stern.rotation.x = -Math.PI / 2;
    boat.add(stern);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.35), trimMat);
    bench.position.y = 0.32;
    boat.add(bench);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), woodMat);
    oar.rotation.z = Math.PI / 2;
    oar.position.set(0.7, 0.30, 0.2);
    boat.add(oar);
    // Group sits AT the water surface; children offsets are above it so
    // the hull half-submerges the way a real rowboat does.
    boat.position.set(wx, surfY, wz);
    boat.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(boat);
    boats.push({ mesh: boat, x: wx, z: wz, yaw: boat.rotation.y, occupied: false });
  }

  // Moth swarm — perched on the pool-room walls; bite for 80 HP and only
  // the spray-can (key 5) kills them in one hit.
  const NUM_MOTHS = 4;
  for (let i = 0; i < NUM_MOTHS; i++) {
    const moth = new THREE.Group();
    let wL = null, wR = null;
    const butterflyProto = getButterflyProto();
    if (butterflyProto) {
      const clone = butterflyProto.clone(true);
      // Re-parent so we can flap wings around the body axis. Detect wing
      // meshes by name; otherwise pick the two non-body meshes whose
      // bounding boxes extend farthest along x.
      const meshes = [];
      clone.traverse(o => { if (o.isMesh) meshes.push(o); });
      const named = meshes.filter(m => /wing/i.test(m.name));
      let candidates = named.length >= 2 ? named : meshes;
      // Score by |x-extent|.
      const bboxOf = (m) => new THREE.Box3().setFromObject(m);
      candidates = candidates.map(m => {
        const bb = bboxOf(m);
        const span = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x));
        const cx = (bb.min.x + bb.max.x) * 0.5;
        return { m, span, cx };
      }).sort((a, b) => b.span - a.span);
      const wingMeshes = candidates.slice(0, 2);
      for (const { m, cx } of wingMeshes) {
        // Wrap each wing in a pivot group at x=0 so rotation hinges at the body.
        const pivot = new THREE.Group();
        const parent = m.parent;
        const localPos = m.position.clone();
        parent.add(pivot);
        pivot.add(m);
        m.position.sub(new THREE.Vector3(localPos.x - localPos.x, 0, 0)); // keep mesh local pos
        pivot.position.x = 0;
        if (cx >= 0) wR = pivot; else wL = pivot;
      }
      // Tint slightly toward moth (warmer, dustier).
      clone.traverse(o => {
        if (o.isMesh && o.material && o.material.color) {
          o.material = o.material.clone();
          o.material.color.lerp(new THREE.Color(0xc8b890), 0.4);
          if (o.material.side !== undefined) o.material.side = THREE.DoubleSide;
        }
      });
      moth.add(clone);
    } else {
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x554028 });
      const wingMat = new THREE.MeshLambertMaterial({ color: 0xc8b890, transparent:true, opacity:0.85, side: THREE.DoubleSide });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 5), bodyMat);
      body.scale.set(1, 0.6, 1.6);
      moth.add(body);
      wL = new THREE.Group();
      const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.30), wingMat);
      wingL.position.x = 0.22;
      wL.add(wingL);
      moth.add(wL);
      wR = new THREE.Group();
      const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.30), wingMat);
      wingR.position.x = -0.22;
      wR.add(wingR);
      moth.add(wR);
    }
    // Pick an open cell with at least one adjacent wall — perch the moth
    // on that wall. Falls back to a free position if no wall is found.
    let perchX = 0, perchZ = 0, perchY = 1.7, perchYaw = 0;
    let placed = false;
    for (let tries = 0; tries < 24 && !placed; tries++) {
      const spot = openCells[Math.floor(Math.random() * openCells.length)];
      const sx = spot[0], sz = spot[1];
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      // Shuffle directions.
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
      for (const [dx, dz] of dirs) {
        const nx = sx + dx, nz = sz + dz;
        if (nx < 0 || nx >= GRID || nz < 0 || nz >= GRID) continue;
        if (!cells[nx][nz].wall) continue;
        // Push the moth from the open cell toward the wall — sit just shy
        // of the wall surface so it visually rests against it.
        const cellCx = (sx - GRID/2) * CELL;
        const cellCz = (sz - GRID/2) * CELL;
        perchX = cellCx + dx * (CELL * 0.42);
        perchZ = cellCz + dz * (CELL * 0.42);
        perchY = 1.4 + Math.random() * 1.2;
        // Face outward, away from the wall.
        perchYaw = Math.atan2(-dx, -dz);
        placed = true;
        return;
      }
    }
    if (!placed) {
      const spot = openCells[Math.floor(Math.random() * openCells.length)];
      perchX = (spot[0] - GRID/2) * CELL + (Math.random()-0.5) * 2;
      perchZ = (spot[1] - GRID/2) * CELL + (Math.random()-0.5) * 2;
      perchY = 1.6 + Math.random() * 0.6;
      perchYaw = Math.random() * Math.PI * 2;
    }
    moth.position.set(perchX, perchY, perchZ);
    moth.rotation.y = perchYaw;
    levelGroup.add(moth);
    moths.push({
      mesh: moth, alive: true, hp: 1, poison: 0,
      wL, wR,
      vx: 0, vz: 0,
      phase: Math.random() * Math.PI * 2,
      biteTimer: 0,
      perchX, perchZ, perchY, perchYaw,
      alerted: false,
    });
  }
  return;}

export const FLOOR = {
  name: '游泳池',
  buildLayout: buildOpen,
  spawnProps,
  wallRGB:  [238, 238, 238],
  floorRGB: [232, 232, 230],
  ceilRGB:  [240, 238, 232],
  ambient:  0xb8b8b8,
  lightHex: 0xfff8e8,
  fogHex:   0xd6d6d4,
  fogNear:  10,
  fogFar:   38,
  hasCeiling: true,
  props: 'water',
};
