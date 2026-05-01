#!/usr/bin/env bash
# Start the Backrooms game with the Piper TTS sidecar.
#
# Prereqs (run once):
#   pipx install piper-tts
#   sudo apt install -y sox            # optional, enables per-speaker pitch
#   mkdir -p ~/.local/share/piper-voices && cd ~/.local/share/piper-voices
#   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx
#   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json

set -e
cd "$(dirname "$0")"

if command -v piper >/dev/null 2>&1; then
  python3 tts_server.py &
  TTS_PID=$!
  trap 'kill $TTS_PID 2>/dev/null' EXIT
  echo "[start] TTS server pid=$TTS_PID on http://127.0.0.1:8001"
else
  echo "[start] piper not found — game will fall back to Web Speech API."
fi

echo "[start] game on http://localhost:8000"
python3 -m http.server 8000
