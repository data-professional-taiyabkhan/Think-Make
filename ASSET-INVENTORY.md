# Asset Inventory — Think & Make site

Compiled by probing every video with `ffprobe`, extracting and visually reviewing 4–8 sample frames per clip (dense 1s-step sampling around the Airbnb-logo window in the Sohail villa clip), reading every still/brand image directly, and extracting the raw text of `HamzaWebsite.docx`. Durations are `ffprobe`-measured, not filename guesses.

## Client work (may appear in "Selected Work")

| File | Resolution | Orientation | Duration | What's actually in it | Placement notes |
|---|---|---|---|---|---|
| `160 old V1 f3.mp4` | 1080×1920 | 9:16 | 1:02 | A man in a black shirt walks/presents through a heritage colonial-style house (courtyard, arched doorway, wood-beamed interior room), then a drone shot of a land plot with a "3,200 sqm" overlay, then more garden walk-through. | A real phone number (`+91 7058582687`) is burned into the footage at 24.8s, 34.1s, and 52.7s. **Client confirmed fine with it (2026-08-07)** — cleared for Selected Work as-is, no crop/mask needed. |
| `Dubai real 12 f2.mp4` | 1080×1920 | 9:16 | 0:29 | "Then/Now"-style Dubai rental-yield explainer: motion-graphic title cards ("Top locations: JVC, Business Bay") intercut with a talking-head presenter in an office, Burj Khalifa skyline behind him, discussing rental demand. | Clean. Good Selected Work candidate. |
| `Dubai Real3 final.mp4` | 1080×1920 | 9:16 | 0:32 | Kinetic-typography motion-graphics explainer ("WOW what a return", "Luxury does not guarantee profit" over 3D building/armchair illustrations) intercut with the same presenter as above, different office/suit. | Clean. Good Selected Work candidate. |
| `ED podcast trailer final.mp4` | 1920×1080 | 16:9 | 1:08 | Podcast interview, single guest at a mic, bold black kinetic captions in Hinglish ("JUST SHOW UP", "Paper ETHICS mein he chuth ta hai"), warm plant-filled studio set. | Clean. |
| `faisaal pod trailer f2.mp4` | 1920×1080 | 16:9 | 1:19 | Two-host podcast: one shot has a male host + female guest together, another has a different male host solo. Red-highlighted Hinglish captions ("Wo REJECT ho jaate hain", "usme AI ka kitna bada role hai"). | Clean. |
| `mens Poadcast F2.mp4` | 1920×1080 | 16:9 | 0:45 | Podcast studio with a striped acoustic-panel backdrop, teal/cyan captions; at least two different older male guests appear across the clip. | Clean. |
| `Sohail Varca Villa AI.mp4` | 1080×1920 | 9:16 | 0:45 | AI-generated/stylized investment-pitch reel for a villa in Varca, South Goa: satellite zoom to a "Varca beach" location tag → nearby-amenities photo cards ("Eastern Supermarket", "Nick's Cafe", "Apollo Pharmacy") captioned "all right there / Supermarkets Restaurants Hospitals" → 3D-rendered villa exterior + pool with an **Airbnb badge overlay** → interior bedroom render captioned "so while you are not here" → more exterior renders captioned "Whether you want to Live here". | **The Airbnb-branded segment is confirmed at ~28.5s–30.5s** (dense-sampled frame-by-frame; matches the brief's "around 0:29" estimate). That window must be cut entirely from any derived clip — never trim-adjacent, cut around it with margin. |

## Client work — second batch (Google Drive, 2026-09-29)

Shared by the owner as a Drive folder; Hamza confirmed each client's permission to showcase. Probed with `ffmpeg -i` and reviewed on 32-frame contact sheets. **All eight are 9:16 portrait with audio.** Derived by `tools/build-motion-assets.py` stage 1 (audio stripped to match the first seven; see the script header to change that). Raw files live in `source-assets/drive-2026-09/` (gitignored); the script accepts either the Drive title or its slugified filename.

| Drive title | Derived slug | Res / fps | Duration | What's actually in it | Placement notes |
|---|---|---|---|---|---|
| `Hair doctor 27 f3.mp4` | `doctor-formulations` | 1080×1920 25fps | 1:38 | Doctor talking head in a clinic with kinetic captions and cut-in motion graphics (formulations, "Health care", commission illustrations). The doctor's own clinic signage and prescription pad appear briefly. | Short form 01. Longest reel in the set. |
| `Hair doctor 28.mp4` | `doctor-hair-loss` | 1080×1920 25fps | 0:39 | Hair-loss explainer with medical illustrations, ends on a "Comment GUIDE" card. | Short form 07. Clean. |
| `hair doctor 31.mp4` | `doctor-vitamins` | 1080×1920 25fps | 0:58 | Vitamin-deficiency explainer, strong motion graphics (DEFICIENCY, Vitamin D / Zn / E), ends on captions + "FOLLOW". | Short form 05. Also the third mobile hero loop (10–18s). |
| `final mithi m'aam.mp4` | `creator-style` | 1080×1920 30fps | 1:05 | Fashion creator talking head, bright kinetic captions, a couple of collage cut-ins. | Short form 02. Clean. |
| `Mithii 8.mp4` | `creator-jewellery` | 1080×1920 30fps | 0:41 | Jewellery pieces (pendant, ear cuffs, neckpiece) with product close-ups, ends on "Comment your favorite". | Short form 04. Also the second mobile hero loop (0–8s). |
| `Vivek 2bhk.mp4` | `property-2bhk` | 2160×3840 30fps | 0:38 | 2BHK apartment walkthrough in Davorlim, on-screen price (₹63 Lakh), satellite map, "Comment Flat" end card. No phone number seen. | Short form 03. 4K source, scaled to 720 like the rest. |
| `Tony twin villa.mp4` | `property-twin-villa` | 1080×1920 30fps | 0:37 | Twin-villa 3BHK drone + walkthrough, satellite map, "Comment Villa" end card. **A phone number with call icons is burned in on the last ~4s** (the agent's own contact, same pattern as the Varca villa clip). | Short form 09. Confirm with the client, as for the Varca villa end card. |
| `final.mp4` | — | 1080×1920 30fps | 0:43 | Fragrance review: third-party product names and bottle imagery on screen throughout. | **Not derived, not placed.** Add a row to `SOURCE_CLIPS` in the script if the client confirms it is fine to publish. |

Selection on the site: the Short form column shows the seven derived reels above plus three of the original portrait pieces (`dubai-rental-yields`, `sohail-villa`, `land-plot`). `dubai-investment` stays derived and in the story fallback but is off the grid for variety (same presenter as `dubai-rental-yields`).

## Stock B-roll (backgrounds/textures ONLY — never captioned as work)

| File | Resolution | Orientation | Duration | What's actually in it |
|---|---|---|---|---|
| `PixelClip1.mp4` | 3840×2160 (4K) | 16:9 | 0:17 | Close-up on an editing timeline/waveform, pastel purple-blue NLE UI. |
| `PixelClip2.mp4` | 2160×3840 (4K) | 9:16 | 0:06 | Silhouetted editor at a mixing desk in a dark room, red/blue mood lighting, glowing controller. |
| `PixelClip3.mp4` | 3840×2160 (4K) | 16:9 | 0:07 | Dual-monitor edit bay, colorful timeline tracks, keyboard/mouse in foreground, shallow DOF. |
| `PixelClip4.mp4` | 1920×1080 | 16:9 | 0:17 | Shot at 100fps (slow-motion capable). Editor at a dark desk beside a small fairy-lit decorative tree, moody blue-black lighting. |
| `PixelClip5.mp4` | 3840×2160 (4K) | 16:9 | 0:16 | Thumbnail/media-browser grid on a monitor, warm foreground light. **Note:** `ffprobe` reports two identical video streams in this file (same res/fps/duration both times) — sanity-check it with a single-stream `-map 0:v:0` before it goes through the derive-assets pipeline. |
| `PixelClip6.mp4` | 2160×3840 (4K) | 9:16 | 0:19 | Dual-monitor close-up, colorful timeline/audio tracks, studio monitor speakers flanking the screens, dark blue-lit room. |
| `pexels-amar-11025645.jpg` | 5568×3712 | landscape | — | B&W photo: laptop + external monitor running Premiere Pro (Spanish UI) with a color-correction panel open, headphones/mouse in frame. |
| `pexels-cottonbro-6892701.jpg` | 4159×6238 | portrait | — | Warm-lit editor at a desk, shot from behind, cyan DAW waveform on the monitor, desk lamp glowing. |
| `pexels-jakubzerdzicki-30229850.jpg` | 3000×2001 | landscape | — | Shallow-DOF close-up on color-grading wheels (DaVinci-style panel), mechanical keyboard blurred in the foreground. |
| `pexels-ron-lach-8102674.jpg` | 4042×6063 | portrait | — | Near-black room; editor's hands on a keyboard in foreground shadow; a bright grading monitor with color wheels/histogram glows in the dark. Strongest match for the brief's radial-spotlight-on-near-black section-plate treatment. |

## Brand

| File | Resolution | What's actually in it | Placement notes |
|---|---|---|---|
| `LOGOHamza.png` | square | "TM" ribbon-fold monogram — navy + light-blue ribbon on a cream (~`#FDF8F4`) background. Matches the locked palette exactly. | Nav/footer mark. Needs flood-fill background removal per brief §2.6. |

## Team portraits

| File | What's actually in it | Placement notes |
|---|---|---|
| `Hamza.jpeg` | Outdoor full-body casual phone snap, green foliage backdrop, daylight with a slight green colour cast, subject relatively small in frame. | Team section. Needs crop-normalize (largest re-scale of the three, since it's a full-body shot) + duotone grade. |
| `Sneha.jpeg` | Indoor café shot, waist-up and noticeably tighter-framed than the other two, warm mixed lighting, sunglasses indoors. | Team section. Biggest crop-normalize job — needs to be pulled back / re-framed to match head-to-frame ratio of the other two. |
| `Rahul.jpeg` | Outdoor headshot-style portrait, palm-frond backdrop, neutral daylight. | Team section. Closest to a "standard" reference framing of the three; the other two should probably normalize toward this one. |

## Documents (source material, not deployable assets)

| File | Role |
|---|---|
| `HamzaWebsite.docx` | Ground-truth marketing copy: hero subheading, "What We Do" service descriptions, section CTA copy, "Why Choose" cards, full team bios, process step labels, and **company social handles** (see Phase 0 report). Extracted in full and cross-checked against the brief — one direct conflict found (see report). |
| `source-assets/claudecode.md` | The project brief. Not a deployable asset. |
| `source-assets/think-and-make-v4_2.html` | Reference build. Not a deployable asset. |

## Black-frame check

Spot-checked luminance visually across all extracted sample frames while reviewing them (step 2/3 of Phase 0) — no black/dead frames were selected into the sample set; all extracted frames show real content at every sampled timestamp.

## Phase 0 report — open items raised per brief §10, resolved 2026-08-07

1. **Real client names** for the 7 work pieces — not provided. **Decision: neutral descriptors + visible TODO markers** ("Property Reel", "Podcast Trailer", etc.) per the brief's explicit fallback instruction. No client name may be published.
2. **Booking URL** — not provided. Phase 1 ships a visible TODO placeholder for the booking CTA target.
3. **Contact email, YouTube handle, domain** — not provided (LinkedIn/Instagram/Twitter *are* in `HamzaWebsite.docx`: `linkedin.com/in/thinkandmake-agency-050558420`, `instagram.com/thinkandmakeofficial`, `x.com/Athinkandmake`). Phase 1 uses the three confirmed handles and TODOs the rest.
4. **Three testimonials** — not provided anywhere in source material. Phase 1 ships the Testimonials section structurally with visible TODO placeholders, no fabricated quotes.
5. **Sneha's stat** — resolved by the brief itself (§2.1: "none" permitted). No TODO needed; her card intentionally has no stat.
6. **Additional assets needed** — none identified beyond what's in `source-assets/`.

## Repo layout note (2026-08-07)
Raw source material (footage, docx, brief, reference build) moved from `assets/` to `source-assets/` at the start of Phase 1, so the deployed `assets/` folder can hold derived, web-optimized output only, per `CLAUDE.md`'s target structure. `tools/build-assets.ps1` reads from `source-assets/` and writes to `assets/`.
7. **Conflict found:** `HamzaWebsite.docx`'s "Why Choose" card reads "Unlimited Revisions"; brief §2.7 explicitly bans that claim and states the real policy as "two rounds included, extras quoted upfront." **Decision (2026-08-07): use "Unlimited Revisions"** — client overrode the brief's banned-claims list directly.
8. **Phone-number overlay on `160 old V1 f3.mp4`** — see placement note above. **Decision: client confirmed fine, cleared for use as-is.**
