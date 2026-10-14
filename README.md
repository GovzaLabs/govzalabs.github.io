# Govza Labs

Studio website — https://govzalabs.github.io

Plain static site, no build step: GitHub Pages serves `main` as is.

| Path | What |
| --- | --- |
| `index.html` | Home page |
| `azkar/` | Azkar product page |
| `404.html` | Not-found page |
| `assets/css/site.css` | All styles; colour and type tokens for light and dark themes at the top |
| `assets/js/calculator.js` | Cost calculator — prices, timelines and presets are in the config at the top |
| `assets/js/site.js` | Theme toggle, header, mobile menu, scroll reveals, project previews |
| `assets/js/analytics.js` | Firebase Analytics (link clicks, calculator events) |
| `assets/img/` | App icons, project screenshots, share image |

Run locally: `python3 -m http.server` in the repo root, then open http://localhost:8000.
