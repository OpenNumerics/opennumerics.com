# opennumerics.com

Static marketing site for **Open Numerics, LLC** — computational science and
engineering acceleration. Hosted on GitHub Pages (custom domain via `CNAME`).

## Stack

Plain HTML + CSS + a little vanilla JS. No build step, no framework.

- `index.html` — single-page homepage. Section order is deliberate and follows
  the buying sequence: hero (the customer's problem) → industries ("is this for
  me?") → four productized offers → shared booking CTA → representative results
  → technical expertise → projects → engagement process → contact. Reordering
  these is a conversion decision, not a layout one.
- `style.css` — the whole design system. Tokens live in `:root` at the top; edit
  those (colors, radius, spacing) before touching individual rules.
- `experience.js` — renders the *Projects & insights* cards from a `projects`
  array. **Add a new case study by adding an entry here** + a page in `solutions/`.
- `site.js` — booking CTAs and analytics (see below). Loaded on every page.
- `solutions/*.html` — one page per case study. Some use MathJax (loaded per-page).
- `icons/`, `images/` — artwork. `*_40x40.svg` is the small icon. `.pdf` files are
  source artwork and are not used by the site.

The navbar and `<head>` boilerplate are inlined in each page (no runtime partial
injection) so the site works as plain files and is fully crawlable.

## Booking

The primary conversion is a Cal.com booking, not an email. Cal.com sits on top
of the `@opennumerics.com` Google Workspace calendar, so availability and
invites stay in Google.

`CAL_LINK` at the top of `site.js` is the single source of truth — the slug from
the public Cal.com share link, not the whole URL:

```
https://cal.com/hannes-vandecasteele-ttuhej/30min
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  <- CAL_LINK
```

Any element with a `data-book` attribute becomes a booking trigger: `site.js`
gives it a real `href` (so it still works if the embed is blocked) and attaches
the Cal popup. To add a CTA anywhere, that attribute is all you need.

## Analytics

GA4 (`G-HYR12B0NWT`). Custom events, all fired through the `track()` helper in
`site.js`, every one carrying a `page_type` of `home` or `case_study`:

| Event | Fires when | Key params |
|---|---|---|
| `book_click` | a booking CTA is pressed | `location` |
| `booking_started` | the Cal calendar renders | `method` |
| `booking_completed` | **a slot is actually booked** | `method` |
| `booking_error` | the Cal embed fails to load | `method` |
| `email_click` | a `mailto:` link is clicked | `address` |
| `case_study_click` | a results tile or project card | `link`, `source` |
| `nav_click` | a navbar link | `label` |
| `outbound_click` | any link leaving the site | `domain`, `link` |
| `cta_click` | other tagged CTAs | `location` |
| `section_view` | a section scrolls into view | `section` |
| `scroll_depth` | 25 / 50 / 75 / 100% | `percent` |
| `engaged_time` | 15 / 30 / 60 / 120 / 300s, paused when tab hidden | `seconds` |

**Mark `booking_completed` as a key event in the GA4 admin.** It's the only one
that represents a booked call — `book_click` just means someone opened the
calendar, and the gap between the two is where you debug the funnel.

## Run locally

Any static server works, e.g.:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Use a server rather than opening the file directly so root-absolute paths
(`/style.css`, `/site.js`, `/images/...`) resolve.

## Deploy

Push to the default branch; GitHub Pages serves the root. `CNAME` points the
custom domain at the Pages site.
