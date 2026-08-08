<#
Derives all web-optimised assets/ from the raw files in source-assets/.
Re-run any time source-assets/ changes. Never hand-process output files.
Requires ffmpeg + ffprobe on PATH (falls back to the known WinGet Links
install location on this machine if the bare command isn't resolvable).
#>

$ErrorActionPreference = 'Stop'

$Root       = Split-Path -Parent $PSScriptRoot
$Src        = Join-Path $Root 'source-assets'
$Out        = Join-Path $Root 'assets'
$ProbeDir   = Join-Path $Root 'probe'

# ---------------------------------------------------------------------------
# ffmpeg/ffprobe resolution
# ---------------------------------------------------------------------------
function Resolve-Tool([string]$Name) {
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $fallback = "C:\Users\mohdt\AppData\Local\Microsoft\WinGet\Links\$Name.exe"
    if (Test-Path $fallback) {
        $env:Path = (Split-Path $fallback) + ';' + $env:Path
        return $fallback
    }
    throw "$Name not found on PATH and no known fallback exists. Install ffmpeg and verify with '$Name -version' before re-running."
}
$FFMPEG  = Resolve-Tool 'ffmpeg'
$FFPROBE = Resolve-Tool 'ffprobe'
Write-Host "Using ffmpeg: $FFMPEG" -ForegroundColor DarkGray

function Invoke-FF([string[]]$FFArgs) {
    & $FFMPEG -nostdin -hide_banner -loglevel error -y @FFArgs
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed (exit $LASTEXITCODE): $($FFArgs -join ' ')" }
}

function Ensure-Dir([string]$Path) {
    if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }
}

# ---------------------------------------------------------------------------
# Output layout
# ---------------------------------------------------------------------------
$VideoClient = Join-Path $Out 'video\client'
$VideoStory  = Join-Path $Out 'video\story'
$VideoStock  = Join-Path $Out 'video\stock'
$ImgStock    = Join-Path $Out 'img\stock'
$ImgTeam     = Join-Path $Out 'img\team'
$ImgBrand    = Join-Path $Out 'img\brand'
foreach ($d in @($VideoClient, $VideoStory, $VideoStock, $ImgStock, $ImgTeam, $ImgBrand)) { Ensure-Dir $d }

# ---------------------------------------------------------------------------
# Client work clips -> assets/video/client/<slug>.mp4 + <slug>-poster.jpg
# Muted (site controls audio via the <video> element itself on hover/tap),
# H.264 + faststart, capped resolution. Source stays true-colour; the
# "muted at rest" look is CSS presentation chrome per brief 3.4, never baked in.
# ---------------------------------------------------------------------------
function Convert-ClientClip {
    param(
        [string]$SourceFile,
        [string]$Slug,
        [int]$Width,
        [double]$PosterAt
    )
    $inPath  = Join-Path $Src $SourceFile
    if (-not (Test-Path $inPath)) { throw "Missing source file: $inPath" }
    $outVideo  = Join-Path $VideoClient "$Slug.mp4"
    $outPoster = Join-Path $VideoClient "$Slug-poster.jpg"

    Write-Host "client: $SourceFile -> $Slug.mp4" -ForegroundColor Cyan
    Invoke-FF @(
        '-i', $inPath,
        '-an',
        '-vf', "scale=$($Width):-2:flags=lanczos",
        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', '25', '-preset', 'slow', '-movflags', '+faststart',
        $outVideo
    )
    Invoke-FF @(
        '-ss', "$PosterAt", '-i', $inPath, '-frames:v', '1',
        '-vf', 'scale=480:-2:flags=lanczos', '-q:v', '6',
        $outPoster
    )
}

Convert-ClientClip -SourceFile '160 old V1 f3.mp4'        -Slug 'land-plot'            -Width 720  -PosterAt 15.5
Convert-ClientClip -SourceFile 'Dubai real 12 f2.mp4'      -Slug 'dubai-rental-yields'  -Width 720  -PosterAt 11.5
Convert-ClientClip -SourceFile 'Dubai Real3 final.mp4'     -Slug 'dubai-investment'     -Width 720  -PosterAt 12.9
Convert-ClientClip -SourceFile 'ED podcast trailer final.mp4' -Slug 'podcast-trailer-1' -Width 1280 -PosterAt 16.9
Convert-ClientClip -SourceFile 'faisaal pod trailer f2.mp4'   -Slug 'podcast-trailer-2' -Width 1280 -PosterAt 19.7
Convert-ClientClip -SourceFile 'mens Poadcast F2.mp4'         -Slug 'podcast-trailer-3' -Width 1280 -PosterAt 11.2

# ---------------------------------------------------------------------------
# Sohail Varca Villa AI.mp4 — the Airbnb badge is confirmed at ~28.5-30.5s.
# Grid/full version: cut 27s-32s out entirely (margin either side), never
# trim-adjacent. Story-loop version: a short segment already outside that
# window, no cut needed.
# ---------------------------------------------------------------------------
$sohailIn = Join-Path $Src 'Sohail Varca Villa AI.mp4'
if (-not (Test-Path $sohailIn)) { throw "Missing source file: $sohailIn" }

Write-Host 'client: Sohail Varca Villa AI.mp4 -> sohail-villa.mp4 (Airbnb window excised)' -ForegroundColor Cyan
Invoke-FF @(
    '-i', $sohailIn,
    '-an',
    '-filter_complex', "[0:v]trim=0:27,setpts=PTS-STARTPTS[a];[0:v]trim=32,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,scale=720:-2:flags=lanczos[outv]",
    '-map', '[outv]',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '25', '-preset', 'slow', '-movflags', '+faststart',
    (Join-Path $VideoClient 'sohail-villa.mp4')
)
Invoke-FF @(
    '-ss', '18', '-i', $sohailIn, '-frames:v', '1',
    '-vf', 'scale=480:-2:flags=lanczos', '-q:v', '6',
    (Join-Path $VideoClient 'sohail-villa-poster.jpg')
)

Write-Host 'story: Sohail Varca Villa AI.mp4 -> sohail-loop.mp4 (31-40s, outside Airbnb window)' -ForegroundColor Cyan
Invoke-FF @(
    '-ss', '31', '-t', '9', '-i', $sohailIn,
    '-an',
    '-vf', 'scale=720:-2:flags=lanczos',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '25', '-preset', 'slow', '-movflags', '+faststart',
    (Join-Path $VideoStory 'sohail-loop.mp4')
)
Invoke-FF @(
    '-ss', '35', '-i', $sohailIn, '-frames:v', '1',
    '-vf', 'scale=480:-2:flags=lanczos', '-q:v', '6',
    (Join-Path $VideoStory 'sohail-loop-poster.jpg')
)

# ---------------------------------------------------------------------------
# Stock B-roll (PixelClip1-6) -> assets/video/stock/pixelclipN.mp4
# Background/texture only. PixelClip5 reports two identical video streams
# per Phase 0 findings -- map the first explicitly.
# ---------------------------------------------------------------------------
function Convert-StockClip {
    param([string]$SourceFile, [string]$Slug, [int]$Width, [switch]$ExplicitMap)
    $inPath = Join-Path $Src $SourceFile
    if (-not (Test-Path $inPath)) { throw "Missing source file: $inPath" }
    $outVideo = Join-Path $VideoStock "$Slug.mp4"
    Write-Host "stock: $SourceFile -> $Slug.mp4" -ForegroundColor DarkCyan
    $ffArgs = @('-i', $inPath)
    if ($ExplicitMap) { $ffArgs += @('-map', '0:v:0') }
    $ffArgs += @(
        '-an',
        '-vf', "scale=$($Width):-2:flags=lanczos",
        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', '28', '-preset', 'slow', '-movflags', '+faststart',
        $outVideo
    )
    Invoke-FF $ffArgs
}

Convert-StockClip -SourceFile 'PixelClip1.mp4' -Slug 'pixelclip1' -Width 800
Convert-StockClip -SourceFile 'PixelClip2.mp4' -Slug 'pixelclip2' -Width 450
Convert-StockClip -SourceFile 'PixelClip3.mp4' -Slug 'pixelclip3' -Width 800
Convert-StockClip -SourceFile 'PixelClip4.mp4' -Slug 'pixelclip4' -Width 800
Convert-StockClip -SourceFile 'PixelClip5.mp4' -Slug 'pixelclip5' -Width 800 -ExplicitMap
Convert-StockClip -SourceFile 'PixelClip6.mp4' -Slug 'pixelclip6' -Width 450

# ---------------------------------------------------------------------------
# Stock stills (pexels-*) -> assets/img/stock/*.webp
# Background/texture section plates only, per brief 3.2 darker-variant use.
# ---------------------------------------------------------------------------
function Convert-StockStill {
    param([string]$SourceFile, [string]$Slug, [int]$Width)
    $inPath = Join-Path $Src $SourceFile
    if (-not (Test-Path $inPath)) { throw "Missing source file: $inPath" }
    $outPath = Join-Path $ImgStock "$Slug.webp"
    Write-Host "stock still: $SourceFile -> $Slug.webp" -ForegroundColor DarkCyan
    Invoke-FF @(
        '-i', $inPath,
        '-vf', "scale=$($Width):-1:flags=lanczos",
        '-c:v', 'libwebp', '-quality', '82',
        $outPath
    )
}

Convert-StockStill -SourceFile 'pexels-amar-11025645.jpg'        -Slug 'editing-suite'    -Width 1600
Convert-StockStill -SourceFile 'pexels-cottonbro-6892701.jpg'    -Slug 'editor-desk'      -Width 1200
Convert-StockStill -SourceFile 'pexels-jakubzerdzicki-30229850.jpg' -Slug 'color-wheels'  -Width 1600
Convert-StockStill -SourceFile 'pexels-ron-lach-8102674.jpg'     -Slug 'spotlight-grade'  -Width 1200

# ---------------------------------------------------------------------------
# Team photos -> assets/img/team/*.webp
# All three source frames are the same 960x1280 canvas but framed very
# differently (Phase 0 findings). Crop-normalise to a common 3:4 window
# (same aspect ratio as the crop box itself, so scaling never distorts),
# then push through the brief 3.2 three-stop duotone map on a
# contrast-boosted greyscale.
# ---------------------------------------------------------------------------
# format=gray forces a single-plane frame so geq's p(X,Y) sampler is
# unambiguous (lum(X,Y) is only defined for YUV frames and errors out once
# the graph negotiates RGB for the downstream webp encoder).
$DuotoneFilter = 'eq=contrast=1.2,format=gray,geq=' +
    "r='if(lt(p(X,Y)/255,0.5), 6+(p(X,Y)/255/0.5)*(30-6), 30+((p(X,Y)/255-0.5)/0.5)*(232-30))':" +
    "g='if(lt(p(X,Y)/255,0.5), 16+(p(X,Y)/255/0.5)*(96-16), 96+((p(X,Y)/255-0.5)/0.5)*(244-96))':" +
    "b='if(lt(p(X,Y)/255,0.5), 32+(p(X,Y)/255/0.5)*(170-32), 170+((p(X,Y)/255-0.5)/0.5)*(254-170))'"

function Convert-TeamPhoto {
    param([string]$SourceFile, [string]$Slug, [string]$CropWHXY)
    $inPath = Join-Path $Src $SourceFile
    if (-not (Test-Path $inPath)) { throw "Missing source file: $inPath" }
    $outPath = Join-Path $ImgTeam "$Slug.webp"
    Write-Host "team: $SourceFile -> $Slug.webp" -ForegroundColor Cyan
    Invoke-FF @(
        '-i', $inPath,
        '-vf', "crop=$($CropWHXY),scale=720:960:flags=lanczos,$DuotoneFilter",
        '-c:v', 'libwebp', '-quality', '85',
        $outPath
    )
}

# crop=W:H:X:Y, all boxes held at 3:4 (W:H) so the later scale never distorts.
# Hamza: full-body/small-in-frame -> tightest zoom-in.
Convert-TeamPhoto -SourceFile 'Hamza.jpeg' -Slug 'hamza' -CropWHXY '672:896:144:102'
# Rahul: closest to reference framing already -> light zoom-in.
Convert-TeamPhoto -SourceFile 'Rahul.jpeg' -Slug 'rahul' -CropWHXY '864:1152:48:51'
# Sneha: already the tightest crop of the three -> minimal additional crop.
Convert-TeamPhoto -SourceFile 'Sneha.jpeg' -Slug 'sneha' -CropWHXY '936:1248:12:16'

# ---------------------------------------------------------------------------
# Brand mark -> assets/img/brand/logo.png (background flood-filled to alpha)
# ---------------------------------------------------------------------------
$logoIn = Join-Path $Src 'LOGOHamza.png'
if (-not (Test-Path $logoIn)) { throw "Missing source file: $logoIn" }
Write-Host 'brand: LOGOHamza.png -> logo.png (background keyed to transparent)' -ForegroundColor Cyan
Invoke-FF @(
    '-i', $logoIn,
    '-vf', 'scale=512:-1:flags=lanczos,colorkey=0xFDF8F4:0.15:0.06,format=rgba',
    (Join-Path $ImgBrand 'logo.png')
)

Write-Host "`nDone. Derived assets written to $Out" -ForegroundColor Green
Write-Host 'Spot-check output before building the site on top of it (see ASSET-INVENTORY.md verification notes).' -ForegroundColor Yellow
