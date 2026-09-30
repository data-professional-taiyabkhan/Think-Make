<#
Derives the stock B-roll, stock stills and the brand mark in assets/ from the
raw files in source-assets/. Re-run any time those change. Never hand-process
output files.

Client clips (all fifteen), their posters, the hero showreel loops and the
pinned-story loops are derived by tools/build-motion-assets.py -- run that
after this one. Until 2026-09-30 this script also derived the first seven
client clips, the story thumbs and the duotone team portraits; the client
clips moved to the Python script so audio is handled in one place, and the
team section no longer uses photos.

Requires ffmpeg + ffprobe on PATH (falls back to the known WinGet Links
install location on this machine if the bare command isn't resolvable).
#>

$ErrorActionPreference = 'Stop'

$Root       = Split-Path -Parent $PSScriptRoot
$Src        = Join-Path $Root 'source-assets'
$Out        = Join-Path $Root 'assets'

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
$VideoStock  = Join-Path $Out 'video\stock'
$ImgStock    = Join-Path $Out 'img\stock'
$ImgBrand    = Join-Path $Out 'img\brand'
foreach ($d in @($VideoStock, $ImgStock, $ImgBrand)) { Ensure-Dir $d }

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

Write-Host "`nDone. Stock and brand assets written to $Out" -ForegroundColor Green
Write-Host 'Now run: python tools/build-motion-assets.py' -ForegroundColor Yellow
