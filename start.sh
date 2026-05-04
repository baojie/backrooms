#!/usr/bin/env bash
# Start the Backrooms game with the Piper TTS sidecar — daemon mode.
#
# Default ports are themed (B-R = "6464"):
#   game (HTTP)  : 6464   — override with PORT=...
#   TTS (Piper)  : 6465   — override with TTS_PORT=...
#
# Both servers are launched detached with stdio piped to .run/*.log and
# PIDs saved to .run/*.pid. Use ./start.sh stop to terminate them.
#
# Prereqs (run once):
#   pipx install piper-tts
#   sudo apt install -y sox            # optional, enables per-speaker pitch
#   mkdir -p ~/.local/share/piper-voices && cd ~/.local/share/piper-voices
#   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx
#   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json

set -e
cd "$(dirname "$0")"

PORT="${PORT:-6464}"
TTS_PORT="${TTS_PORT:-6465}"

RUN_DIR=".run"
mkdir -p "$RUN_DIR"
TTS_PID_FILE="$RUN_DIR/tts.pid"
WEB_PID_FILE="$RUN_DIR/web.pid"
TTS_LOG="$RUN_DIR/tts.log"
WEB_LOG="$RUN_DIR/web.log"

is_running() {
  local pid_file="$1"
  [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

stop_one() {
  local name="$1" pid_file="$2"
  if is_running "$pid_file"; then
    local pid
    pid=$(cat "$pid_file")
    echo "[stop] killing $name pid=$pid"
    kill "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
}

cmd="${1:-start}"

case "$cmd" in
  stop)
    stop_one "web" "$WEB_PID_FILE"
    stop_one "tts" "$TTS_PID_FILE"
    echo "[stop] done."
    exit 0
    ;;
  status)
    if is_running "$TTS_PID_FILE"; then
      echo "[status] tts running pid=$(cat "$TTS_PID_FILE") log=$TTS_LOG"
    else
      echo "[status] tts not running"
    fi
    if is_running "$WEB_PID_FILE"; then
      echo "[status] web running pid=$(cat "$WEB_PID_FILE") log=$WEB_LOG"
    else
      echo "[status] web not running"
    fi
    exit 0
    ;;
  restart)
    "$0" stop
    exec "$0" start
    ;;
  start)
    ;;
  *)
    echo "usage: $0 [start|stop|restart|status]" >&2
    exit 2
    ;;
esac

if is_running "$WEB_PID_FILE" || is_running "$TTS_PID_FILE"; then
  echo "[start] already running — use '$0 stop' or '$0 restart' first." >&2
  "$0" status
  exit 1
fi

if command -v piper >/dev/null 2>&1; then
  nohup python3 tts_server.py --port "$TTS_PORT" >"$TTS_LOG" 2>&1 </dev/null &
  echo $! >"$TTS_PID_FILE"
  disown || true
  echo "[start] TTS server pid=$(cat "$TTS_PID_FILE") on http://127.0.0.1:$TTS_PORT (log: $TTS_LOG)"
else
  echo "[start] piper not found — game will fall back to Web Speech API."
fi

nohup python3 -m http.server "$PORT" >"$WEB_LOG" 2>&1 </dev/null &
echo $! >"$WEB_PID_FILE"
disown || true
echo "[start] game pid=$(cat "$WEB_PID_FILE") on http://localhost:$PORT (log: $WEB_LOG)"
echo "[start] daemons launched. Use '$0 stop' to terminate, '$0 status' to check."
