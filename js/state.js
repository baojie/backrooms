// Central mutable game state. One object holds every per-level singleton
// and every per-level array; modules mutate fields directly instead of
// going through setter/getter pairs wired in ctxes.
//
// Two flavors of fields:
//   - singletons (levelGroup, stairExit, elevator, ...) — reassigned by
//     `level.js` on every level transition; consumers read `S.foo` each
//     access so they always see the current value.
//   - arrays (wallBoxes, entities, rockets, ...) — never reassigned;
//     `disposeLevel` clears them in place via `arr.length = 0`. Modules
//     can capture the array reference once and rely on it forever.
//
// Per-level fields live in S; immutable game-wide refs (camera, scene,
// player, companions, WEAPONS, ...) are still passed via ctx because
// they're set up exactly once at startup.

export function createGameState() {
  return {
    // singletons (reassigned per level)
    levelGroup: null,
    wallMeshRef: null,
    stairExit: null,
    randomStair: null,
    elevator: null,
    pool: null,
    guide: null,
    currentLevel: 0,
    cells: [],
    // arrays (in-place mutated; never reassigned)
    wallBoxes: [],
    lights: [],
    almonds: [],
    knives: [],
    medkits: [],
    entities: [],
    rockets: [],
    electricZones: [],
    toxicZones: [],
    boats: [],
    moths: [],
  };
}
