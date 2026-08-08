# Story Concept — pinned scroll sequence

## Revision note (2026-08-07)

Superseding the caption-led version of this document. Direction from the client: forget matching the reference build — build something better, and tell the story through **footage and imagery, not text**. The touchstone given was the genre of scrollytelling sites where a product visually assembles itself as you scroll (e.g. a burger's layers stacking, then dropping into its box) — layered visual elements resolving into a finished thing, not caption cards narrating over a clip.

Applied here: raw client clips appear as scattered, offset, muted "layers" early in the sequence; they visually converge and align as the scroll progresses; color lands as they assemble; a contrasting format cuts in to prove range; the assembled layers then settle directly into the real work-grid tiles below — the layers *become* the grid, mirroring the burger-into-box hand-off instead of a separate closing flourish. On-screen text is cut to a single short mono-label per beat (reusing the studio's own five-word process language — Discovery / Strategy / Edit / Retention / Delivery), not sentences.

## Why this replaces the reference build's six-beat structure

The reference build (`source-assets/think-and-make-v4_2.html`) tells "one take becoming a brand" — a single generic clip getting graded across six pinned beats, text-forward, built without real footage behind it. Now that every asset has actually been reviewed (`ASSET-INVENTORY.md`), the more compelling story isn't one clip getting polished — it's that **the same two-person studio edits two completely different worlds**: glossy, motion-graphics-driven real estate/investment content, and raw, personal podcast conversation. That contrast *is* the differentiator ("high retention" — keeping people watching regardless of format), backed by real deliverables and told visually.

**5 beats, ~450vh pinned**, matching the studio's own process language from `HamzaWebsite.docx` (Discovery → Strategy → Edit → Retention → Delivery). Beat 5 hands off directly into the work grid instead of a separate closing flourish.

**Assets used only from the confirmed "client work" list, never stock in a work-implying context** (per brief §2.4; stock `PixelClip*`/`pexels-*` used only as ambient texture behind/beneath the layers, never as a "layer" itself). `Sohail Varca Villa AI.mp4` is used only outside its 28.5–30.5s Airbnb window (cut with margin, 27–32s excluded). `160 old V1 f3.mp4` is now client-cleared and available — see Resolved item below.

## Beats

### 01 — DISCOVERY · 0–15% (~68vh)
**On screen:** Near-black stage, radial spotlight mask (plate: `pexels-ron-lach-8102674.jpg`, graded per §3.2). Three to four muted, desaturated client clips appear as small offset video "cards" scattered around the frame at different depths/rotations — `Sohail Varca Villa AI.mp4` (interior segment, ~31–40s), `ED podcast trailer final.mp4`, `mens Poadcast F2.mp4`, `160 old V1 f3.mp4` — each silent, low-opacity, unsynced, like raw dailies not yet touched. A HUD chrome overlay (mono timecode, "REC" dot, fps counter) sits over the stage.
**Label:** `DISCOVERY` (small mono tag, corner-anchored — not a headline).
**Purpose:** establishes the edit-bay framing device and the "muted at rest" client-footage treatment (brief §3.4) as scattered raw material, before anything assembles.

### 02 — STRATEGY · 15–30% (~68vh)
**On screen:** The scattered cards from beat 1 begin drifting toward alignment — translating and rotating toward a shared axis (transform-only) — while timeline/waveform textures (`PixelClip1.mp4`, `PixelClip6.mp4`) run as low-opacity background plates underneath. Still desaturated, still silent; only their positions change.
**Label:** `STRATEGY`.
**Purpose:** gives Content Strategy — an otherwise invisible service — a concrete visual (the plan behind the assembly) instead of a generic icon or a sentence of copy.

### 03 — EDIT · 30–50% (~90vh)
**On screen:** The aligned cards converge and merge into one full-bleed frame: `Dubai real 12 f2.mp4` blooms to full saturation and full color — talking-head presenter, Burj Khalifa skyline, motion-graphic location cards ("Top locations: JVC, Business Bay"). This is the "grade lands" payoff moment, now literally the point where the scattered layers *become* one finished piece.
**Label:** `EDIT`.
**Purpose:** the single most legible gesture in the sequence — desaturated fragments resolving into one saturated whole — earned by real footage, not a stand-in clip.

### 04 — RETENTION · 50–75% (~113vh)
**On screen:** Hard cut to a completely different register: `faisaal pod trailer f2.mp4`, full color, full frame, its own bold Hinglish captions ("Wo REJECT ho jaate hain") burned in and driving the beat visually — the caption craft itself is the proof, not a claimed percentage.
**Label:** `RETENTION`.
**Purpose:** proves range — same studio, opposite format (raw two-person conversation vs. polished real-estate motion graphics) — without inventing a retention number the brief bans.

### 05 — DELIVERY · 75–100% (~90vh)
**On screen:** The frame splits and pulls back: `Dubai Real3 final.mp4` (portrait), `ED podcast trailer final.mp4` (landscape), and `160 old V1 f3.mp4` (portrait) settle into position at their mismatched aspect ratios and *become* the first three tiles of the actual work grid beneath the fold — no separate transition, the pinned layer literally is the top of the grid. The T&M ribbon mark (`LOGOHamza.png`) draws on in outline as the sequence releases.
**Label:** `DELIVERY`.
**Purpose:** the hand-off is the payoff — what the visitor scrolls into next isn't a new section, it's the same footage they just watched assemble, now at rest as real work.

## Scroll mechanics (per brief §7, implemented via GSAP ScrollTrigger)
ScrollTrigger's own scrub-smoothing drives progress (no direct raw `scrollY` binding in application code); every animated property is `transform`/`opacity` only; `will-change`/`translate3d` applied solely to the animating layers; off-screen video paused via `IntersectionObserver`; persistent booking CTA reachable throughout; full `prefers-reduced-motion` fallback (sequence unpins, all five beats' key frames visible as static stacked sections at their converged/final positions, no autoplay).

## Resolved item
The phone-number overlay on `160 old V1 f3.mp4` is client-cleared (2026-08-07) — the clip is now used both in the pinned story (beats 1 and 5, above) and in the work grid.

## Resolved item
The phone-number overlay on `160 old V1 f3.mp4` is client-cleared (2026-08-07) — the clip is available for **Selected Work** in Phase 1. It's still left out of the pinned scroll story itself; the 5-beat structure above stands as proposed, and this clip joins the work grid alongside the other six confirmed pieces.
