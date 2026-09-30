# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**Built.** `index.html`, `css/site.css`, `js/site.js`, `js/story.js` and the derived `assets/` are the deployable site (see `README.md` for the section-by-section description). There is no package.json, no build step and no test runner; none should be invented. The site is static, no framework, and motion comes from GSAP 3.13 + Lenis via jsDelivr with a no-CDN fallback baked into the CSS/JS.

The raw material (client footage, `HamzaWebsite.docx`, the brief `claudecode.md`, the reference build) lives in `source-assets/`, which is gitignored. **A fresh clone does not contain it.** Everything in `assets/` is derived from it by committed scripts.

## The brief is the source of truth

If `source-assets/claudecode.md` is present, read it in full before changing copy or media placement. If it is not present (fresh clone), the rules below plus `ASSET-INVENTORY.md` are what you have; do not loosen them.

- **Invent nothing.** Every factual claim (names, stats, client identities, testimonials) must already exist in the page or trace to the brief / docx. No fabricated testimonials, metrics, turnaround or retention numbers.
- **Client work vs. stock is a hard boundary.** Only the derived `assets/video/client/*.mp4` pieces (the first seven from the brief plus the second batch listed in `ASSET-INVENTORY.md`, all client-cleared) may appear as work. `assets/video/stock/*` and `assets/img/stock/*` are backgrounds/texture only and must never be captioned or framed as client work. The fragrance-review reel shows third-party product branding; the client confirmed it is fine to show (2026-09-30).
- **Sohail Varca Villa** had an Airbnb badge at ~28.5–30.5s of the raw file. Stage 0 of `build-motion-assets.py` cuts 27–32s out (video and audio together); stage 2 only ever reads the already-cut derived clip. Never derive anything for that piece from the raw file by any other route.
- Client display names are unconfirmed. Keep the neutral descriptors and the visible `data-todo` markers until the owner confirms each one.
- "Unlimited Revisions" stays (client override, documented in `ASSET-INVENTORY.md`).

## Asset pipeline

```
source-assets/*             --tools/build-assets.ps1-->             assets/video/stock, assets/img/stock, assets/img/brand
source-assets/*             --tools/build-motion-assets.py stage 0--> assets/video/client/* (first seven, Sohail excision, audio kept)
source-assets/drive-2026-09 --tools/build-motion-assets.py stage 1--> assets/video/client/* (second batch, audio kept)
assets/video/client/*.mp4   --tools/build-motion-assets.py stage 2--> assets/video/hero/*, assets/video/story/*, every *-poster.jpg
```

Stages 0 and 1 skip themselves when their source folder is absent, so a fresh clone still regenerates loops and posters from the committed client clips. Never hand-process a file in `assets/`; fix the script and re-run. Both scripts need `ffmpeg` on PATH (the Python one also accepts `imageio-ffmpeg`). After changing any asset, bump the `?v=N` query string in `index.html` (`_headers` caches `assets/*` as immutable). Client clips keep their audio (`KEEP_AUDIO = True`); hero and story loops are always silent because they autoplay.

## Environment

- Owner's machine is Windows / PowerShell; keep commands PowerShell-compatible in docs. The Python script is cross-platform.
- Always pass `-nostdin` to ffmpeg in loops.
- Local preview needs a Range-capable static server (`npx serve .`), not `python -m http.server`.
- Deployment target is Cloudflare Pages, static files only.

## Performance constraints (non-negotiable)

1. Never drive animation directly from `scrollY`. Lenis + ScrollTrigger `scrub` provide the smoothed value; no per-frame `scrollY` reads.
2. Never write layout properties (`width`/`height`/`top`/`left`) inside a per-frame update; `transform`/`opacity` only. State changes on hover (cursor ring size, filters) are fine because they are not per-frame.
3. No `backdrop-filter` on repeated/stacked elements (the single fixed nav is the only one). No `mix-blend-mode` on full-viewport animated layers. The grain layer is a static SVG background, never animated.
4. Hidden beats use `autoAlpha` (visibility hidden at 0) and their videos are paused.
5. Grade in ffmpeg at encode time (hero loops are pre-graded), never with per-frame CSS `filter` on a full-viewport video.
6. Pause all off-screen video via `IntersectionObserver` (site.js has a global net; hero and story manage their own).
7. `will-change: transform` only on layers that actually animate.

Target: sustained 60fps through the pinned story and the work split at 2560×1440, profiled in DevTools Performance on a real browser.

## Verifying changes

Headless Chromium builds shipped with Playwright have no H.264 decoder, so `<video>` shows posters only. Layout, scroll choreography, console errors and overflow can be checked headlessly; playback and frame rate cannot. Say so explicitly when reporting.

## Brand system quick reference

- Palette: `--ink #000000` (true black, client request 2026-09-29; navy/blue stay as accents and footage veils) · `--navy #0D47A1` · `--blue #2196F3` · `--sky #90CAF9` · `--mist #E3F2FD`
- Work section is a **long form (16:9) | short form (9:16)** split, at the client's request. New client pieces go into the column that matches their aspect ratio; both columns use the same `.tile` markup.
- Type: Archivo (display, 800–900) · Instrument Sans (body) · IBM Plex Mono (labels/timecodes) — via Google Fonts, don't substitute Inter.
- Client footage: muted at rest (~42% saturation, ~58% brightness, navy veil), full colour on hover/when the story "grades" it. Never permanently re-grade a client's finished work: the work-grid and lightbox files stay true colour; only the hero background loops are pre-graded.
- Team section is names, roles and bios only: no portraits (client request 2026-09-30) and two people (Sneha Khan, Hamza Khan). Do not re-add photos or a third member without the client asking.
