#!/usr/bin/env python3
"""Tiny static-site builder for leaphei.com mockup.

- _layouts/base.html wraps each page.
- _pages/<slug>.html contains a page's body. First lines may be `<!-- meta key: value -->`
  for title and description.
- Output: <slug>.html at the project root.
"""
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(ROOT, "_pages")
LAYOUT = os.path.join(ROOT, "_layouts", "base.html")

META_RE = re.compile(r"^<!--\s*(\w+)\s*:\s*(.+?)\s*-->\s*$")


def build_page(slug, body, layout):
    meta = {"title": slug.replace("-", " ").title(), "desc": "Home equity investment from Leap."}
    lines = body.splitlines()
    while lines:
        m = META_RE.match(lines[0])
        if not m:
            break
        meta[m.group(1).lower()] = m.group(2)
        lines.pop(0)
    body_clean = "\n".join(lines).strip("\n")
    html = layout.replace("{{TITLE}}", meta["title"]).replace("{{DESC}}", meta["desc"]).replace("{{BODY}}", body_clean)
    return html


def main():
    if not os.path.exists(LAYOUT):
        print("error: layout missing", file=sys.stderr)
        sys.exit(1)
    with open(LAYOUT, "r", encoding="utf-8") as f:
        layout = f.read()

    if not os.path.isdir(PAGES):
        print("error: _pages dir missing", file=sys.stderr)
        sys.exit(1)

    built = 0
    t0 = time.time()
    for fname in sorted(os.listdir(PAGES)):
        if not fname.endswith(".html"):
            continue
        slug = os.path.splitext(fname)[0]
        with open(os.path.join(PAGES, fname), "r", encoding="utf-8") as f:
            body = f.read()
        out = build_page(slug, body, layout)
        out_path = os.path.join(ROOT, f"{slug}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"  built {slug}.html ({len(out)} bytes)")
        built += 1

    print(f"\ndone. {built} pages in {(time.time()-t0)*1000:.0f}ms")


if __name__ == "__main__":
    main()
