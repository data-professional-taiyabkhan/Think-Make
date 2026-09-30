# Think & Make — site

Static site for a personal-branding and video-editing studio. No framework, no build step, no `npm install`. Motion is done with GSAP 3.13 (ScrollTrigger + SplitText, both free since 3.13) and Lenis smooth scroll, loaded from jsDelivr. If the CDN is blocked, the page degrades to a fully readable static site.

## Structure

```
/
  index.html
  css/site.css
  js/site.js                preloader, smooth scroll, nav, cursor, hero showreel, reveals,
                            services preview, work split + lightbox, marquee, process line
  js/story.js               pinned scroll story (one scrubbed GSAP timeline)
  assets/                   derived, web-optimised media only — never hand-edit
    img/                    brand mark, stock plates
    video/client/           the 15 derived client pieces (true colour, with audio where the raw file was available) + posters
    video/hero/             pre-graded 8s showreel loops (landscape + portrait sets)
    video/story/            small loops for the pinned story
    video/stock/            stock B-roll, texture only
  source-assets/            raw footage, brief, docx, reference build — gitignored, not deployed
    drive-2026-09/          second batch of client reels from the Drive folder
  tools/build-assets.ps1    source-assets/ -> stock B-roll, stock stills, logo
  tools/build-motion-assets.py   raw client footage -> client clips (audio kept); client clips -> hero/story loops + posters
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
7. **Selected work** — a split: **long form** (16:9) on the left, **short form** (9:16) on the right, each column with its own sticky header, a divider that draws as you scroll, and a gentle counter-scroll on the short-form column. Columns stack on mobile. Hover plays the clip in colour with a "Play" cursor; click opens a lightbox with native controls. New pieces go in whichever column matches their format.
8. **Why / Process / Reviews / Team / CTA / Footer** — reveals, a drawing process line, magnetic buttons. Team is names, roles and bios only (no portraits, at the client's request), two people.

Every factual string (services, team bios, stats, social handles) is unchanged from the previous build, which was checked against `HamzaWebsite.docx`. Tile titles are neutral descriptors of what is on screen, plus the clip's real duration. Nothing new was invented. Background is true black at the client's request (2026-09-29). Client confirmations on 2026-09-30: the twin-villa and Varca villa phone-number end cards are fine, the fragrance reel is fine to show, team portraits are removed and Rahul is no longer listed.

## Regenerating assets

Two scripts, run in this order. Both are idempotent.

```powershell
# 1. Stock B-roll, stock stills, logo (needs the raw files in source-assets/)
powershell -File tools/build-assets.ps1

# 2. Client clips with audio (stage 0: first seven from source-assets/, stage 1: second batch
#    from source-assets/drive-2026-09/ — each stage skips itself if its folder is absent),
#    then hero showreel loops, story loops and every poster from the client clips
python tools/build-motion-assets.py
```

Both need `ffmpeg` on PATH (the Python script also accepts the `imageio-ffmpeg` pip package). The Sohail Varca Villa Airbnb window (raw 27–32s) is excised in stage 0 with audio trimmed in sync; stage 2 only ever reads the derived clip, so the excision cannot be undone from there.

**Audio status right now:** the eight second-batch reels carry their audio. The first seven are still silent because their raw files were not available where this build ran. Put the seven raw files (`160 old V1 f3.mp4`, `Dubai real 12 f2.mp4`, `Dubai Real3 final.mp4`, `ED podcast trailer final.mp4`, `faisaal pod trailer f2.mp4`, `mens Poadcast F2.mp4`, `Sohail Varca Villa AI.mp4`) in `source-assets/` and run step 2 once; nothing else changes.

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
- **Audio for the first seven clips** — the lightbox plays sound for the second batch; the original seven stay silent until the raw files are present and the script is re-run (see "Regenerating assets"). Hover previews are always silent (browser autoplay rules); sound plays when a tile is clicked.

## Known deviation from the brief

"Unlimited Revisions" is kept in the Why section at the client's explicit request, overriding the brief's banned-claims list. See `ASSET-INVENTORY.md`.

## Verification notes (2026-09-30)

Checked with Playwright + headless Chromium at 1440×900 and 390×844 (touch), scrolling every section and the full pinned sequence, plus a reduced-motion run and a CDN-blocked run:

- No console errors, no failed requests (other than the H.264 abort noted below), no horizontal overflow on either viewport.
- Story beats activate in order (index, timecode, convergence, bloom, hard cut, settle) and reverse cleanly.
- Work split: sticky column headers hold, divider draws, hover/play cursor works, lightbox opens (sized per format) and closes with Escape.
- Reduced motion: no preloader, no smooth scroll, story renders as five static beats. CDN blocked: same static story, all content readable.

**Not verifiable in that environment:** the headless Chromium build has no H.264 decoder, so every `<video>` showed its poster. Actual playback, the hero montage cuts, and the 60fps DevTools profile of the pinned sequence at 2560×1440 need a real browser on your machine before this is called done.
