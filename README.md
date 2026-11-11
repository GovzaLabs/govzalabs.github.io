# Govza Labs

Studio website — https://govzalabs.ru

Plain static site, no build step. The Govza VPS serves a checkout of `main` as is.
GitHub Pages still publishes the same files at https://govzalabs.github.io.

| Path | What |
| --- | --- |
| `index.html` | Home page |
| `azkar/` | Azkar product page |
| `404.html` | Not-found page |
| `assets/css/site.css` | All styles; colour and type tokens for light and dark themes at the top |
| `assets/js/site.js` | Theme toggle, header, mobile menu, scroll reveals, project previews |
| `assets/js/analytics.js` | Firebase Analytics (link and store clicks) |
| `assets/img/` | App icons, project screenshots, share image |
| `deploy/` | The nginx container that serves the site on the VPS |

Run locally: `python3 -m http.server` in the repo root, then open http://localhost:8000.

## Publishing

The checkout on the VPS is `/home/apps/govzalabs`, mounted read-only into the
`govzalabs-site` container. Push to `main`, then:

```bash
ssh govza-vps 'git -C /home/apps/govzalabs pull --ff-only'
```

The new files are live at once. Only a change in `deploy/` needs more:

```bash
ssh govza-vps 'docker exec govzalabs-site nginx -t && docker exec govzalabs-site nginx -s reload'   # deploy/nginx
ssh govza-vps 'docker compose -f /home/apps/govzalabs/deploy/docker-compose.yml up -d'             # docker-compose.yml
```

The VPS's nginx-proxy routes `govzalabs.ru` and `www.govzalabs.ru` to the
container and renews their certificates by itself. DNS: two A records, `@` and
`www`, to `51.250.114.111`.
