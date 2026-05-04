// Guide NPC — the kind stranger that greets the player on floor 1 and
// leads them to the stair exit via BFS pathfinding through the open cells.
//
// `findPathBFS(sx, sz, gx, gz, cells, GRID)` is a pure helper used both
// here and (potentially) by other AI subsystems — given start/goal cell
// coords and the maze grid, it returns an `[[x,z], ...]` path or null.
//
// `updateGuide(dt, t, ctx)` runs once per frame from the main tick loop.
// `ctx` provides the live game state: `{ guide, controls, stairExit,
// cells, GRID, CELL, collide }`. The function mutates `guide` in place
// (path, pathIdx, walkPhase, etc.) and never spawns new objects.

import { say, speak } from './tts.js';

const GUIDE_GREET_LINES = [
  '别怕，跟我走，我知道怎么出去。',
  '走这边，我带你们到楼梯口。',
  '我等了好久了。来，跟紧我。',
  '我以前出去过——跟着我，别走散。',
  '你们脸色这么难看，跟我来，前面有楼梯。',
];
const GUIDE_LEAD_LINES = [
  '快到了，跟紧。',
  '这边，左拐。',
  '别回头，往前走。',
  '撑一下，就两个拐弯。',
  '小心脚下。',
  '你们是好孩子。',
  '前面那束光就是出口。',
  '别说话，听我的就行。',
  '一起走，别落下。',
  '我数着步子呢，快了。',
];
const GUIDE_ARRIVE_LINES = [
  '到了——你们自己上楼。',
  '楼梯就在这儿。我能送的就到这。',
  '别犹豫，下去就是下一层。',
  '我留在这儿，你们走吧。',
];

// Breadth-first search through `cells` (a 2D grid of `{ wall: bool }`).
// Returns the shortest open path from (sx,sz) to (gx,gz) as an array of
// [x,z] cell coords (inclusive of both endpoints), or null if blocked.
export function findPathBFS(sx, sz, gx, gz, cells, GRID) {
  if (!cells || !cells[sx] || !cells[gx]) return null;
  if (cells[sx][sz].wall || cells[gx][gz].wall) return null;
  if (sx === gx && sz === gz) return [[sx, sz]];
  const visited = Array.from({length: GRID}, () => new Uint8Array(GRID));
  const parent = new Int32Array(GRID*GRID).fill(-1);
  const idx = (x, z) => x*GRID + z;
  const queue = [idx(sx, sz)];
  visited[sx][sz] = 1;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = (cur/GRID)|0, cz = cur % GRID;
    if (cx === gx && cz === gz) {
      const path = [];
      let p = cur;
      while (p !== -1) { path.push([(p/GRID)|0, p%GRID]); p = parent[p]; }
      return path.reverse();
    }
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx+dx, nz = cz+dz;
      if (nx < 0 || nz < 0 || nx >= GRID || nz >= GRID) continue;
      if (cells[nx][nz].wall) continue;
      if (visited[nx][nz]) continue;
      visited[nx][nz] = 1;
      parent[idx(nx, nz)] = cur;
      queue.push(idx(nx, nz));
    }
  }
  return null;
}

// Per-frame guide tick. Greets the player when within 4.5m, then leads
// them to the stair exit via BFS, pausing if the player lags > 7m behind,
// re-planning if stuck against a wall for >0.8s. Drops chatter on a
// 6–11s cooldown while leading.
export function updateGuide(dt, t, ctx) {
  const { guide, controls, stairExit, cells, GRID, CELL, collide } = ctx;
  if (!guide || !guide.alive || !guide.mesh) return;
  const pp = controls.getObject().position;
  const dToPlayer = Math.hypot(guide.mesh.position.x - pp.x, guide.mesh.position.z - pp.z);

  if (!guide.greeted && dToPlayer < 4.5) {
    guide.greeted = true;
    guide.leading = true;
    const line = GUIDE_GREET_LINES[Math.floor(Math.random()*GUIDE_GREET_LINES.length)];
    say(`好心人：「${line}」`, 5);
    speak('好心人', line, { pitch: 0.95, rate: 0.95 });
  }

  if (guide.haloRing) {
    const sc = 1 + Math.sin(t * 2) * 0.08;
    guide.haloRing.scale.set(sc, sc, sc);
  }
  if (guide.haloLight) {
    guide.haloLight.intensity = 1.4 + Math.sin(t * 3) * 0.4;
  }

  let walking = false;
  if (guide.leading && stairExit && !guide.arrived) {
    if (!guide.path) {
      const gcx = Math.max(0, Math.min(GRID-1, Math.floor(guide.mesh.position.x / CELL + GRID/2)));
      const gcz = Math.max(0, Math.min(GRID-1, Math.floor(guide.mesh.position.z / CELL + GRID/2)));
      const ecx = Math.max(0, Math.min(GRID-1, Math.floor(stairExit.pos.x / CELL + GRID/2)));
      const ecz = Math.max(0, Math.min(GRID-1, Math.floor(stairExit.pos.z / CELL + GRID/2)));
      guide.path = findPathBFS(gcx, gcz, ecx, ecz, cells, GRID);
      guide.pathIdx = guide.path && guide.path.length > 1 ? 1 : 0;
    }
    if (guide.path && guide.pathIdx < guide.path.length) {
      const playerLag = dToPlayer > 7.0;
      if (!playerLag) {
        const [tcx, tcz] = guide.path[guide.pathIdx];
        const twx = (tcx - GRID/2)*CELL, twz = (tcz - GRID/2)*CELL;
        const dx = twx - guide.mesh.position.x;
        const dz = twz - guide.mesh.position.z;
        const dd = Math.hypot(dx, dz);
        if (dd < 0.5) {
          guide.pathIdx++;
        } else {
          const sp = 2.6;
          const beforeX = guide.mesh.position.x, beforeZ = guide.mesh.position.z;
          guide.mesh.position.x += (dx/dd) * sp * dt;
          guide.mesh.position.z += (dz/dd) * sp * dt;
          collide(guide.mesh.position, 0.30);
          guide.mesh.rotation.y = Math.atan2(dx, dz);
          walking = true;
          const moved = Math.hypot(guide.mesh.position.x - beforeX, guide.mesh.position.z - beforeZ);
          if (moved < sp * dt * 0.25) {
            guide.stuckTimer += dt;
            if (guide.stuckTimer > 0.8) {
              guide.path = null;
              guide.stuckTimer = 0;
            }
          } else guide.stuckTimer = 0;
        }
      }
      guide.lineCooldown -= dt;
      if (guide.lineCooldown <= 0) {
        const line = GUIDE_LEAD_LINES[Math.floor(Math.random()*GUIDE_LEAD_LINES.length)];
        say(`好心人：「${line}」`, 3);
        speak('好心人', line, { pitch: 0.95, rate: 0.95 });
        guide.lineCooldown = 6 + Math.random()*5;
      }
    } else if (!guide.arrived) {
      guide.arrived = true;
      const line = GUIDE_ARRIVE_LINES[Math.floor(Math.random()*GUIDE_ARRIVE_LINES.length)];
      say(`好心人：「${line}」`, 5);
      speak('好心人', line, { pitch: 0.95, rate: 0.95 });
    }
  }

  const rig = guide.mesh.userData.rig;
  if (rig) {
    guide.walkPhase += dt * (walking ? 7 : 1.5);
    const sw = walking ? Math.sin(guide.walkPhase) * 0.5 : Math.sin(guide.walkPhase) * 0.04;
    if (rig.leftLeg)  rig.leftLeg.rotation.x  =  sw;
    if (rig.rightLeg) rig.rightLeg.rotation.x = -sw;
    if (rig.leftArm)  rig.leftArm.rotation.x  = -sw * 0.6;
    if (rig.rightArm) rig.rightArm.rotation.x =  sw * 0.6;
    if (rig.torso) {
      const br = 1 + Math.sin(t * 1.4 + guide.bobSeed) * 0.03;
      rig.torso.scale.set(br, 1, br * 0.85);
    }
  }

  guide.pos.copy(guide.mesh.position);
}
