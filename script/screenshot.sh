#!/usr/bin/env bash
# Capture screenshots of the deployed docs/ build for history tracking.
#
# By default, walks each of the 10 floors using the game's `?shot=1&floor=N`
# auto-mode (which bypasses the overlay + pointer lock and walks forward
# for a few seconds before signaling readiness).
#
# Output:  screenshots/<UTC-timestamp>-<short-sha>[-dirty]/floor-NN-<name>.png
# The git history of screenshots/ is the visual changelog.
#
# Flags:
#   --title-only   capture only the title overlay (no per-floor walks)
#   --floor N      capture only floor N (1..10)
#
# Requires: google-chrome (or chromium), python3.

set -e
cd "$(dirname "$0")/.."

if [ ! -f docs/index.html ]; then
  echo "[shot] docs/index.html missing — run script/deploy.sh first." >&2
  exit 1
fi

CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)
if [ -z "$CHROME" ]; then
  echo "[shot] no Chrome/Chromium found." >&2
  exit 1
fi

MODE="floors"
ONE_FLOOR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --title-only) MODE="title"; shift ;;
    --floor) ONE_FLOOR="$2"; shift 2 ;;
    *) echo "[shot] unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Floor names mirror LEVELS[*].name in js/levels.js — kept in sync by hand
# because pulling them out at deploy time isn't worth the complexity.
FLOOR_NAMES=(yellow garage powerplant pool farm kindergarten office library subway rooftop)

SHA=$(git rev-parse --short HEAD 2>/dev/null || echo nogit)
DIRTY=$(git diff --quiet 2>/dev/null && echo "" || echo "-dirty")
TS=$(date -u +%Y%m%d-%H%M%SZ)
SHOT_DIR="screenshots/${TS}-${SHA}${DIRTY}"
mkdir -p "$SHOT_DIR"

# One ephemeral HTTP server + one Chrome user-data dir for the whole run.
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')
TMPDIR=$(mktemp -d)
python3 -m http.server "$PORT" --directory docs >/dev/null 2>&1 &
SVR=$!
trap 'kill $SVR 2>/dev/null || true; rm -rf "$TMPDIR"' EXIT

for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf -o /dev/null "http://127.0.0.1:$PORT/index.html" && break
  sleep 0.2
done

shoot() {
  local url="$1" out="$2"
  # Real-time wait — no --virtual-time-budget. Shot mode in index.html
  # hard-stops its own rAF loop after `run` seconds, which is the cue
  # Chrome uses to consider the page settled and snap a screenshot.
  # (--virtual-time-budget + --run-all-compositor-stages-before-draw both
  # deadlock with our continuous WebGL loop — do not re-add.)
  timeout 60 "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-sandbox \
    --user-data-dir="$TMPDIR" \
    --window-size=1280,800 \
    --enable-unsafe-swiftshader \
    --screenshot="$PWD/$out" \
    "$url" \
    >/dev/null 2>&1
  if [ ! -s "$out" ]; then
    echo "[shot] failed: $url" >&2
    return 1
  fi
  printf '[shot] %s  %s bytes\n' "$out" "$(stat -c %s "$out")"
}

if [ "$MODE" = "title" ]; then
  shoot "http://127.0.0.1:$PORT/index.html?shot=1&run=2" "$SHOT_DIR/title.png"
  exit 0
fi

# Title screen first, then each floor.
shoot "http://127.0.0.1:$PORT/index.html" "$SHOT_DIR/title.png"

if [ -n "$ONE_FLOOR" ]; then
  FLOORS=("$ONE_FLOOR")
else
  FLOORS=(1 2 3 4 5 6 7 8 9 10)
fi

for f in "${FLOORS[@]}"; do
  name="${FLOOR_NAMES[$((f-1))]:-floor$f}"
  out=$(printf "%s/floor-%02d-%s.png" "$SHOT_DIR" "$f" "$name")
  shoot "http://127.0.0.1:$PORT/index.html?shot=1&floor=$f&run=4" "$out" || true
done

echo "[shot] done — $SHOT_DIR"
