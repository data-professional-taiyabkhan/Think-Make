# Think & Make — site

Static site. No framework, no build step, no npm install. GSAP + ScrollTrigger are loaded via CDN for the pinned scroll story only (see `ASSET-INVENTORY.md`'s Phase 0 report for why this replaced the originally-planned React option).

## Structure

```
/
  index.html
  css/site.css
  js/site.js          nav, marquee, work-grid hover/tap-to-play, off-screen video pausing
  js/story.js          pinned scroll story (GSAP ScrollTrigger)
  assets/               derived, web-optimised media only — never hand-edit, re-run tools/build-assets.ps1
  source-assets/        raw footage, brief, docx, reference build — not deployed
  tools/build-assets.ps1
  ASSET-INVENTORY.md
  STORY-CONCEPT.md
```

## Regenerating assets

If new or updated footage lands in `source-assets/`, re-run:

```powershell
powershell -File tools/build-assets.ps1
```

It derives everything in `assets/` from `source-assets/` via ffmpeg/ffprobe — muted, web-optimised client clips with poster frames, the Sohail Varca Villa Airbnb-badge window (27–32s) excised, stock B-roll compressed for background use, team photos crop-normalised and pushed through the brand's three-stop duotone grade, and the logo background keyed to transparent. Nothing in `assets/` is hand-processed; if it looks wrong, fix the script, not the file.

## Local preview

Works directly from `file://` — just open `index.html`.

To preview from a local static server instead (closer to how Cloudflare Pages will serve it):

```powershell
python -m http.server 8080
# or, if you have Node:
npx --yes serve .
```

Then visit `http://localhost:8080`.

## Deploying to Cloudflare Pages

This folder is the deploy target as-is (no build command, no output-directory setting needed):

1. **Drag-and-drop:** Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets → drag this whole folder in (excluding `source-assets/`, `probe/`, `tools/`, and the markdown docs if you want a minimal upload — they're harmless to include but not needed).
2. **Git-connect:** push this repo to GitHub/GitLab, connect it in Cloudflare Pages, leave the build command empty and the output directory as `/`.

## What's still a TODO

Everything below ships with a visible `TODO` marker in the page itself (search the HTML for `data-todo`) rather than being silently missing or invented:

- **Booking URL** — every "Book a call" / CTA link currently points at `#book-url`.
- **Contact email** — footer "Contact" link.
- **YouTube handle** — footer social row (LinkedIn, Instagram and Twitter are already wired to the real handles from `HamzaWebsite.docx`).
- **Domain** — footer copyright line.
- **Real client names** for the 7 Selected Work pieces — currently neutral descriptors ("Property Reel", "Podcast Trailer") per the Phase 0 decision; swap in real names once you confirm each client is OK being named.
- **3 testimonials** — the Reviews section is a designed empty state, no fabricated quotes.

None of these block deployment; the site is fully functional and honest about what's missing rather than guessing.

## Known deviation from the original brief

The brief's acceptance checklist (source-assets/claudecode.md §8) says `"Two rounds included"` should be present and `"unlimited revisions"` should be absent. During this build session you explicitly told me to keep **"Unlimited Revisions"** (matching `HamzaWebsite.docx`'s card copy) instead, overriding the brief's own banned-claims list. That's what's shipped. Flagging it here so it doesn't read as an oversight later — see `ASSET-INVENTORY.md`'s "Phase 0 report" section for the full decision log.

## Verification notes (2026-08-07)

What was actually checked this session, using a local `serve` static server (Python's `http.server` was tried first and rejected — it doesn't support HTTP Range requests, which `<video>` needs, so it isn't representative; use something like `serve` or Cloudflare's own preview for local testing):

- **Pinned story sequence** — all 5 beats verified end-to-end: correct beat activates/deactivates at the right scroll progress, off-screen beats' video is paused, layout/positioning/labels are correct, the reduced-motion static fallback renders correctly (fixed a real bug found here — see below).
- **Work grid, services, why-us, process, reviews (empty state), team, CTA, footer** — all visually verified, correct content, no fake testimonials, TODO markers visible where expected.
- **Mobile at 390px width** — verified via an embedded iframe technique (this session's browser tool couldn't resize its own viewport): hamburger nav opens/closes correctly, work grid reflows to 2 columns, no horizontal scroll (`document.documentElement.scrollWidth` confirmed).
- **Two real bugs found and fixed during this pass:** (1) a wrong poster image on one story layer, (2) `.beat__label`'s `position: absolute` rule wasn't scoped to the pinned stage, so it also hijacked the reduced-motion fallback's labels, stacking all five on top of each other — now scoped to `.story__stage .beat__label`.

**What could not be verified this session:** actual video *playback* smoothness and the 60fps DevTools profiling target. The browser automation tool available in this session could not decode H.264 video at all — confirmed with an isolated test (a freshly generated, minimal baseline-profile synthetic clip also hung indefinitely on `.play()`), so this is an environment limitation, not a site defect. Poster images, layout, and timing logic are all confirmed correct; the video element `src`/play/pause wiring is straightforward standard HTML5 video, but **you should still do a real DevTools Performance recording of the pinned scroll on your own machine before calling this done** — that's the one acceptance-criteria item this session genuinely couldn't check. Total derived asset weight and initial page weight are worth a real Lighthouse/Network-panel pass too, for the same reason.
