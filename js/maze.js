// Layout builders. Each returns a 2D `cells` grid of { wall: boolean }.
// Outer border is always walls; layout differs by floor theme.

function emptyGrid(GRID) {
  const cells = [];
  for (let x = 0; x < GRID; x++) {
    cells[x] = [];
    for (let z = 0; z < GRID; z++) {
      cells[x][z] = { wall: x === 0 || z === 0 || x === GRID-1 || z === GRID-1 };
    }
  }
  return cells;
}

// Classic Backrooms maze — recursive backtracker + 18% wall knock-out for rooms.
export function buildMaze(GRID) {
  const cells = [];
  for (let x = 0; x < GRID; x++) {
    cells[x] = [];
    for (let z = 0; z < GRID; z++) cells[x][z] = { wall: true };
  }
  function carve(x, z) {
    cells[x][z].wall = false;
    const dirs = [[2,0],[-2,0],[0,2],[0,-2]].sort(() => Math.random() - 0.5);
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      if (nx > 0 && nx < GRID-1 && nz > 0 && nz < GRID-1 && cells[nx][nz].wall) {
        cells[x + dx/2][z + dz/2].wall = false;
        carve(nx, nz);
      }
    }
  }
  carve(1, 1);
  for (let x = 1; x < GRID-1; x++)
    for (let z = 1; z < GRID-1; z++)
      if (cells[x][z].wall && Math.random() < 0.18) cells[x][z].wall = false;
  return cells;
}

// Single open room — only outer border walls. (Pool, farm, void.)
export function buildOpen(GRID) {
  return emptyGrid(GRID);
}

// Parking-lot pillars: regular grid of single-cell columns with wide aisles.
export function buildParking(GRID) {
  const cells = emptyGrid(GRID);
  for (let x = 3; x < GRID-2; x += 4) {
    for (let z = 2; z < GRID-1; z++) {
      if (z % 6 === 0) continue;          // cross-aisles
      cells[x][z].wall = true;
    }
  }
  return cells;
}

// Industrial rooms: a few large rectangular rooms with single-cell doors.
export function buildIndustrial(GRID) {
  const cells = emptyGrid(GRID);
  const rooms = 5;
  for (let i = 0; i < rooms; i++) {
    const w = 4 + Math.floor(Math.random() * 4);
    const h = 4 + Math.floor(Math.random() * 4);
    const rx = 2 + Math.floor(Math.random() * (GRID - w - 4));
    const rz = 2 + Math.floor(Math.random() * (GRID - h - 4));
    for (let dx = 0; dx <= w; dx++) {
      cells[rx+dx][rz].wall = true;
      cells[rx+dx][rz+h].wall = true;
    }
    for (let dz = 0; dz <= h; dz++) {
      cells[rx][rz+dz].wall = true;
      cells[rx+w][rz+dz].wall = true;
    }
    // Two doorways per room.
    cells[rx + Math.max(1, Math.floor(w/2))][rz].wall = false;
    cells[rx + w][rz + Math.max(1, Math.floor(h/2))].wall = false;
  }
  return cells;
}

// Kindergarten classrooms: coarse grid of small rooms with doorways.
export function buildClassrooms(GRID) {
  const cells = emptyGrid(GRID);
  const step = 6;
  for (let x = step; x < GRID-1; x += step)
    for (let z = 1; z < GRID-1; z++) cells[x][z].wall = true;
  for (let z = step; z < GRID-1; z += step)
    for (let x = 1; x < GRID-1; x++) cells[x][z].wall = true;
  // Punch one doorway per wall segment.
  for (let x = step; x < GRID-1; x += step) {
    for (let z0 = 0; z0 < GRID-1; z0 += step) {
      const dz = z0 + 1 + Math.floor(Math.random() * (step - 2));
      if (dz < GRID-1) cells[x][dz].wall = false;
    }
  }
  for (let z = step; z < GRID-1; z += step) {
    for (let x0 = 0; x0 < GRID-1; x0 += step) {
      const dx = x0 + 1 + Math.floor(Math.random() * (step - 2));
      if (dx < GRID-1) cells[dx][z].wall = false;
    }
  }
  return cells;
}

// Office cubicles: short partition stubs forming a grid pattern.
export function buildCubicles(GRID) {
  const cells = emptyGrid(GRID);
  const step = 4;
  for (let x = step-1; x < GRID-1; x += step) {
    for (let z = 1; z < GRID-1; z++) {
      if (z % step === Math.floor(step/2)) continue; // gap
      cells[x][z].wall = true;
    }
  }
  for (let z = step-1; z < GRID-1; z += step) {
    for (let x = 1; x < GRID-1; x++) {
      if (x % step === Math.floor(step/2)) continue;
      cells[x][z].wall = true;
    }
  }
  return cells;
}

// Library: long parallel bookshelf rows running east-west, with end aisles.
export function buildShelves(GRID) {
  const cells = emptyGrid(GRID);
  for (let z = 3; z < GRID-2; z += 3) {
    for (let x = 2; x < GRID-2; x++) {
      if (Math.random() < 0.08) continue; // occasional gaps
      cells[x][z].wall = true;
    }
  }
  return cells;
}

// Subway: two long parallel platform walls (the "track" between them) running
// north-south, with periodic crossings.
export function buildPlatforms(GRID) {
  const cells = emptyGrid(GRID);
  const lane1 = Math.floor(GRID / 3);
  const lane2 = Math.floor(2 * GRID / 3);
  for (let z = 1; z < GRID-1; z++) {
    if (z % 7 === 0) continue;            // periodic crossings
    cells[lane1][z].wall = true;
    cells[lane2][z].wall = true;
  }
  return cells;
}
