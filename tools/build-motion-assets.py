#!/usr/bin/env python3
"""
Derives every client clip and all the motion media for the site.

  Stage 0 (needs source-assets/ with the original raw files — skipped when absent)
    The first seven client pieces from the brief -> assets/video/client/<slug>.mp4
    (includes the Sohail Varca Villa Airbnb excision, 27-32s of the raw file,
    cut with audio kept in sync).

  Stage 1 (needs source-assets/drive-2026-09/ — skipped when absent)
    The second batch of client reels (shared via Google Drive, 2026-09-29)
    -> assets/video/client/<slug>.mp4

  Stage 2 (needs only assets/video/client/)
    Hero showreel loops, pinned-story loops and thumbs, and every poster.

Pipeline order (each script is idempotent, re-run any time):

    source-assets/*             --(tools/build-assets.ps1)-->  assets/video/stock, assets/img/stock, assets/img/brand
    source-assets/*             --(this script, stage 0)-->    assets/video/client/* (first seven)
    source-assets/drive-2026-09 --(this script, stage 1)-->    assets/video/client/* (second batch)
    assets/video/client/*.mp4   --(this script, stage 2)-->    assets/video/hero/*, assets/video/story/*, *-poster.jpg

Stages 0 and 1 only run when their source folder is present, so on a fresh
clone the committed client clips are kept and stage 2 still regenerates the
loops and posters from them. Stage 2 never reads source-assets/, and all of
its cut points are on the *derived* clip timelines, so the Airbnb excision
can never be re-introduced from there.

Audio: KEEP_AUDIO = True keeps the source audio (AAC 128k) in the client
clips, which is what the lightbox plays. Hero and story loops are always
silent (they autoplay). The first seven only get sound when stage 0 runs
with the raw files present.

Hero loops are pre-graded to the brief's "muted at rest" treatment at encode
time instead of a CSS filter on a full-viewport <video> (CLAUDE.md perf
rules). The work-grid / lightbox versions stay true colour: a client's
finished work is never permanently re-graded.

Requires ffmpeg on PATH (or the imageio-ffmpeg pip package as a fallback):

    python tools/build-motion-assets.py
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets"
DRIVE = SRC / "drive-2026-09"
CLIENT = ROOT / "assets" / "video" / "client"
HERO = ROOT / "assets" / "video" / "hero"
STORY = ROOT / "assets" / "video" / "story"

KEEP_AUDIO = True

X264 = ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-movflags", "+faststart"]
AUDIO = ["-c:a", "aac", "-b:a", "128k"] if KEEP_AUDIO else ["-an"]

# Brief 3.4 "muted at rest": ~42% saturation, ~58% brightness. Applied at
# encode time for hero backgrounds only (see module docstring).
MUTED_GRADE = "eq=saturation=0.45:brightness=-0.05:contrast=1.04"

# First seven (brief §2.4). Same widths as the original build-assets.ps1.
#   (raw filename, slug, output width)
ORIGINAL_CLIPS = [
    ("160 old V1 f3.mp4",           "land-plot",           720),
    ("Dubai real 12 f2.mp4",        "dubai-rental-yields", 720),
    ("Dubai Real3 final.mp4",       "dubai-investment",    720),
    ("ED podcast trailer final.mp4", "podcast-trailer-1",  1280),
    ("faisaal pod trailer f2.mp4",  "podcast-trailer-2",   1280),
    ("mens Poadcast F2.mp4",        "podcast-trailer-3",   1280),
]
SOHAIL_RAW = "Sohail Varca Villa AI.mp4"   # Airbnb badge ~28.5-30.5s: cut 27-32 with margin
SOHAIL_CUT = (27.0, 32.0)

# Second batch, as titled on the Drive. Slugs are deliberately neutral (no
# client or presenter names — those stay unconfirmed, see ASSET-INVENTORY.md).
#   (drive title, slug)
SOURCE_CLIPS = [
    ("Hair doctor 27 f3.mp4",  "doctor-formulations"),
    ("Hair doctor 28.mp4",     "doctor-hair-loss"),
    ("hair doctor 31.mp4",     "doctor-vitamins"),
    ("final mithi m'aam.mp4",  "creator-style"),
    ("Mithii 8.mp4",           "creator-jewellery"),
    ("Vivek 2bhk.mp4",         "property-2bhk"),
    ("Tony twin villa.mp4",    "property-twin-villa"),
    ("final.mp4",              "creator-fragrance"),   # client-approved 2026-09-30
]

# Poster frame per client clip, on the derived clip's timeline.
#   slug: (timestamp, output width)
POSTERS = {
    "sohail-villa": (9.0, 720),
    "land-plot": (15.5, 720),
    "dubai-rental-yields": (18.4, 720),
    "dubai-investment": (27.5, 720),
    "podcast-trailer-1": (16.9, 1280),
    "podcast-trailer-2": (19.7, 1280),
    "podcast-trailer-3": (11.2, 1280),
    "doctor-formulations": (36.5, 720),   # main presenter, not the 56s cutaway (name badge)
    "doctor-hair-loss": (8.0, 720),
    "doctor-vitamins": (12.0, 720),
    "creator-style": (3.0, 720),
    "creator-jewellery": (12.0, 720),
    "property-2bhk": (4.0, 720),
    "property-twin-villa": (2.0, 720),
    "creator-fragrance": (6.0, 720),
}


def resolve_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # pragma: no cover
        sys.exit("ffmpeg not found on PATH. Install ffmpeg (winget install ffmpeg) "
                 "or `pip install imageio-ffmpeg`, then re-run.")


FFMPEG = resolve_ffmpeg()


def ff(*args: str) -> None:
    cmd = [FFMPEG, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", *args]
    res = subprocess.run(cmd)
    if res.returncode != 0:
        sys.exit(f"ffmpeg failed ({res.returncode}): {' '.join(cmd)}")


def need(path: Path) -> Path:
    if not path.exists():
        sys.exit(f"Missing input {path}.")
    return path


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9.]+", "-", title.lower().replace("'", "")).strip("-")


def find_source(folder: Path, title: str) -> Path | None:
    """Accepts the file exactly as titled, or a slugified copy of the name."""
    for candidate in (folder / title, folder / slugify(title)):
        if candidate.exists():
            return candidate
    return None


def encode_client(src: Path, out: Path, width: int) -> None:
    print(f"  client {src.name} -> {out.relative_to(ROOT)}")
    ff("-i", str(src), "-vf", f"scale={width}:-2:flags=lanczos", *X264, *AUDIO,
       "-crf", "25", str(out))


def encode_client_excised(src: Path, out: Path, width: int, cut: tuple[float, float]) -> None:
    """Drops cut[0]..cut[1] from the middle of the clip (margin both sides of the
    unwanted frames), video and audio trimmed and concatenated together so they
    stay in sync. Never trim-adjacent: keep the margin."""
    a, b = cut
    print(f"  client {src.name} -> {out.relative_to(ROOT)} (excising {a:.0f}-{b:.0f}s)")
    if KEEP_AUDIO:
        graph = (f"[0:v]trim=0:{a},setpts=PTS-STARTPTS[v0];[0:v]trim={b},setpts=PTS-STARTPTS[v1];"
                 f"[0:a]atrim=0:{a},asetpts=PTS-STARTPTS[a0];[0:a]atrim={b},asetpts=PTS-STARTPTS[a1];"
                 f"[v0][a0][v1][a1]concat=n=2:v=1:a=1[vc][ac];"
                 f"[vc]scale={width}:-2:flags=lanczos[outv]")
        ff("-i", str(src), "-filter_complex", graph, "-map", "[outv]", "-map", "[ac]",
           *X264, *AUDIO, "-crf", "25", str(out))
    else:
        graph = (f"[0:v]trim=0:{a},setpts=PTS-STARTPTS[v0];[0:v]trim={b},setpts=PTS-STARTPTS[v1];"
                 f"[v0][v1]concat=n=2:v=1:a=0,scale={width}:-2:flags=lanczos[outv]")
        ff("-i", str(src), "-filter_complex", graph, "-map", "[outv]",
           *X264, "-an", "-crf", "25", str(out))


def loop(src: str, out: Path, start: float, dur: float, width: int, crf: int,
         grade: str | None = None) -> None:
    vf = f"scale={width}:-2:flags=lanczos"
    if grade:
        vf = f"{grade},{vf}"
    print(f"  loop   {src} [{start:>5.1f}s +{dur:.0f}s] -> {out.relative_to(ROOT)}")
    ff("-ss", str(start), "-t", str(dur), "-i", str(need(CLIENT / src)),
       "-vf", vf, *X264, "-an", "-crf", str(crf), str(out))


def poster(src_path: Path, out: Path, at: float, width: int, q: int = 5) -> None:
    print(f"  poster {src_path.name} @{at:.1f}s -> {out.relative_to(ROOT)}")
    ff("-ss", str(at), "-i", str(need(src_path)), "-frames:v", "1",
       "-vf", f"scale={width}:-2:flags=lanczos", "-q:v", str(q), str(out))


def stage0_original_clips() -> None:
    print("Stage 0: first seven client clips (source-assets/)")
    if not any(find_source(SRC, t) for t, _, _ in ORIGINAL_CLIPS) and not find_source(SRC, SOHAIL_RAW):
        print("  raw files not present — skipping (assets/video/client keeps its committed files)")
        return
    for title, slug, width in ORIGINAL_CLIPS:
        src = find_source(SRC, title)
        if src is None:
            print(f"  ! {title!r} not found in source-assets/ — skipped")
            continue
        encode_client(src, CLIENT / f"{slug}.mp4", width)
    src = find_source(SRC, SOHAIL_RAW)
    if src is None:
        print(f"  ! {SOHAIL_RAW!r} not found in source-assets/ — skipped")
    else:
        encode_client_excised(src, CLIENT / "sohail-villa.mp4", 720, SOHAIL_CUT)


def stage1_source_clips() -> None:
    print("Stage 1: second-batch client reels (source-assets/drive-2026-09)")
    if not DRIVE.exists():
        print("  source folder not present — skipping (assets/video/client keeps its committed files)")
        return
    for title, slug in SOURCE_CLIPS:
        src = find_source(DRIVE, title)
        if src is None:
            print(f"  ! {title!r} not found in {DRIVE.relative_to(ROOT)} — skipped")
            continue
        # All eight are 9:16 (one is 2160x3840): 720 wide, same ladder as the first seven.
        encode_client(src, CLIENT / f"{slug}.mp4", 720)


def stage2_motion() -> None:
    print("Stage 2: hero showreel loops (pre-graded, 8s each)")
    # Landscape set: full-bleed on landscape viewports.
    loop("podcast-trailer-2.mp4", HERO / "reel-l1.mp4", 15.0, 8, 1280, 27, MUTED_GRADE)
    loop("podcast-trailer-1.mp4", HERO / "reel-l2.mp4", 15.0, 8, 1280, 27, MUTED_GRADE)
    loop("podcast-trailer-3.mp4", HERO / "reel-l3.mp4", 0.3, 8, 1280, 27, MUTED_GRADE)
    # Portrait set: swapped in on portrait (phone) viewports so nothing is
    # centre-cropped. Mixes property, creator and doctor content on purpose.
    loop("sohail-villa.mp4", HERO / "reel-p1.mp4", 3.0, 8, 720, 28, MUTED_GRADE)
    loop("creator-jewellery.mp4", HERO / "reel-p2.mp4", 0.0, 8, 720, 28, MUTED_GRADE)
    loop("doctor-vitamins.mp4", HERO / "reel-p3.mp4", 10.0, 8, 720, 28, MUTED_GRADE)
    for name in ("reel-l1", "reel-l2", "reel-l3", "reel-p1", "reel-p2", "reel-p3"):
        poster(HERO / f"{name}.mp4", HERO / f"{name}-poster.jpg", 0.0, 960 if "-l" in name else 540, 6)

    print("Stage 2: pinned story clips (true colour)")
    loop("dubai-rental-yields.mp4", STORY / "edit-reel.mp4", 12.0, 12, 720, 26)
    loop("podcast-trailer-2.mp4", STORY / "retention-reel.mp4", 15.0, 12, 1280, 27)
    poster(STORY / "edit-reel.mp4", STORY / "edit-reel-poster.jpg", 0.0, 720)
    poster(STORY / "retention-reel.mp4", STORY / "retention-reel-poster.jpg", 0.0, 1280)
    # Small "dailies" cards for beats 01/02/05. sohail-loop sits at 27-36s of
    # the derived clip, i.e. after the excised window (raw 32-41s).
    loop("sohail-villa.mp4", STORY / "sohail-loop.mp4", 27.0, 9, 400, 30)
    poster(STORY / "sohail-loop.mp4", STORY / "sohail-loop-poster.jpg", 4.0, 480, 6)
    loop("podcast-trailer-1.mp4", STORY / "podcast-trailer-1-thumb.mp4", 10.0, 8, 400, 30)
    loop("podcast-trailer-3.mp4", STORY / "podcast-trailer-3-thumb.mp4", 8.0, 8, 400, 30)
    loop("land-plot.mp4", STORY / "land-plot-thumb.mp4", 40.0, 8, 400, 30)

    print("Stage 2: work-grid posters")
    for slug, (at, width) in POSTERS.items():
        poster(CLIENT / f"{slug}.mp4", CLIENT / f"{slug}-poster.jpg", at, width)


def main() -> None:
    for d in (CLIENT, HERO, STORY):
        d.mkdir(parents=True, exist_ok=True)
    stage0_original_clips()
    stage1_source_clips()
    stage2_motion()
    print("Done.")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
