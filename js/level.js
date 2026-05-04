// Level construction: walls, floor, ceiling, S.lights, props, NPCs.
//
// `createLevelBuilder(ctx)` returns `{ buildLevel, disposeLevel }`. The
// per-level singletons (levelGroup, wallMeshRef, stairExit, randomStair,
// elevator, pool, guide, cells, currentLevel) are owned by index.html;
// level.js calls `set*(value)` after each assignment so the index.html
// bindings stay in sync. Per-level arrays (S.wallBoxes, S.lights, S.almonds,
// S.knives, S.medkits, S.entities, S.electricZones, S.toxicZones, S.boats, S.moths)
// are mutated in place — never reassigned — so module factories that
// captured those references at construction time keep working.
//
// `buildLevel(n, opts)` does in order:
//   1. disposeLevel — drop the previous group
//   2. set fog + sky color from cfg
//   3. carve cells via cfg.buildLayout(GRID)
//   4. spawn pool footprint (if cfg.props === 'water')
//   5. wallpaper / carpet / drop-tile textures (lobby) or noise (else)
//   6. instanced wall mesh
//   7. floor strips (deck around the pool) or full floor plane
//   8. ceiling tiles or sky dome
//   9. ambient + per-cell point S.lights with pulsing fluorescent panels
//  10. spawn pool: companions, S.almonds, S.knives, S.medkits
//  11. stair exit (red pulsing pillar; final floor uses green)
//  12. random stair (purple pulsing pillar; warps to a random other floor)
//  13. elevator cabin (corner-placed, animated doors)
//  14. guide NPC (with halo) on floor 1 if cells allow
//  15. floor-specific decoration via cfg.spawnProps
//  16. hostile entity spawning ≥14m from the player
//  17. spawn override when arriving via elevator
//  18. show floor title, kick off lazy GLTF upgrades

import * as THREE from 'three';

export function createLevelBuilder(ctx) {
  const {
    S,
    scene, camera, controls, player, companions,
    LEVELS, GRID, CELL, WALL_HEIGHT,
    // texture helpers
    makeNoiseTexture, makeWallpaperTexture, makeCarpetTexture, makeCeilingTileTexture,
    // mesh builders
    buildKnifeMesh,
    buildCompanionMesh, attachCompanionKnife, makeNameTag, buildProceduralCompanion,
    buildSoldierEntity, buildHumanoidEntity,
    // loader-state predicates
    isSoldierLoaded, getButterflyProto,
    // companion AI hooks
    scheduleGLTFUpgrade, upgradeEntitiesToGLTF,
    // TTS
    speak,
  } = ctx;

  const floorTitleEl = document.getElementById('floorTitle');

function buildLayout(cfg) {
  cells = cfg.buildLayout(GRID);
  S.cells = cells;
}

function disposeLevel() {
  const lg = S.levelGroup;
  if (!lg) return;
  scene.remove(lg);
  lg.traverse(o => {
    if (o.geometry) o.geometry.dispose && o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else o.material.dispose();
    }
  });
  S.levelGroup = null;
  // Clear arrays IN PLACE so module factories (weapons/fx, companion_ai,
  // hazards, ...) that captured these references at construction time
  // keep seeing the same array — never reassign with `[]`.
  S.wallBoxes.length = 0;
  S.lights.length = 0;
  S.almonds.length = 0;
  S.knives.length = 0;
  S.medkits.length = 0;
  S.entities.length = 0;
  S.electricZones.length = 0;
  S.toxicZones.length = 0;
  S.boats.length = 0;
  S.moths.length = 0;
  S.rockets.length = 0;
  // Per-level singletons reset to null.
  S.stairExit = null;
  S.randomStair = null;
  S.elevator = null;
  S.pool = null;
  S.guide = null;
  S.wallMeshRef = null;
  player.boat = null;
}

function buildLevel(n, opts = {}) {
  // Local aliases so the long buildLevel body stays readable; mutations
  // assign back into S at the right moments below. `cells` is read after
  // buildLayout populates S.cells.
  let levelGroup, wallMeshRef, stairExit, randomStair, elevator, pool, guide, cells, currentLevel;
  disposeLevel();
  const cfg = LEVELS[n];
  currentLevel = n;
  S.currentLevel = currentLevel;
  scene.background = new THREE.Color(cfg.fogHex);
  scene.fog = new THREE.Fog(cfg.fogHex, cfg.fogNear, cfg.fogFar);

  levelGroup = new THREE.Group();
  S.levelGroup = levelGroup;
  scene.add(levelGroup);

  buildLayout(cfg);
  cells = S.cells;   // sync the local alias after buildLayout writes S.cells

  // Pool level: define the sunken-pool footprint up front so floor / pickup /
  // companion code can avoid placing things inside it.
  if (cfg.props === 'water') {
    pool = { x: 0, z: 0, halfX: 22, halfZ: 12, surfaceY: -0.20, bottomY: -1.6 };
    S.pool = pool;
  }

  // Floor 1 ('lobby' style) gets a Backrooms-canonical texture pack:
  // vertical-seam wallpaper, mottled damp carpet, drop-ceiling tiles.
  // Other floors keep the generic noise.
  let wallTex, floorTex, ceilTex;
  if (cfg.style === 'lobby') {
    wallTex  = makeWallpaperTexture(256, cfg.wallRGB, 1);                 // 1 tile = one CELL face (~4m)
    floorTex = makeCarpetTexture(256, cfg.floorRGB, GRID);                // ~4m per repeat
    ceilTex  = makeCeilingTileTexture(256, cfg.ceilRGB, 2, GRID);          // 2 tiles per repeat → ~2m tile
  } else {
    wallTex  = makeNoiseTexture(128, cfg.wallRGB, 32, 2);
    floorTex = makeNoiseTexture(128, cfg.floorRGB, 50, GRID);
    ceilTex  = makeNoiseTexture(128, cfg.ceilRGB, 25, GRID);
  }
  const wallMat   = new THREE.MeshLambertMaterial({ map: wallTex });
  const floorMat  = new THREE.MeshLambertMaterial({ map: floorTex });
  const ceilMat   = new THREE.MeshLambertMaterial({ map: ceilTex });

  const wallGeom = new THREE.BoxGeometry(CELL, WALL_HEIGHT, CELL);
  let wallCount = 0;
  for (let x = 0; x < GRID; x++)
    for (let z = 0; z < GRID; z++)
      if (cells[x][z].wall) wallCount++;
  const wallMesh = new THREE.InstancedMesh(wallGeom, wallMat, wallCount);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      if (cells[x][z].wall) {
        const wx = (x - GRID/2) * CELL, wz = (z - GRID/2) * CELL;
        dummy.position.set(wx, WALL_HEIGHT/2, wz);
        dummy.updateMatrix();
        wallMesh.setMatrixAt(idx, dummy.matrix);
        // Track instance index so the rocket can hide individual blocks.
        S.wallBoxes.push({ x: wx, z: wz, half: CELL/2, instanceIdx: idx });
        idx++;
      }
    }
  }
  levelGroup.add(wallMesh);
  wallMeshRef = wallMesh;          // global handle for destroyWallsAt()
  S.wallMeshRef = wallMeshRef;
  const planeGeom = new THREE.PlaneGeometry(GRID*CELL, GRID*CELL);
  if (pool) {
    // Build the deck as four strips around the pool footprint so the pool
    // reads as a hole in the floor (instead of the pool sitting on top of it).
    const half = (GRID/2) * CELL;
    const stripGeoms = [
      // North (z > +halfZ)
      { sz: half - pool.halfZ, sx: 2 * half,                    cx: 0,                            cz: (pool.halfZ + half) / 2 },
      // South (z < -halfZ)
      { sz: half - pool.halfZ, sx: 2 * half,                    cx: 0,                            cz: -(pool.halfZ + half) / 2 },
      // East (x > +halfX, between pool.z bounds)
      { sz: 2 * pool.halfZ,    sx: half - pool.halfX,           cx: (pool.halfX + half) / 2,      cz: 0 },
      // West
      { sz: 2 * pool.halfZ,    sx: half - pool.halfX,           cx: -(pool.halfX + half) / 2,     cz: 0 },
    ];
    for (const g of stripGeoms) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(g.sx, g.sz), floorMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(g.cx, 0, g.cz);
      levelGroup.add(strip);
    }
  } else {
    const floor = new THREE.Mesh(planeGeom, floorMat);
    floor.rotation.x = -Math.PI/2;
    levelGroup.add(floor);
  }

  if (cfg.hasCeiling) {
    const ceiling = new THREE.Mesh(planeGeom.clone(), ceilMat);
    ceiling.rotation.x = Math.PI/2;
    ceiling.position.y = WALL_HEIGHT;
    levelGroup.add(ceiling);
  } else {
    const skyMat = new THREE.MeshBasicMaterial({ color: cfg.fogHex, side: THREE.BackSide });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 12, 10), skyMat);
    levelGroup.add(sky);
  }

  levelGroup.add(new THREE.AmbientLight(cfg.ambient, 0.55));

  // Lobby fixtures are wider/longer to read as classic 2×4ft fluorescent
  // troffers; other floors keep the slimmer panel.
  const panelGeom = cfg.style === 'lobby'
    ? new THREE.BoxGeometry(1.2, 0.04, 0.6)
    : new THREE.BoxGeometry(1.6, 0.05, 0.4);
  const panelMat = new THREE.MeshBasicMaterial({ color: cfg.lightHex });
  for (let x = 1; x < GRID-1; x += 3) {
    for (let z = 1; z < GRID-1; z += 3) {
      if (cells[x][z].wall) continue;
      const wx = (x - GRID/2) * CELL, wz = (z - GRID/2) * CELL;
      const light = new THREE.PointLight(cfg.lightHex, 1.2, 9, 1.6);
      light.position.set(wx, WALL_HEIGHT - 0.2, wz);
      levelGroup.add(light);
      const panel = new THREE.Mesh(panelGeom, panelMat.clone());
      panel.position.copy(light.position);
      panel.position.y = WALL_HEIGHT - 0.05;
      levelGroup.add(panel);
      S.lights.push({ light, panel, base: 1.2, seed: Math.random()*100, broken: Math.random() < 0.08 });
    }
  }

  const openCells = [];
  for (let x = 1; x < GRID-1; x++)
    for (let z = 1; z < GRID-1; z++)
      if (!cells[x][z].wall) openCells.push([x, z]);

  let spawnX = 0, spawnZ = 0;
  if (pool) {
    // Spawn well clear of the pool edge so you start on the deck looking at
    // the pool, not inside it.
    spawnX = 0;
    spawnZ = pool.z + pool.halfZ + 10;
  } else {
    outer: for (let r = 0; r < 5; r++) {
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          const cx = Math.floor(GRID/2)+dx, cz = Math.floor(GRID/2)+dz;
          if (cx>=0 && cz>=0 && cx<GRID && cz<GRID && !cells[cx][cz].wall) {
            spawnX = (cx - GRID/2)*CELL; spawnZ = (cz - GRID/2)*CELL;
            break outer;
          }
        }
    }
  }
  controls.getObject().position.set(spawnX, 1.7, spawnZ);
  player.lastPos.copy(controls.getObject().position);
  // (will override below if arriving by elevator)
  scene.userData.spawnedAtElevator = false;

  for (const c of companions) {
    if (!c.alive) continue;
    c.mesh = buildCompanionMesh(c, undefined, c.name);
    if (c.hasKnife) attachCompanionKnife(c.mesh);
    const px = spawnX + Math.cos(c.angle) * c.radius;
    const pz = spawnZ + Math.sin(c.angle) * c.radius;
    c.mesh.position.set(px, 0, pz);
    levelGroup.add(c.mesh);
  }

  // Almond water
  const almondCount = Math.max(6, 14 - n);
  const almondBodyGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 10);
  const almondCapGeom  = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10);
  const almondBodyMat  = new THREE.MeshBasicMaterial({ color: 0xf6e29a, transparent: true, opacity: 0.85 });
  const almondCapMat   = new THREE.MeshBasicMaterial({ color: 0x6b5018 });
  // Pickups + stair placement should avoid the sunken pool footprint.
  const isOnDeck = ([cx, cz]) => {
    if (!pool) return true;
    const wx = (cx - GRID/2) * CELL, wz = (cz - GRID/2) * CELL;
    return Math.abs(wx - pool.x) > pool.halfX + 1.0
        || Math.abs(wz - pool.z) > pool.halfZ + 1.0;
  };
  const candidate = openCells.filter(isOnDeck);
  for (let i = 0; i < almondCount && candidate.length; i++) {
    const k = Math.floor(Math.random() * candidate.length);
    const [cx, cz] = candidate.splice(k, 1)[0];
    const wx = (cx - GRID/2)*CELL + (Math.random()-0.5)*1.2;
    const wz = (cz - GRID/2)*CELL + (Math.random()-0.5)*1.2;
    const g = new THREE.Group();
    const body = new THREE.Mesh(almondBodyGeom, almondBodyMat);
    const cap  = new THREE.Mesh(almondCapGeom, almondCapMat);
    cap.position.y = 0.17;
    g.add(body); g.add(cap);
    g.position.set(wx, 0.18, wz);
    levelGroup.add(g);
    const glow = new THREE.PointLight(0xfff0a0, 0.4, 2.0, 2);
    glow.position.set(wx, 0.5, wz);
    levelGroup.add(glow);
    S.almonds.push({ mesh: g, glow, alive:true, baseY:0.18, seed: Math.random()*Math.PI*2 });
  }

  // Knife pickups (rare)
  if (!player.hasKnife) {
    const knifeCount = 1 + (Math.random() < 0.3 ? 1 : 0);
    for (let i = 0; i < knifeCount && candidate.length; i++) {
      const k = Math.floor(Math.random() * candidate.length);
      const [cx, cz] = candidate.splice(k, 1)[0];
      const wx = (cx - GRID/2)*CELL + (Math.random()-0.5)*1.2;
      const wz = (cz - GRID/2)*CELL + (Math.random()-0.5)*1.2;
      const g = buildKnifeMesh();
      g.position.set(wx, 0.25, wz);
      g.rotation.z = Math.PI / 2;
      levelGroup.add(g);
      const glow = new THREE.PointLight(0xc0e8ff, 0.5, 2.2, 2);
      glow.position.set(wx, 0.5, wz);
      levelGroup.add(glow);
      S.knives.push({ mesh: g, glow, alive:true, baseY:0.25, seed: Math.random()*Math.PI*2 });
    }
  }

  // First-aid S.medkits — restore HP on pickup. 2–4 per floor.
  const medkitCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < medkitCount && candidate.length; i++) {
    const k = Math.floor(Math.random() * candidate.length);
    const [cx, cz] = candidate.splice(k, 1)[0];
    const wx = (cx - GRID/2)*CELL + (Math.random()-0.5)*1.2;
    const wz = (cz - GRID/2)*CELL + (Math.random()-0.5)*1.2;
    const g = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.20, 0.22),
      new THREE.MeshLambertMaterial({ color: 0xf2f2f2 })
    );
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xd03030 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.005), crossMat);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.005), crossMat);
    crossV.position.set(0, 0, 0.114);
    crossH.position.set(0, 0, 0.114);
    g.add(box); g.add(crossV); g.add(crossH);
    g.position.set(wx, 0.20, wz);
    levelGroup.add(g);
    const glow = new THREE.PointLight(0xffd0d0, 0.4, 2.0, 2);
    glow.position.set(wx, 0.55, wz);
    levelGroup.add(glow);
    S.medkits.push({ mesh: g, glow, alive: true, baseY: 0.20, seed: Math.random()*Math.PI*2 });
  }

  // Stair exit at far corner
  let exitCell = null, bestDist = -1;
  for (const [cx, cz] of openCells) {
    if (!isOnDeck([cx, cz])) continue;
    const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
    const d = (wx-spawnX)*(wx-spawnX) + (wz-spawnZ)*(wz-spawnZ);
    if (d > bestDist) { bestDist = d; exitCell = [cx, cz]; }
  }
  if (exitCell) {
    const [cx, cz] = exitCell;
    const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
    const isFinal = n === LEVELS.length - 1;
    const stair = new THREE.Group();
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const stepCount = 6, stepW = 1.6, stepH = 0.18, stepD = 0.35;
    for (let i = 0; i < stepCount; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
      step.position.set(0, -i * stepH + stepH/2, -i * stepD - stepD/2);
      stair.add(step);
    }
    const pit = new THREE.Mesh(
      new THREE.BoxGeometry(stepW + 0.1, 0.05, stepD * stepCount),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    pit.position.set(0, -stepCount * stepH - 0.02, -stepD * stepCount / 2 - stepD/2);
    stair.add(pit);
    const railMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    for (const sx of [-stepW/2 - 0.05, stepW/2 + 0.05]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.0, stepD * stepCount + 0.1), railMat
      );
      rail.position.set(sx, 0.4, -stepD * stepCount / 2 - stepD/2);
      stair.add(rail);
    }
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 2.0, 0.25),
      new THREE.MeshBasicMaterial({ color: isFinal ? 0x88ff88 : 0xff5544 })
    );
    pillar.position.set(0, 1.0, 0.4);
    stair.add(pillar);
    const exitLight = new THREE.PointLight(isFinal ? 0xaaffaa : 0xff6666, 1.8, 8, 2);
    exitLight.position.set(0, 1.8, 0);
    stair.add(exitLight);
    stair.rotation.y = Math.atan2(-wx, -wz);
    stair.position.set(wx, 0, wz);
    levelGroup.add(stair);
    stairExit = { mesh: stair, pos: new THREE.Vector3(wx, 0, wz), pillar, isFinal };
    S.stairExit = stairExit;
  }

  // Bonus stair — warps to a random *other* floor. Placed far from spawn and
  // from the regular exit so the player can tell them apart.
  let randCell = null, randBest = -Infinity;
  for (const [cx, cz] of openCells) {
    if (!isOnDeck([cx, cz])) continue;
    const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
    const dSpawn = (wx-spawnX)*(wx-spawnX) + (wz-spawnZ)*(wz-spawnZ);
    if (dSpawn < 25) continue;
    if (stairExit) {
      const sx = wx - stairExit.pos.x, sz = wz - stairExit.pos.z;
      if (sx*sx + sz*sz < 49) continue;     // ≥7m from the regular stair
    }
    // Score: prefer cells that are far from BOTH spawn and the regular stair.
    let score = dSpawn;
    if (stairExit) {
      const sx = wx - stairExit.pos.x, sz = wz - stairExit.pos.z;
      score = Math.min(dSpawn, sx*sx + sz*sz);
    }
    if (score > randBest) { randBest = score; randCell = [cx, cz]; }
  }
  if (randCell) {
    const [cx, cz] = randCell;
    const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
    const stair = new THREE.Group();
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x2a2438 });
    const stepCount = 6, stepW = 1.6, stepH = 0.18, stepD = 0.35;
    for (let i = 0; i < stepCount; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), stepMat);
      step.position.set(0, -i * stepH + stepH/2, -i * stepD - stepD/2);
      stair.add(step);
    }
    const pit = new THREE.Mesh(
      new THREE.BoxGeometry(stepW + 0.1, 0.05, stepD * stepCount),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    pit.position.set(0, -stepCount * stepH - 0.02, -stepD * stepCount / 2 - stepD/2);
    stair.add(pit);
    const railMat = new THREE.MeshLambertMaterial({ color: 0x382a4a });
    for (const sx of [-stepW/2 - 0.05, stepW/2 + 0.05]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.0, stepD * stepCount + 0.1), railMat
      );
      rail.position.set(sx, 0.4, -stepD * stepCount / 2 - stepD/2);
      stair.add(rail);
    }
    // Distinct purple pulsing pillar so it reads as "the random stair".
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 2.0, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xb86bff })
    );
    pillar.position.set(0, 1.0, 0.4);
    stair.add(pillar);
    const rsLight = new THREE.PointLight(0xc080ff, 1.8, 8, 2);
    rsLight.position.set(0, 1.8, 0);
    stair.add(rsLight);
    stair.rotation.y = Math.atan2(-wx, -wz);
    stair.position.set(wx, 0, wz);
    levelGroup.add(stair);
    randomStair = { mesh: stair, pos: new THREE.Vector3(wx, 0, wz), pillar };
    S.randomStair = randomStair;
  }

  // ---------- Elevator (corner placement, animated entry) ----------
  function isCornerCell(cx, cz) {
    let walls = 0;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx+dx, nz = cz+dz;
      if (nx<0||nz<0||nx>=GRID||nz>=GRID || cells[nx][nz].wall) walls++;
    }
    return walls >= 2;
  }
  function openNeighborDir(cx, cz) {
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx+dx, nz = cz+dz;
      if (nx>=0 && nz>=0 && nx<GRID && nz<GRID && !cells[nx][nz].wall) return [dx, dz];
    }
    return [0, 1];
  }
  let elevCell = null, elevBest = -Infinity;
  for (const [cx, cz] of openCells) {
    if (!isCornerCell(cx, cz)) continue;
    const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
    const dSpawn = (wx-spawnX)*(wx-spawnX) + (wz-spawnZ)*(wz-spawnZ);
    if (dSpawn < 16) continue;
    if (stairExit) {
      const sx = wx - stairExit.pos.x, sz = wz - stairExit.pos.z;
      if (sx*sx + sz*sz < 36) continue;
    }
    if (dSpawn > elevBest) { elevBest = dSpawn; elevCell = [cx, cz]; }
  }
  // Fallback: any corner cell
  if (!elevCell) {
    for (const [cx, cz] of openCells) {
      if (isCornerCell(cx, cz)) { elevCell = [cx, cz]; break; }
    }
  }
  if (elevCell) {
    const [ex, ez] = elevCell;
    const wx = (ex - GRID/2)*CELL, wz = (ez - GRID/2)*CELL;
    const [odx, odz] = openNeighborDir(ex, ez);
    // Push the cabin against the wall opposite the open neighbor
    const insetX = wx - odx * (CELL/2 - 0.55);
    const insetZ = wz - odz * (CELL/2 - 0.55);

    const elev = new THREE.Group();
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0x806030 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.0), cabinMat);
    cabin.position.y = 1.2;
    elev.add(cabin);
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.2, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x2a2018 })
    );
    back.position.set(0, 1.1, -0.45);
    elev.add(back);

    // Two sliding doors — store base x for animation
    const doorMat = new THREE.MeshLambertMaterial({ color: 0xc0a060 });
    const dL = new THREE.Mesh(new THREE.BoxGeometry(0.74, 2.1, 0.04), doorMat);
    const dR = new THREE.Mesh(new THREE.BoxGeometry(0.74, 2.1, 0.04), doorMat);
    const dLBaseX = -0.38, dRBaseX = 0.38;
    dL.position.set(dLBaseX, 1.05, 0.51);
    dR.position.set(dRBaseX, 1.05, 0.51);
    elev.add(dL); elev.add(dR);

    // Call button + light
    const btn = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x66ddff })
    );
    btn.position.set(0.9, 1.2, 0.5);
    elev.add(btn);
    const elevLight = new THREE.PointLight(0x66ddff, 0.9, 4, 2);
    elevLight.position.set(0, 2.2, 0.4);
    elev.add(elevLight);

    // Orient: door (+z local) faces the open neighbor direction
    elev.rotation.y = Math.atan2(odx, odz);
    elev.position.set(insetX, 0, insetZ);
    levelGroup.add(elev);

    elevator = {
      mesh: elev,
      pos: new THREE.Vector3(insetX, 0, insetZ),
      doorOut: new THREE.Vector3(odx, 0, odz),
      btn, dL, dR, dLBaseX, dRBaseX,
      doorOpen: 1,    // 1 = open, 0 = closed
    };
  }

  // ---------- Guide NPC: a kind stranger who leads the player to the exit ----------
  if (stairExit) {
    let gCell = null, gBest = -Infinity;
    for (const [cx, cz] of openCells) {
      if (!isOnDeck([cx, cz])) continue;
      const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
      const dSpawn = (wx-spawnX)*(wx-spawnX) + (wz-spawnZ)*(wz-spawnZ);
      if (dSpawn < 49) continue;          // ≥7m from spawn
      const sx = wx - stairExit.pos.x, sz = wz - stairExit.pos.z;
      const dExit = sx*sx + sz*sz;
      if (dExit < 36) continue;           // ≥6m from exit (so they have somewhere to lead)
      // Score: prefer cells roughly midway between spawn and exit.
      const score = Math.min(dSpawn, dExit);
      if (score > gBest) { gBest = score; gCell = [cx, cz]; }
    }
    if (gCell) {
      const [cx, cz] = gCell;
      const wx = (cx - GRID/2)*CELL, wz = (cz - GRID/2)*CELL;
      const mesh = buildProceduralCompanion(0xf6f1d8, 0xb89060);
      mesh.add(makeNameTag('好心人', 0xfff0a0));
      mesh.position.set(wx, 0, wz);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      const haloRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.04, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffe070 })
      );
      haloRing.rotation.x = Math.PI / 2;
      haloRing.position.y = 2.0;
      mesh.add(haloRing);
      const haloLight = new THREE.PointLight(0xffd070, 1.6, 6, 2);
      haloLight.position.set(0, 1.8, 0);
      mesh.add(haloLight);
      levelGroup.add(mesh);
      guide = {
        mesh, haloRing, haloLight,
        cell: [cx, cz],
        pos: new THREE.Vector3(wx, 0, wz),
        alive: true,
        leading: false, arrived: false, greeted: false,
        path: null, pathIdx: 0, stuckTimer: 0,
        lineCooldown: 4,
        walkPhase: 0, bobSeed: Math.random()*Math.PI*2,
      };
    }
  }

  spawnProps(cfg, openCells);

  const numEntities = 3;
  // Entities must spawn far from the player so the game doesn't start
  // with one chewing on you. Require at least ~14m straight-line distance.
  const MIN_ENTITY_DIST_SQ = 14 * 14;
  const farEnough = openCells.filter(([cx, cz]) => {
    const wx = (cx - GRID/2) * CELL, wz = (cz - GRID/2) * CELL;
    const ddx = wx - spawnX, ddz = wz - spawnZ;
    return (ddx*ddx + ddz*ddz) >= MIN_ENTITY_DIST_SQ;
  });
  // Fallback to all open cells if the maze is small or fully clustered.
  const entitySpawnPool = farEnough.length ? farEnough : openCells;
  for (let i = 0; i < numEntities; i++) {
    // Prefer the Soldier.glb male NPC; fall back to the procedural figure
    // until the GLTF resolves (it's lazily upgraded later).
    const eg = (isSoldierLoaded() && buildSoldierEntity()) || buildHumanoidEntity();
    const ec = entitySpawnPool[Math.floor(Math.random()*entitySpawnPool.length)];
    eg.position.set((ec[0]-GRID/2)*CELL, 0, (ec[1]-GRID/2)*CELL);
    levelGroup.add(eg);
    S.entities.push({
      mesh: eg, speed: 1.4 + n*0.18, hp: 1.0,
      walkPhase: Math.random() * Math.PI * 2,
    });
  }

  // If we arrived by elevator, spawn the player just outside its doors,
  // facing into the room. Companions follow nearby.
  if (opts.spawnAtElevator && elevator) {
    const out = elevator.doorOut;
    const px = elevator.pos.x + out.x * 1.0;
    const pz = elevator.pos.z + out.z * 1.0;
    controls.getObject().position.set(px, 1.7, pz);
    player.lastPos.set(px, 1.7, pz);
    // Reset any residual camera tilt from death/lying-down so the view is upright.
    camera.rotation.set(0, 0, 0);
    if ('lookAt' in camera) {
      camera.lookAt(elevator.pos.x + out.x * 4, 1.7, elevator.pos.z + out.z * 4);
    }
    for (const c of companions) {
      if (!c.alive || !c.mesh) continue;
      c.mesh.position.set(px - out.x * 0.6, 0, pz - out.z * 0.6);
    }
    elevator.doorOpen = 0;
    scene.userData.spawnedAtElevator = true;
  } else if (opts.spawnAtElevator && !elevator) {
    // No elevator was placed on this floor — fall back to the central spawn
    // so we don't leave the player stuck at a stale position.
    controls.getObject().position.set(spawnX, 1.7, spawnZ);
    player.lastPos.set(spawnX, 1.7, spawnZ);
    camera.rotation.set(0, 0, 0);
  }

  // Start upright with full health — no dead-on-floor intro.
  player.lyingDown = false;
  player.standingUp = null;
  player.hasWokenUp = true;

  showFloorTitle(n + 1, cfg.name);
  // Kick off background GLTF upgrade for all alive companions on this floor.
  scheduleGLTFUpgrade();
  upgradeEntitiesToGLTF();
}

function spawnProps(cfg, openCells) {
  const levelGroup = S.levelGroup;
  const candidate = openCells.slice();
  function pick(num) {
    const out = [];
    for (let i = 0; i < num && candidate.length; i++) {
      const k = Math.floor(Math.random()*candidate.length);
      out.push(candidate.splice(k,1)[0]);
    }
    return out;
  }

  // Per-floor decoration runs in the floor file (see js/floors/<NN>-*.js).
  if (cfg.spawnProps) {
    cfg.spawnProps({
      THREE, levelGroup, GRID, CELL, WALL_HEIGHT, pick,
      wallBoxes: S.wallBoxes, electricZones: S.electricZones,
      toxicZones: S.toxicZones, moths: S.moths, pool,
      getButterflyProto, makeNoiseTexture,
    });
  }
}

function showFloorTitle(n, name) {
  floorTitleEl.textContent = `Level ${n} — ${name}`;
  floorTitleEl.style.opacity = '1';
  document.getElementById('floorTag').textContent = `第 ${n} / ${LEVELS.length} 层 — ${name}`;
  setTimeout(() => floorTitleEl.style.opacity = '0', 2500);
  // Mandarin announcement
  setTimeout(() => speak('旁白', `第 ${n} 层  ${name}`), 200);
}

  return { buildLevel, disposeLevel };
}
