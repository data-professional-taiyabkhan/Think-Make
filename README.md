# Think & Make — site

Static site for a personal-branding and video-editing studio. No framework, no build step, no `npm install`. Motion is done with GSAP 3.13 (ScrollTrigger + SplitText, both free since 3.13) and Lenis smooth scroll, loaded from jsDelivr. If the CDN is blocked, the page degrades to a fully readable static site.

## Structure

```
/
  index.html
  css/site.css
  js/site.js                preloader, smooth scroll, nav, cursor, hero showreel, reveals,
                            services preview, work gallery + lightbox, marquee, process line
  js/story.js               pinned scroll story (one scrubbed GSAP timeline)
  assets/                   derived, web-optimised media only — never hand-edit
    img/                    brand mark, duotone team portraits, stock plates
    video/client/           the 7 client pieces (true colour) + posters
    video/hero/             pre-graded 8s showreel loops (landscape + portrait sets)
    video/story/            small loops for the pinned story
    video/stock/            stock B-roll, texture only
  source-assets/            raw footage, brief, docx, reference build — gitignored, not deployed
  tools/build-assets.ps1    source-assets/ -> assets/ (client clips, stock, team, logo)
  tools/build-motion-assets.py   assets/video/client/ -> hero/story loops + larger posters
  ASSET-INVENTORY.md
  STORY-CONCEPT.md
  _headers                  Cloudflare Pages cache rules
```

## What is on the page

1. **Preloader** — frame counter + render bar, then a curtain wipe. Skipped on repeat visits within a session and under `prefers-reduced-motion`.
2. **Hero / showreel** — full-bleed hard-cut montage of three real client clips (pre-graded to the brand's muted-at-rest look), kinetic headline, HUD chrome (timecode, reel counter, segment bar). Portrait viewports get a portrait set of clips so nothing is centre-cropped.
3. **Manifesto** — the studio's one-sentence positioning, words brighten as you scroll.
4. **Pinned story** — five beats (Discovery → Strategy → Edit → Retention → Delivery): raw muted dailies scatter, converge into a stack, become one graded portrait reel, hard-cut to a landscape podcast trailer, then settle into a row of finished tiles. See `STORY-CONCEPT.md`.
5. **Marquee** — services ticker that speeds up and leans with scroll velocity.
6. **Services** — index list; on desktop an ambient stock-texture preview follows the cursor.
7. **Selected work** — pinned horizontal gallery on desktop (vertical stack on mobile). Hover plays the clip in colour with a "Play" cursor; click opens a lightbox with native controls.
8. **Why / Process / Reviews / Team / CTA / Footer** — reveals, a drawing process line, portrait tilt, magnetic buttons.

Every factual string (services, team bios, stats, social handles) is unchanged from the previous build, which was checked against `HamzaWebsite.docx`. Nothing new was invented.

## Regenerating assets

Two scripts, run in this order. Both are idempotent.

```powershell
# 1. Raw source material -> web-optimised client clips, stock, team, logo (needs source-assets/)
powershell -File tools/build-assets.ps1

# 2. Client clips -> hero showreel loops, story loops, larger posters (needs only assets/)
python tools/build-motion-assets.py
```

Both need `ffmpeg` on PATH (the Python script also accepts the `imageio-ffmpeg` pip package). The second script never reads `source-assets/`, so the Airbnb-badge excision in the Sohail Varca Villa clip (done in step 1) cannot be undone by it.

## Local preview

Video needs HTTP Range requests, which Python's `http.server` does not support. Use one of:

```powershell
npx --yes serve .
# or any static server with Range support; Cloudflare Pages preview also works
```

## Deploying to Cloudflare Pages

This folder is the deploy target as-is. Build command empty, output directory `/`. `_headers` marks `assets/*` immutable; every asset URL carries a `?v=N` query string, so bump `v` in `index.html` whenever an asset changes (currently `v=3`).

## Still TODO (each ships with a visible marker in the page — search for `data-todo`)

- **Booking URL** — every "Book a call" CTA points at `#book-url`.
- **Contact email**, **YouTube handle**, **domain** — footer.
- **Real client names** for the 7 work pieces — neutral descriptors until each client confirms.
- **3 reviews** — designed empty state, nothing fabricated.
- **Audio** — the derived client clips are muted (`-an` in `build-assets.ps1`), so the lightbox plays silently. If sound is wanted, drop `-an` from `Convert-ClientClip` and re-run both scripts.
- **Sohail Varca Villa clip** — a phone number and call icons appear in the last ~4s of the derived clip (the client's own end card). It was in the previous build too; confirm the client is fine with it the same way the phone overlay on the heritage-home reel was confirmed.

## Known deviation from the brief

"Unlimited Revisions" is kept in the Why section at the client's explicit request, overriding the brief's banned-claims list. See `ASSET-INVENTORY.md`.

## Verification notes (2026-09-26)

Checked with Playwright + headless Chromium at 1440×900 and 390×844 (touch), scrolling every section and the full pinned sequence, plus a reduced-motion run and a CDN-blocked run:

- No console errors, no failed requests (other than the H.264 abort noted below), no horizontal overflow on either viewport.
- Story beats activate in order (index, timecode, convergence, bloom, hard cut, settle) and reverse cleanly.
- Horizontal work gallery pins and counts 01–07; hover/play cursor; lightbox opens and closes with Escape.
- Reduced motion: no preloader, no smooth scroll, story renders as five static beats. CDN blocked: same static story, all content readable.

**Not verifiable in that environment:** the headless Chromium build has no H.264 decoder, so every `<video>` showed its poster. Actual playback, the hero montage cuts, and the 60fps DevTools profile of the pinned sequence at 2560×1440 need a real browser on your machine before this is called done.
