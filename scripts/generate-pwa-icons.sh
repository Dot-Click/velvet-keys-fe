#!/usr/bin/env bash
# Renders the PWA icons from the LogoMark key (src/components/brand/logo-mark.tsx): gold on #0B0B0B.
# Needs rsvg-convert (brew install librsvg). Run from the repo root: bash scripts/generate-pwa-icons.sh
set -euo pipefail

OUT="public/icons"
mkdir -p "$OUT"

# The key spans x 21-59 and y 9-106.6 in the LogoMark's 80x120 viewBox; (40, 57.8) is its centre.
# $1 = scale. "any" icons fill about 80% of the height. Maskable icons keep the whole key inside
# the central circle of 80% of the canvas (the platform's safe zone), so a circular mask cuts nothing.
svg() {
  cat <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="12" y1="0" x2="68" y2="120">
      <stop offset="0%" stop-color="#FFF2B2"/>
      <stop offset="22%" stop-color="#E5C158"/>
      <stop offset="55%" stop-color="#D4AF37"/>
      <stop offset="85%" stop-color="#9E781D"/>
      <stop offset="100%" stop-color="#6C4E08"/>
    </linearGradient>
    <linearGradient id="goldLight" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="80" y2="120">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="35%" stop-color="#FFF2B2"/>
      <stop offset="70%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#9E781D"/>
    </linearGradient>
    <radialGradient id="diamond" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#FFF6CC"/>
      <stop offset="100%" stop-color="#D4AF37"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#0B0B0B"/>
  <circle cx="256" cy="256" r="230" fill="url(#glow)"/>
  <g transform="translate(256 256) scale($1) translate(-40 -57.8)" fill="none">
    <circle cx="40" cy="28" r="19" stroke="url(#gold)" stroke-width="1.6"/>
    <circle cx="40" cy="28" r="15.5" stroke="url(#gold)" stroke-width="0.9" stroke-opacity="0.85"/>
    <path d="M 31 21.5 L 37.5 34.5 L 43.5 28" stroke="url(#gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 43.5 21.5 V 34.5" stroke="url(#gold)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 43.5 28 L 49.5 21.5" stroke="url(#gold)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 43.5 28 L 49.5 34.5" stroke="url(#gold)" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="43.5,25.6 45.8,28 43.5,30.4 41.2,28" fill="url(#diamond)" stroke="url(#goldLight)" stroke-width="0.4"/>
    <circle cx="43.5" cy="28" r="0.6" fill="#FFFFFF"/>
    <path d="M 36.5 48 H 43.5" stroke="url(#gold)" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="40" y1="48" x2="40" y2="105" stroke="url(#gold)" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M 40 92 H 47.5" stroke="url(#gold)" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M 40 99 H 49" stroke="url(#gold)" stroke-width="2.1" stroke-linecap="round"/>
    <circle cx="40" cy="105.5" r="1.1" fill="url(#gold)"/>
  </g>
</svg>
SVG
}

render() { # scale, size, file
  svg "$1" | rsvg-convert --width "$2" --height "$2" --output "$OUT/$3"
}

render 4.1 192 icon-192.png
render 4.1 512 icon-512.png
render 3.7 512 icon-maskable-512.png
render 4.1 180 apple-touch-icon.png
echo "Wrote $OUT/icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png"
