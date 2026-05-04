#!/usr/bin/env python3
"""
Minimal Piper TTS HTTP server for the Backrooms game.

Usage:
    python3 tts_server.py [--model PATH] [--port 6465]

Endpoints:
    GET /tts?text=...&speaker=xiaowang|xiaoli|narrator
        Returns audio/wav.
    GET /health
        Returns 200 OK if piper is reachable.
"""
import argparse, os, shutil, subprocess, sys, tempfile, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DEFAULT_MODEL = os.path.expanduser(
    "~/.local/share/piper-voices/zh_CN-huayan-medium.onnx"
)

# Per-speaker length_scale (lower = faster). Pitch shift via sox if available.
SPEAKERS = {
    "xiaowang":  {"length_scale": 1.00, "pitch_cents": -250},  # 小王 — lower
    "xiaoli":    {"length_scale": 0.95, "pitch_cents":  300},  # 小李 — higher
    "narrator":  {"length_scale": 1.20, "pitch_cents": -400},  # 旁白 — slow & low
    "default":   {"length_scale": 1.00, "pitch_cents":    0},
}

HAS_SOX = shutil.which("sox") is not None
HAS_PIPER = shutil.which("piper") is not None


def synth(text: str, speaker: str, model: str) -> bytes:
    cfg = SPEAKERS.get(speaker, SPEAKERS["default"])
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, "raw.wav")
        out = os.path.join(td, "out.wav")
        cmd = [
            "piper", "--model", model,
            "--length-scale", str(cfg["length_scale"]),
            "--output_file", raw,
        ]
        proc = subprocess.run(cmd, input=text.encode("utf-8"),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.decode("utf-8", "replace"))

        final = raw
        if cfg["pitch_cents"] and HAS_SOX:
            subprocess.run(
                ["sox", raw, out, "pitch", str(cfg["pitch_cents"])],
                check=True,
            )
            final = out

        with open(final, "rb") as f:
            return f.read()


class Handler(BaseHTTPRequestHandler):
    server_version = "PiperTTS/1.0"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(u.query)

        if u.path == "/health":
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"OK\n")
            return

        if u.path != "/tts":
            self.send_response(404); self._cors(); self.end_headers(); return

        text = (qs.get("text", [""])[0] or "").strip()
        speaker = qs.get("speaker", ["default"])[0]
        if not text:
            self.send_response(400); self._cors(); self.end_headers()
            self.wfile.write(b"missing 'text'"); return

        try:
            wav = synth(text, speaker, self.server.model)
        except Exception as e:
            sys.stderr.write(f"[tts] error: {e}\n")
            self.send_response(500); self._cors(); self.end_headers()
            self.wfile.write(str(e).encode("utf-8")); return

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(wav)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(wav)

    def log_message(self, fmt, *args):
        sys.stderr.write("[tts] " + (fmt % args) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--port", type=int, default=6465)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    if not HAS_PIPER:
        sys.exit("ERROR: 'piper' not found in PATH. Install with: pipx install piper-tts")
    if not os.path.exists(args.model):
        sys.exit(f"ERROR: model not found: {args.model}\n"
                 "Download a Chinese voice from "
                 "https://huggingface.co/rhasspy/piper-voices/tree/main/zh/zh_CN")

    if not HAS_SOX:
        sys.stderr.write("[tts] warning: 'sox' not installed — per-speaker pitch shift disabled.\n")

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    httpd.model = args.model
    sys.stderr.write(f"[tts] piper server on http://{args.host}:{args.port}  model={args.model}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
