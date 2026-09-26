#!/usr/bin/env python3
"""
Derives the motion-site media (hero showreel loops, pinned-story loops and
large work-grid posters) from the already web-optimised client clips in
assets/video/client/.

Pipeline order (both scripts are idempotent, re-run any time):

    source-assets/*   --(tools/build-assets.ps1)-->   assets/video/client/*.mp4
    assets/video/client/*.mp4   --(this script)-->    assets/video/hero/*
                                                     assets/video/story/*-edit / *-retention
                                                     assets/video/client/*-poster.jpg (re-cut, larger)

Every cut point below is expressed on the *derived* client clip's timeline, so
the Sohail Varca Villa Airbnb excision (27-32s of the raw file, already removed
by build-assets.ps1) can never be re-introduced from here: this script never
touches source-assets/.

Hero loops are pre-graded to the brief's "muted at rest" treatment
(saturation ~0.45, slightly darker) at encode time instead of a CSS filter on
a full-viewport <video>, per the performance rules in CLAUDE.md. The colour
scrim on top is a static CSS gradient. The work-grid and lightbox versions of
the same clips (assets/video/client/*.mp4) stay true-colour: a client's
finished work is never permanently re-graded.

Requires ffmpeg on PATH (or the imageio-ffmpeg pip package as a fallback).
Runs on Windows/PowerShell, macOS and Linux:

    python tools/build-motion-assets.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "assets" / "video" / "client"
HERO = ROOT / "assets" / "video" / "hero"
STORY = ROOT / "assets" / "video" / "story"

X264 = ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-movflags", "+faststart", "-an"]

# Brief 3.4 "muted at rest": ~42% saturation, ~58% brightness. Applied at
# encode time for hero backgrounds only (see module docstring).
MUTED_GRADE = "eq=saturation=0.45:brightness=-0.05:contrast=1.04"


def resolve_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # pragma: no cover - only hit when nothing is installed
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


def loop(src: str, out: Path, start: float, dur: float, width: int, crf: int,
         grade: str | None = None) -> None:
    vf = f"scale={width}:-2:flags=lanczos"
    if grade:
        vf = f"{grade},{vf}"
    print(f"  loop   {src} [{start:>5.1f}s +{dur:.0f}s] -> {out.relative_to(ROOT)}")
    ff("-ss", str(start), "-t", str(dur), "-i", str(need(CLIENT / src)),
       "-vf", vf, *X264, "-crf", str(crf), str(out))


def poster(src_path: Path, out: Path, at: float, width: int, q: int = 5) -> None:
    print(f"  poster {src_path.name} @{at:.1f}s -> {out.relative_to(ROOT)}")
    ff("-ss", str(at), "-i", str(need(src_path)), "-frames:v", "1",
       "-vf", f"scale={width}:-2:flags=lanczos", "-q:v", str(q), str(out))


def main() -> None:
    for d in (HERO, STORY):
        d.mkdir(parents=True, exist_ok=True)

    print("Hero showreel loops (pre-graded, 8s each)")
    # Landscape set: full-bleed on landscape viewports.
    loop("podcast-trailer-2.mp4", HERO / "reel-l1.mp4", 15.0, 8, 1280, 27, MUTED_GRADE)
    loop("podcast-trailer-1.mp4", HERO / "reel-l2.mp4", 15.0, 8, 1280, 27, MUTED_GRADE)
    loop("podcast-trailer-3.mp4", HERO / "reel-l3.mp4", 0.3, 8, 1280, 27, MUTED_GRADE)
    # Portrait set: swapped in on portrait (phone) viewports so nothing is
    # centre-cropped into mush.
    loop("sohail-villa.mp4", HERO / "reel-p1.mp4", 3.0, 8, 720, 28, MUTED_GRADE)
    loop("dubai-investment.mp4", HERO / "reel-p2.mp4", 21.0, 8, 720, 28, MUTED_GRADE)
    loop("land-plot.mp4", HERO / "reel-p3.mp4", 9.0, 8, 720, 28, MUTED_GRADE)
    for name in ("reel-l1", "reel-l2", "reel-l3", "reel-p1", "reel-p2", "reel-p3"):
        poster(HERO / f"{name}.mp4", HERO / f"{name}-poster.jpg", 0.0, 960 if "-l" in name else 540, 6)

    print("Pinned story: EDIT and RETENTION beat clips (true colour)")
    loop("dubai-rental-yields.mp4", STORY / "edit-reel.mp4", 12.0, 12, 720, 26)
    loop("podcast-trailer-2.mp4", STORY / "retention-reel.mp4", 15.0, 12, 1280, 27)
    poster(STORY / "edit-reel.mp4", STORY / "edit-reel-poster.jpg", 0.0, 720)
    poster(STORY / "retention-reel.mp4", STORY / "retention-reel-poster.jpg", 0.0, 1280)

    print("Work-grid posters (larger, re-cut on stronger frames)")
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

    print("Done.")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
