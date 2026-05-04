// Auto-screenshot mode: ?shot=1[&floor=N][&run=N]
//
// Drives headless Chrome captures from script/screenshot.sh.
//   - With ?floor=N: bypasses overlay + pointer lock, warps to floor N,
//     simulates a slow camera pan for `run` seconds (walking forward
//     too often runs the player into a wall on cramped floors).
//   - Without floor: leaves the title overlay visible, idles for `run`
//     seconds so dynamic UI elements settle.
// In both cases the main rAF loop is hard-stopped after `run` seconds so
// Chrome treats the page as settled and snaps a screenshot.

export function maybeRunScreenshotMode(ctx) {
  const params = new URLSearchParams(location.search);
  if (!params.get('shot')) return;
  const {
    LEVELS, overlay, controls, player,
    buildLevel, isGirlLoaded, isGLTFUpgradeComplete,
  } = ctx;

  const wantFloor = params.has('floor');
  const runSec = parseFloat(params.get('run') || '3');

  const _origRAF = window.requestAnimationFrame.bind(window);
  let shotDone = false;
  window.requestAnimationFrame = function (cb) {
    if (shotDone) return 0;
    return _origRAF(cb);
  };

  if (wantFloor) {
    const floor = Math.max(1, Math.min(LEVELS.length,
      parseInt(params.get('floor'), 10)));
    overlay.style.display = 'none';
    Object.defineProperty(controls, 'isLocked',
      { value: true, configurable: true, writable: true });
    buildLevel(floor - 1);
    player.lyingDown = false;
    player.standingUp = null;
    player.hasWokenUp = true;
    // Brighten the scene for screenshots — the flashlight is the only
    // strong directional light most floors have.
    player.flashlightOn = true;
    player.flashlightBattery = 1;
  }

  // Don't start the walk timer until the rigged-girl FBX has loaded and
  // every companion has been swapped in — otherwise screenshots catch
  // the procedural placeholder rigs. Falls through after MAX_WAIT_MS so
  // a model-load failure doesn't hang capture forever.
  const MAX_WAIT_MS = 25000;
  const waitStart = performance.now();
  function modelsReady() {
    if (!wantFloor) return true;
    if (!isGirlLoaded()) return false;
    return isGLTFUpgradeComplete();
  }

  let startTs = 0;
  function waitForModels() {
    if (modelsReady() || performance.now() - waitStart > MAX_WAIT_MS) {
      startTs = performance.now();
      pump();
    } else {
      _origRAF(waitForModels);
    }
  }
  // Sweep the camera through ~270° in place. The team girls spawn around
  // the player, so the final frame (when shotDone fires) is guaranteed to
  // catch one or two of them in close-up regardless of their layout.
  function pump() {
    const now = (performance.now() - startTs) / 1000;
    if (now < runSec) {
      if (wantFloor) {
        const t = now / runSec;
        controls.getObject().rotation.y = t * Math.PI * 1.5 - Math.PI * 0.4;
      }
      _origRAF(pump);
    } else {
      shotDone = true;
      window.__shotReady = true;
    }
  }
  _origRAF(waitForModels);
}
