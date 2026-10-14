#!/usr/bin/env python3
"""One-time tool (not a build step): turns the two mountain photos into the masked
exports that main.js draws as dots.

  python3 tools/mountains_mask.py

In each export, alpha = dot density (0 = no dot, 1 = always a dot) and
RGB = dot color (the pixel's own hue as a pastel). All tone decisions happen
here, so the browser only reads the image. After re-exporting, bump the ?v=
on the image URLs in main.js.
Needs Pillow and NumPy.
"""
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "images"
WIDTH = 480  # export width; the page samples this on a 2.8px lattice (~434 columns at 1216px)

clamp = lambda v: np.clip(v, 0.0, 1.0)


def night_density(r, g, b, lum):
    # sky is blue, land is warmer: split them by (b - r), then light each side differently
    land = clamp((0.16 - (b - r)) / 0.08)
    ridge = land * clamp((lum - 0.05) / 0.30)       # bright land
    glow = (1 - land) * clamp((lum - 0.30) / 0.20)  # moon and clouds
    return clamp(ridge + glow)


def day_density(r, g, b, lum):
    # sky is bright, land is darker
    return clamp((0.47 - lum) / 0.25)


# name: (source, crop top, crop bottom, density rule, dot lightness)
JOBS = {
    "mountains-dark.webp": ("bg-night.jpg", 0.30, 0.75, night_density, 0.72),
    "mountains-light.webp": ("bg-day.jpg", 0.55, 1.00, day_density, 0.46),
}


def pastel(rgb, light):
    """The pixel's hue as a soft color at a fixed lightness."""
    h, _, s = colorsys.rgb_to_hls(*rgb)
    s = min(0.85, 0.45 + s * 1.2)
    return colorsys.hls_to_rgb(h, light, s)


def export(name, src, top, bottom, density, light):
    img = Image.open(HERE / src).convert("RGB")
    img = img.crop((0, round(img.height * top), img.width, round(img.height * bottom)))
    img = img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
    px = np.asarray(img, dtype=np.float32) / 255.0
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    alpha = density(r, g, b, lum)

    rgb = np.empty_like(px)
    for y in range(px.shape[0]):
        for x in range(px.shape[1]):
            rgb[y, x] = pastel(px[y, x], light)

    # the page rounds colors to 4 bits and compares alpha to an 8x8 Bayer matrix,
    # so finer data only costs bytes
    rgb = np.round(rgb * 15) / 15
    alpha = np.round(alpha * 31) / 31
    out = np.dstack([rgb, alpha])
    Image.fromarray((out * 255).round().astype(np.uint8), "RGBA").save(
        OUT / name, lossless=True, exact=True)  # exact keeps RGB where alpha is 0
    print(name, img.size, f"{(OUT / name).stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, job in JOBS.items():
        export(name, *job)
