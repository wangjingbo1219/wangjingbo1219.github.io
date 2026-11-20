"""Rebuild the lecture's ordered script bundle after editing assets/*.js."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1] / "physics_animation_lecture"
assets = root / "assets"
sources = [assets / "katex/katex.min.js", assets / "katex/auto-render.min.js",
           assets / "anim.js", *sorted((assets / "anim").glob("*.js")), assets / "deck.js"]
bundle = "\n".join(";/* Source: " + str(p.relative_to(root)) + " */\n" + p.read_text()
                   for p in sources)
name = "lecture." + hashlib.sha256(bundle.encode()).hexdigest()[:12] + ".js"
(assets / name).write_text(bundle)
page = root / "index.html"
html = page.read_text()
scripts = list(re.finditer(r'<script\b[^>]*src="assets/[^"<>]+"[^>]*>\s*</script>', html))
assert scripts, "No lecture scripts found"
for match in reversed(scripts[1:]):
    html = html[:match.start()] + html[match.end():]
first = scripts[0]
html = html[:first.start()] + '<script defer src="assets/' + name + '"></script>' + html[first.end():]
page.write_text(html)
for old in assets.glob("lecture.*.js"):
    if old.name != name:
        old.unlink()
print(f"Bundled {len(sources)} scripts into assets/{name} ({len(bundle.encode()):,} bytes)")
