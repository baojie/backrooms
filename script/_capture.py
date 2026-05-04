#!/usr/bin/env python3
"""Headless-Chrome CDP screenshot driver.

Launches chrome with a debug port, navigates to the URL, polls for
window.__shotReady === true, then takes a Page.captureScreenshot.

Usage:
  _capture.py CHROME URL OUT.png [--wait SECONDS] [--width N] [--height N]
"""
import argparse, asyncio, base64, json, os, socket, subprocess, sys, time, urllib.request
import websockets

def free_port() -> int:
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def wait_for_devtools(port: int, deadline: float) -> dict:
    """Poll /json/version until chrome's debug endpoint answers, then list tabs."""
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1) as r:
                json.loads(r.read())
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json', timeout=1) as r:
                tabs = json.loads(r.read())
            for t in tabs:
                if t.get('type') == 'page':
                    return t
        except Exception:
            time.sleep(0.1)
    raise RuntimeError('chrome devtools never came up')

async def cdp(args):
    port = free_port()
    user_dir = f'/tmp/_cdp_{os.getpid()}_{int(time.time()*1000)}'
    cmd = [
        args.chrome,
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
        f'--user-data-dir={user_dir}',
        f'--window-size={args.width},{args.height}',
        '--enable-unsafe-swiftshader',
        # Headless chrome on this box hits ERR_CERT_VERIFIER_CHANGED on
        # unpkg.com (the Three.js CDN). The screenshots aren't security-
        # critical, so silence it.
        '--ignore-certificate-errors',
        f'--remote-debugging-port={port}',
        'about:blank',
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        deadline = time.monotonic() + 10
        tab = wait_for_devtools(port, deadline)
        ws_url = tab['webSocketDebuggerUrl']

        async with websockets.connect(ws_url, max_size=20_000_000) as ws:
            mid = 0
            async def send(method, params=None):
                nonlocal mid
                mid += 1
                await ws.send(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get('id') == mid:
                        if 'error' in msg:
                            raise RuntimeError(f'CDP {method} failed: {msg["error"]}')
                        return msg.get('result', {})

            await send('Page.enable')
            await send('Runtime.enable')
            await send('Page.navigate', {'url': args.url})

            # Poll for __shotReady. Falls through after --wait seconds so
            # a stuck page doesn't hang capture forever.
            ready_deadline = time.monotonic() + args.wait
            ready = False
            while time.monotonic() < ready_deadline:
                r = await send('Runtime.evaluate',
                               {'expression': 'window.__shotReady === true', 'returnByValue': True})
                if r.get('result', {}).get('value') is True:
                    ready = True
                    break
                await asyncio.sleep(0.2)
            # One more frame to flush whatever the game queued before __shotReady.
            await asyncio.sleep(0.2)

            shot = await send('Page.captureScreenshot', {'format': 'png'})
            data = base64.b64decode(shot['data'])
            with open(args.out, 'wb') as f:
                f.write(data)
            sys.stderr.write(f'[cdp] {args.out} {len(data)}b ready={ready}\n')
    finally:
        proc.terminate()
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill()
        try:
            import shutil; shutil.rmtree(user_dir, ignore_errors=True)
        except Exception: pass

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('chrome')
    ap.add_argument('url')
    ap.add_argument('out')
    ap.add_argument('--wait', type=float, default=30.0,
                    help='Max seconds to wait for window.__shotReady')
    ap.add_argument('--width', type=int, default=1280)
    ap.add_argument('--height', type=int, default=800)
    asyncio.run(cdp(ap.parse_args()))

if __name__ == '__main__':
    main()
