# Leap HEI — website prototype

A static-site prototype for [Leap HEI](https://leaphei.com), built for client preview.

Live preview: **https://digitalwillads.github.io/leaphei-site/**

## Stack

- Vanilla HTML / CSS / vanilla JS — no build framework
- `build.py` (Python stdlib only) wraps `_pages/*.html` body content in `_layouts/base.html` and writes the rendered files to the repository root
- Google Fonts: Cormorant Garamond (serif) + Jost (sans)
- Site palette: forest `#1e3528`, linen `#f4f0e8`, cream `#faf8f4`, bronze `#b8975a`

## Local dev

```bash
python3 build.py
python3 -m http.server 8780
# open http://localhost:8780/
```

Edit page bodies in `_pages/*.html` and the shared chrome in `_layouts/base.html`. Rerun `build.py` to regenerate the root-level files. Styles live in `css/main.css`; behaviors in `js/site.js`.
