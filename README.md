# opennumerics.com

Static marketing site for **Open Numerics, LLC** — an advisory + implementation firm
for scientific computing and AI. Hosted on GitHub Pages (custom domain via `CNAME`).

## Stack

Plain HTML + CSS + a little vanilla JS. No build step, no framework.

- `index.html` — single-page homepage (hero, results, two-track *How we work*,
  vision, capabilities, *Solutions in action*, contact).
- `style.css` — the whole design system. Tokens live in `:root` at the top; edit
  those (colors, radius, spacing) before touching individual rules.
- `experience.js` — renders the *Solutions in action* cards from a `projects`
  array. **Add a new case study by adding an entry here** + a page in `solutions/`.
- `services.js` — expand/collapse behavior for the capability accordion.
- `solutions/*.html` — one page per case study. Some use MathJax (loaded per-page).
- `icons/`, `images/` — artwork. `*_40x40.svg` is the small icon; `*_240x160.svg`
  is the same artwork enlarged for the expanded service panel. `.pdf` files are
  source artwork and are not used by the site.

The navbar and `<head>` boilerplate are inlined in each page (no runtime partial
injection) so the site works as plain files and is fully crawlable.

## Run locally

Any static server works, e.g.:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Use a server rather than opening the file directly so root-absolute paths
(`/style.css`, `/images/...`) resolve.

## Deploy

Push to the default branch; GitHub Pages serves the root. `CNAME` points the
custom domain at the Pages site.
