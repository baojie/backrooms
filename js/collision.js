// Player / NPC collision against the level's wall boxes + outer arena clamp.
//
// `makeCollider({ S, GRID, CELL })` returns a `collide(pos, r)` helper
// that pushes `pos` (a THREE.Vector3) out of any overlapping wall box
// and clamps it inside the level's bounding square.
//
// `S.wallBoxes` is read on every call so the closure stays valid even
// after `disposeLevel` clears the array in place.

export function makeCollider({ S, GRID, CELL }) {
  return function collide(pos, radius = 0.35) {
    for (const w of S.wallBoxes) {
      const hx = w.halfX ?? w.half, hz = w.halfZ ?? w.half;
      const dx = pos.x - w.x, dz = pos.z - w.z;
      if (Math.abs(dx) < hx + radius && Math.abs(dz) < hz + radius) {
        const px = (hx + radius) - Math.abs(dx);
        const pz = (hz + radius) - Math.abs(dz);
        if (px < pz) pos.x += Math.sign(dx) * px;
        else         pos.z += Math.sign(dz) * pz;
      }
    }
    const limit = (GRID/2)*CELL - 1;
    pos.x = Math.max(-limit, Math.min(limit, pos.x));
    pos.z = Math.max(-limit, Math.min(limit, pos.z));
  };
}
