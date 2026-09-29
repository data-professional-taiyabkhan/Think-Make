#!/usr/bin/env python3
"""
Derives the motion-site media that build-assets.ps1 does not cover:

  Stage 1 (needs source-assets/drive-2026-09/ — skipped when absent)
    The second batch of client reels (shared via Google Drive, 2026-09-29)
    -> assets/video/client/<slug>.mp4 + <slug>-poster.jpg

  Stage 2 (needs only assets/video/client/)
    Hero showreel loops, pinned-story loops and larger work-grid posters.

Pipeline order (every script is idempotent, re-run any time):

    source-assets/*             --(tools/build-assets.ps1)-->  assets/video/client/* (first seven pieces)
    source-assets/drive-2026-09 --(this script, stage 1)-->    assets/video/client/* (second batch)
    assets/video/client/*.mp4   --(this script, stage 2)-->    assets/video/hero/*, assets/video/story/*, posters

Every stage-2 cut point is expressed on the *derived* client clip's timeline,
so the Sohail Varca Villa Airbnb excision (27-32s of the raw file, removed by
build-assets.ps1) can never be re-introduced from here.

Hero loops are pre-graded to the brief's "muted at rest" treatment at encode
time instead of a CSS filter on a full-viewport <video> (CLAUDE.md perf
rules). The work-grid / lightbox versions stay true colour: a client's
finished work is never permanently re-graded.

Audio: KEEP_AUDIO below is False so the second batch matches the first seven
(build-assets.ps1 encodes with -an). Flip it to True and re-run to give the
lightbox sound for the second batch; for the first seven, remove '-an' from
Convert-ClientClip in build-assets.ps1 and re-run that too.

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
CLIENT = ROOT / "assets" / "video" / "client"
HERO = ROOT / "assets" / "video" / "hero"
STORY = ROOT / "assets" / "video" / "story"
DRIVE = ROOT / "source-assets" / "drive-2026-09"

KEEP_AUDIO = False

X264 = ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-movflags", "+faststart"]
AUDIO = ["-c:a", "aac", "-b:a", "96k"] if KEEP_AUDIO else ["-an"]

# Brief 3.4 "muted at rest": ~42% saturation, ~58% brightness. Applied at
# encode time for hero backgrounds only (see module docstring).
MUTED_GRADE = "eq=saturation=0.45:brightness=-0.05:contrast=1.04"

# Second batch, as titled on the Drive. Slugs are deliberately neutral (no
# client or presenter names — those stay unconfirmed, see ASSET-INVENTORY.md).
#   (drive title, slug, poster timestamp)
SOURCE_CLIPS = [
    ("Hair doctor 27 f3.mp4",  "doctor-formulations", 36.5),  # main presenter, not the 56s cutaway (name badge)
    ("Hair doctor 28.mp4",     "doctor-hair-loss",    8.0),
    ("hair doctor 31.mp4",     "doctor-vitamins",     12.0),
    ("final mithi m'aam.mp4",  "creator-style",       3.0),
    ("Mithii 8.mp4",           "creator-jewellery",   12.0),
    ("Vivek 2bhk.mp4",         "property-2bhk",       4.0),
    ("Tony twin villa.mp4",    "property-twin-villa", 2.0),
    # "final.mp4" (fragrance review) is intentionally not derived: it shows
    # third-party product branding throughout. Add a row here if the client
    # confirms it is fine to publish.
]


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
        sys.exit(f"Missing input {path}. Run tools/build-assets.ps1 first.")
    return path


def slugify(title: str) -> str:
    return re.sub(r"[^a-z0-9.]+", "-", title.lower().replace("'", "")).strip("-")


def find_source(title: str) -> Path | None:
    """Accepts the file exactly as titled on the Drive, or a slugified copy."""
    for candidate in (DRIVE / title, DRIVE / slugify(title)):
        if candidate.exists():
            return candidate
    return None


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


def stage1_source_clips() -> None:
    print("Stage 1: second-batch client reels (source-assets/drive-2026-09)")
    if not DRIVE.exists():
        print("  source folder not present — skipping (assets/video/client keeps its committed files)")
        return
    for title, slug, poster_at in SOURCE_CLIPS:
        src = find_source(title)
        if src is None:
            print(f"  ! {title!r} not found in {DRIVE.relative_to(ROOT)} — skipped")
            continue
        out = CLIENT / f"{slug}.mp4"
        print(f"  client {src.name} -> {out.relative_to(ROOT)}")
        # All eight are 9:16 (one is 2160x3840): 720 wide, same ladder as the first seven.
        ff("-i", str(src), "-vf", "scale=720:-2:flags=lanczos", *X264, *AUDIO,
           "-crf", "25", str(out))
        poster(out, CLIENT / f"{slug}-poster.jpg", poster_at, 720)


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

    print("Stage 2: pinned story EDIT and RETENTION beat clips (true colour)")
    loop("dubai-rental-yields.mp4", STORY / "edit-reel.mp4", 12.0, 12, 720, 26)
    loop("podcast-trailer-2.mp4", STORY / "retention-reel.mp4", 15.0, 12, 1280, 27)
    poster(STORY / "edit-reel.mp4", STORY / "edit-reel-poster.jpg", 0.0, 720)
    poster(STORY / "retention-reel.mp4", STORY / "retention-reel-poster.jpg", 0.0, 1280)

    print("Stage 2: work-grid posters for the first seven (re-cut on stronger frames)")
    posters = {
        # slug: (timestamp on the derived clip, output width)
        "sohail-villa": (9.0, 720),
        "land-plot": (15.5, 720),
        "dubai-rental-yields": (18.4, 720),
        "dubai-investment": (27.5, 720),
        "podcast-trailer-1": (16.9, 1280),
        "podcast-trailer-2": (19.7, 1280),
        "podcast-trailer-3": (11.2, 1280),
    }
    for slug, (at, width) in posters.items():
        poster(CLIENT / f"{slug}.mp4", CLIENT / f"{slug}-poster.jpg", at, width)


def main() -> None:
    for d in (CLIENT, HERO, STORY):
        d.mkdir(parents=True, exist_ok=True)
    stage1_source_clips()
    stage2_motion()
    print("Done.")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
