#!/usr/bin/env bash
# Build a single, minified docs/index.html for GitHub Pages.
#
# What it does:
#   - Inlines js/*.js modules into the index.html module script (Three.js
#     stays on the unpkg CDN via the importmap).
#   - Each inlined module is wrapped in an IIFE that returns its exports,
#     so modules keep separate top-level scopes and don't collide.
#   - Local `import { a, b as c } from "./js/foo.js"` becomes
#     `const { a, b: c } = __mod_foo;`
#   - Minifies JS with terser, lightly minifies HTML.
#
# Requires: python3, terser (apt install node-terser  OR  npm i -g terser).

set -e
cd "$(dirname "$0")"

if ! command -v terser >/dev/null 2>&1; then
  echo "[deploy] terser not found — install with: sudo apt install node-terser" >&2
  exit 1
fi

mkdir -p docs
python3 - <<'PY'
import re, subprocess, pathlib, posixpath, sys

ROOT  = pathlib.Path('.').resolve()
SRC   = ROOT / 'index.html'
JSDIR = ROOT / 'js'
OUT   = ROOT / 'docs' / 'index.html'

# Inline order matches index.html's own import order (deps before consumers).
# Paths are relative to JSDIR; subdirs are supported.
MODULES = [
    # Floor data — leaf layout module first, then per-floor configs.
    'floors/_layouts.js',
    'floors/01-yellow.js', 'floors/02-garage.js', 'floors/03-powerplant.js',
    'floors/04-pool.js',   'floors/05-farm.js',    'floors/06-kindergarten.js',
    'floors/07-office.js', 'floors/08-library.js', 'floors/09-subway.js',
    'floors/10-rooftop.js',
    # Aggregator + the rest.
    'levels.js',
    'textures.js', 'audio.js', 'tts.js', 'lines.js',
    'weapons.js', 'characters.js',
]

html = SRC.read_text(encoding='utf-8')

m = re.search(r'(<script type="module">)(.*?)(</script>)', html, re.DOTALL)
if not m:
    sys.exit('[deploy] could not find module script block')
mod_open, mod_body, mod_close = m.group(1), m.group(2), m.group(3)

EXPORT_DECL_RE = re.compile(
    r"^\s*export\s+(?:(?:const|let|var)\s+([A-Za-z_$][\w$]*)|(?:function|class)\s+([A-Za-z_$][\w$]*))",
    re.MULTILINE,
)

# Match `import <spec> from "./path"` (any relative path). Used to rewrite
# inter-module imports inside helper modules to destructure from the bundled
# IIFE vars. Limited to single-line imports.
LOCAL_IMPORT_RE = re.compile(
    r"^[ \t]*import\s*(\{[^}]*\}|\*\s*as\s*[A-Za-z_$][\w$]*|[A-Za-z_$][\w$]*)"
    r"\s*from\s*['\"](\.[\w./-]+)['\"]\s*;?\s*$",
    re.MULTILINE,
)

def resolve_relative(importer_key: str, rel: str) -> str:
    """`importer_key` is like 'floors/01-yellow.js'; `rel` like './_layouts.js'.
    Returns a normalized key like 'floors/_layouts.js'."""
    base_dir = posixpath.dirname(importer_key)
    return posixpath.normpath(posixpath.join(base_dir, rel))

def destructure(spec: str, var: str) -> str:
    """Render an import-spec replacement as `const ... = <var>;`."""
    if spec.startswith('{'):
        inside = spec[1:-1]
        parts = []
        for raw in inside.split(','):
            p = raw.strip()
            if not p: continue
            m2 = re.match(r"([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)", p)
            parts.append(f'{m2.group(1)}: {m2.group(2)}' if m2 else p)
        return 'const { ' + ', '.join(parts) + ' } = ' + var + ';'
    if spec.startswith('*'):
        alias = spec.split('as', 1)[1].strip()
        return f'const {alias} = {var};'
    return f'const {{ default: {spec} }} = {var};'

def wrap_module(name: str, src: str, mod_vars_so_far: dict) -> tuple[str, str]:
    # 1. Drop `import ... from "three"` / "three/addons/..." — these are
    #    imported once at the top of the main module and live in outer scope.
    src = re.sub(r"^\s*import\s+[^;]+?from\s+['\"]three(?:/[^'\"]*)?['\"]\s*;?\s*$",
                 '', src, flags=re.MULTILINE)
    # 2. Rewrite inter-module imports (`import X from './sibling.js'`) to
    #    destructure from the previously bundled IIFE var.
    def local_repl(mm):
        spec, rel = mm.group(1).strip(), mm.group(2)
        target = resolve_relative(name, rel)
        var = mod_vars_so_far.get(target)
        if not var:
            sys.exit(f'[deploy] {name}: unresolved local import "{rel}" '
                     f'(resolved to {target}; not yet bundled)')
        return destructure(spec, var)
    src = LOCAL_IMPORT_RE.sub(local_repl, src)
    # 3. Collect exported names; then strip the `export ` keyword prefix.
    exports = []
    for em in EXPORT_DECL_RE.finditer(src):
        exports.append(em.group(1) or em.group(2))
    if not exports:
        sys.exit(f'[deploy] no exports detected in {name}')
    src = re.sub(r"^\s*export\s+(?=(?:const|let|var|function|class)\b)", '',
                 src, flags=re.MULTILINE)
    var = '__mod_' + re.sub(r'\W', '_', name.removesuffix('.js'))
    body = (
        f'\n// --- {name} ---\nconst {var} = (() => {{\n'
        + src
        + '\nreturn { ' + ', '.join(exports) + ' };\n})();\n'
    )
    return var, body

bundle = ''
mod_vars = {}  # 'floors/01-yellow.js' -> '__mod_floors_01_yellow'
for name in MODULES:
    var, body = wrap_module(name, (JSDIR / name).read_text(encoding='utf-8'), mod_vars)
    mod_vars[name] = var
    bundle += body

# Rewrite the main module: keep three imports, replace `./js/...` imports
# with destructuring from the corresponding wrapped IIFE.
MAIN_IMPORT_RE = re.compile(
    r"import\s*(\{[^}]*\}|\*\s*as\s*[A-Za-z_$][\w$]*|[A-Za-z_$][\w$]*)"
    r"\s*from\s*['\"]\./js/([\w./-]+)['\"]\s*;?",
    re.DOTALL,
)
def rewrite_main(body: str) -> str:
    def repl(mm):
        spec, fname = mm.group(1).strip(), mm.group(2)
        var = mod_vars.get(fname)
        if not var:
            return mm.group(0)  # leave unknown imports alone
        return destructure(spec, var)
    return MAIN_IMPORT_RE.sub(repl, body)

new_main = rewrite_main(mod_body)

new_module = bundle + '\n' + new_main

# Minify with terser. --module enables top-level mangling and lets it
# tree-shake unused locals.
proc = subprocess.run(
    ['terser', '--compress', 'passes=2', '--mangle', '--module'],
    input=new_module, capture_output=True, text=True,
)
if proc.returncode != 0:
    sys.stderr.write(proc.stderr)
    sys.exit('[deploy] terser failed')
min_js = proc.stdout.strip()

new_html = html[:m.start()] + mod_open + min_js + mod_close + html[m.end():]

# Light HTML minification: drop comments and collapse whitespace outside of
# <script>/<style> blocks (preserving their bodies).
def minify_html(s: str) -> str:
    parts, i = [], 0
    pat = re.compile(r'<(script|style)\b[^>]*>.*?</\1>', re.DOTALL | re.IGNORECASE)
    for mm in pat.finditer(s):
        chunk = s[i:mm.start()]
        chunk = re.sub(r'<!--.*?-->', '', chunk, flags=re.DOTALL)
        chunk = re.sub(r'>\s+<', '><', chunk)
        chunk = re.sub(r'\s{2,}', ' ', chunk)
        parts.append(chunk)
        parts.append(mm.group(0))
        i = mm.end()
    tail = s[i:]
    tail = re.sub(r'<!--.*?-->', '', tail, flags=re.DOTALL)
    tail = re.sub(r'>\s+<', '><', tail)
    tail = re.sub(r'\s{2,}', ' ', tail)
    parts.append(tail)
    return ''.join(parts).strip()

new_html = minify_html(new_html)
OUT.write_text(new_html, encoding='utf-8')

src_size = SRC.stat().st_size + sum((JSDIR / n).stat().st_size for n in MODULES)
out_size = OUT.stat().st_size
print(f'[deploy] {OUT}  {out_size:,} bytes  ({100*out_size/src_size:.1f}% of {src_size:,})')
PY

echo "[deploy] done — open docs/index.html or push to GitHub Pages."
