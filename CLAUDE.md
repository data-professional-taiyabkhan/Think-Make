# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a **pre-build** repository. It currently contains only `assets/` — raw client footage, stock B-roll, brand assets, a reference HTML build, and the project brief. No `index.html`, CSS, JS, or build tooling exists at the repo root yet; those are created during Phase 1 (see below). There is no git repo, no package.json, and no test/lint/build commands — none should be invented. This is a static site with **no framework and no npm install** unless explicitly justified and approved (see brief §1).

## The brief is the source of truth

**Read `assets/claudecode.md` in full before doing anything in this repo.** It is the actual project specification — hard rules, ground-truth facts (team bios, stats, services, client list), brand system, performance constraints, phased workflow, and acceptance criteria. Do not duplicate its content into memory or paraphrase from summary; re-read it, because the rules in it (what facts are permitted, which assets may appear where) are strict and violating them is the primary failure mode on this project. Key points worth internalizing up front:

- **Two-phase workflow, hard stop between phases.** Phase 0 = asset inventory (`ASSET-INVENTORY.md`) + story proposal (`STORY-CONCEPT.md`), then **stop and wait for approval** before writing any site code (Phase 1). Do not skip ahead to building.
- **Invent nothing.** Every factual claim (names, stats, client identities) must trace to §2 of the brief or `assets/HamzaWebsite.docx`. No fabricated testimonials, metrics, or turnaround claims.
- **Client work vs. stock is a hard boundary.** Only the seven files listed in brief §2.4 may appear in "Selected Work"; `PixelClip1–6.mp4` and the `pexels-*.jpg` stills are backgrounds/texture only and must never be captioned as client work.
- `Sohail_Varca_Villa_AI.mp4` has an Airbnb logo around 0:29 — that segment must never be used, anywhere.
- Client display names in the brief's table are unconfirmed guesses — use neutral descriptors ("Property Reel", "Podcast Trailer") with a visible TODO, never publish a client name that hasn't been confirmed.

## Reference build

`assets/think-and-make-v4_2.html` is a working single-file reference implementation (~627 lines, embedded `<style>`/`<script>`, some base64-inlined assets). It's the quality bar to beat, not a template to copy verbatim — the brief explicitly asks for a better structure for the pinned scroll story than its current six beats. Its section order (`nav → hero → story (pinned, id="story") → marquee → services → work → team → book`) reflects the target IA described in the brief.

## Target deliverable structure (Phase 1)

```
/
  index.html
  css/site.css
  js/story.js
  js/site.js
  assets/            # derived, web-optimised only (source files stay out)
  ASSET-INVENTORY.md
  STORY-CONCEPT.md
  README.md
```

Web assets must be derived from the raw files in `assets/` via a **committed script** (`tools/build-assets.ps1` or `.py`) — never hand-processed — so it can be re-run when new footage arrives.

## Environment

- **Windows / PowerShell.** All shell commands must be PowerShell-compatible.
- `ffmpeg` and `ffprobe` must be on PATH (verify with `ffmpeg -version`); used for asset probing (Phase 0) and deriving web-optimized media (Phase 1). Always pass `-nostdin` to `ffmpeg` in batch/loop contexts — without it, ffmpeg consumes the loop's stdin and silently corrupts the run.
- Deployment target is Cloudflare Pages (static files only).

## Performance constraints (non-negotiable, learned from the reference build)

These caused visible stutter previously and are treated as hard constraints, not suggestions, for any scroll/animation code:

1. Never drive animation directly from `scrollY` — smooth a value toward the scroll target in a rAF loop (ease factor ~0.13), idle when delta is negligible.
2. Never write layout properties (`width`/`height`/`top`/`left`) inside the scroll loop — animate `transform`/`opacity` only.
3. No `backdrop-filter` on repeated/stacked elements; no `mix-blend-mode` on full-viewport animated layers.
4. Set `visibility:hidden` and skip per-frame work for zero-opacity beats.
5. Pre-blur video in ffmpeg at encode time, never with CSS `filter: blur()`.
6. Pause all off-screen video/animation via `IntersectionObserver`.
7. Use `translate3d` + `will-change: transform` on animated layers only.

Target: sustained 60fps through the pinned scroll sequence at 2560×1440, profiled in DevTools Performance.

## Brand system quick reference

- Palette: `--ink #050810` · `--navy #0D47A1` · `--blue #2196F3` · `--sky #90CAF9` · `--mist #E3F2FD`
- Type: Archivo (display, 800–900) · Instrument Sans (body) · IBM Plex Mono (labels/timecodes) — via Google Fonts, don't substitute Inter.
- Client footage: muted at rest (~42% saturation, ~58% brightness, navy overlay), full colour on hover — never permanently re-grade a client's finished work.
- Full brand/duotone spec is in brief §3.
