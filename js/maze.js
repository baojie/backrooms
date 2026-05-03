// Recursive-backtracker maze with extra wall removals for openness.
// Pure data: returns a 2D `cells` grid; the renderer turns it into geometry.
//
// Each cell is { wall: boolean }. `wall:true` means a solid block, `wall:false`
// means walkable space. Roughly 18% of remaining walls are knocked out so the
// result has wide rooms, not just corridors — closer to the Backrooms feel.

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
  // Knock out ~18% of remaining walls so the maze has rooms, not just halls.
  for (let x = 1; x < GRID-1; x++)
    for (let z = 1; z < GRID-1; z++)
      if (cells[x][z].wall && Math.random() < 0.18) cells[x][z].wall = false;
  return cells;
}
