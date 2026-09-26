# Story Concept — pinned scroll sequence

## Direction

Tell the studio's process through footage, not captions. Raw client clips appear as scattered, muted "dailies"; they converge and align as you scroll; colour lands as they become one finished piece; a contrasting format cuts in to prove range; the finished pieces settle into a row of tiles and the mark signs off. On-screen text is one big outlined word per beat, using the studio's own process language (Discovery / Strategy / Edit / Retention / Delivery), plus mono HUD chrome (timecode, beat index).

Assets come only from the confirmed client list; stock (`pixelclip1`, `pixelclip6`) appears only as low-opacity timeline texture under beat 02, never as a card. `Sohail Varca Villa` is used only via the derived clips that already exclude the Airbnb window.

## Implementation (js/story.js)

One paused GSAP timeline (10 units long), scrubbed by ScrollTrigger over a 520vh sticky stage (`scrub: 0.8`). All layout targets are function-based and re-evaluated on refresh, so the choreography survives resizes. Beat boundaries for video activation: 0 / .15 / .32 / .54 / .76 / 1.

| Beat | Timeline | What happens | Media |
|---|---|---|---|
| 01 Discovery | 0–1.5 | "Discovery" rises behind; four cards fade/scale in at scattered positions and rotations, navy-veiled and desaturated. | a `sohail-loop` (9:16), b `podcast-trailer-1-thumb` (16:9), c `podcast-trailer-3-thumb` (16:9), d `land-plot-thumb` (9:16) |
| 02 Strategy | 1.5–3.2 | "Strategy" rises; timeline textures fade in underneath and drift; the four cards travel to one aligned centre stack (rotation → ~0, scale .92). | + `pixelclip1`, `pixelclip6` at .22 / .14 opacity |
| 03 Edit | 3.2–5.4 | Cards collapse (fade + shrink); a full-height 9:16 reel scales up in their place; its navy veil dissolves — colour lands. Caption: "Property Reel · 9:16". | `story/edit-reel.mp4` (Dubai rental yields, 12–24s) |
| 04 Retention | 5.4–7.6 | Hard cut (a `set`, not a fade) to a wide 16:9 trailer at 1.06 scale easing to 1, its burned-in captions driving the beat. Caption: "Podcast Trailer · 16:9". | `story/retention-reel.mp4` (faisaal pod trailer, 15–27s) |
| 05 Delivery | 7.6–10 | The trailer shrinks to a tile in the centre; cards a and d slide in from the sides in full colour (veils off, `is-color`) to flank it; "Delivery" rises; the T&M mark pops in below. | retention reel + cards a, d + `img/brand/logo.png` |

Only the active beat's videos play; everything else is paused at each boundary (with a small hysteresis so scrub overshoot at a boundary doesn't thrash play/pause). `autoAlpha` keeps invisible layers `visibility: hidden`.

## Fallbacks

- `prefers-reduced-motion`: the sticky stage is not rendered; five static beats (poster per beat) stack vertically.
- GSAP not loaded (CDN blocked): `site.js` adds `body.no-motion`, which shows the same static beats.

## Resolved items

- Phone-number overlay on `160 old V1 f3.mp4` (card d / work tile 05): client-cleared 2026-08-07.
- Sohail Varca Villa end card (phone + call icons in the last ~4s of the derived clip): appears only in the work grid / lightbox, not in the story loop (3–12s). Confirm with the client (see README TODOs).
