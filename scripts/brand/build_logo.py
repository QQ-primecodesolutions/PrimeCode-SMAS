"""
Builds the PrimeCode logo as clean SVGs in assets/brand/. Run it whenever the geometry changes;
the output is committed.

    python -m venv .venv && .venv/Scripts/python -m pip install fonttools==4.60.1 uharfbuzz==0.51.1
    .venv/Scripts/python scripts/brand/build_logo.py

The mark: the Amphitheatre wall of Mont-aux-Sources (the Drakensberg above QwaQwa) on the
monitor's screen, with the prime stroke (′) standing in the notch where the wall's needle is:
the peak, the source, and the "prime" in PrimeCode. Drawn on a 512-unit grid with fixed stroke
widths. The wordmark is Inter (assets/fonts, SIL OFL), shaped with HarfBuzz for kerning and
converted to outlines, so the SVGs need no fonts.

Outputs:
  mark.svg             monitor, code brackets and the skyline (no wordmark)
  logo.svg             mark above "PrimeCode / SOLUTIONS"
  symbol.svg           the compact skyline alone, taller, for slide tiles and favicons
  symbol-reversed.svg  the same in white and bright blue, for the navy tile and dark backgrounds
"""

from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "brand"
FONTS = ROOT / "assets" / "fonts"

NAVY = "#0f3b6e"
BLUE = "#2563eb"
LIGHT = "#93c5fd"
WHITE = "#ffffff"

ROUND = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'


def pts(points: list[tuple[float, float]]) -> str:
    return " ".join(f"{'M' if i == 0 else 'L'}{x:g} {y:g}" for i, (x, y) in enumerate(points))


# The wall on the 512 grid, traced from the chosen concept: the left massif with chamfered top
# corners, the notch, the middle block, a step, and the highest right block. Open at the bottom
# (the feet stand on the screen; the fill closes along the base).
WALL = [
    (147, 257), (165, 234), (172, 187), (177, 180), (213, 176), (218, 182),
    (222, 234), (258, 234), (263, 182), (266, 176), (295, 174), (299, 180),
    (302, 210), (312, 210), (315, 148), (319, 142), (347, 142), (351, 148),
    (359, 220), (366, 257),
]  # fmt: skip
WALL_PRIME = ((238, 208), (244, 178))

# The compact version for small sizes, on a 240 grid: the same wall, taller and narrower so it
# fills a square tile, with a wider notch so the prime keeps its gap at heavier strokes.
COMPACT = [
    (14, 200), (26, 178), (32, 78), (38, 70), (84, 66), (90, 72),
    (92, 150), (144, 150), (146, 70), (152, 64), (168, 62), (174, 68),
    (176, 96), (188, 96), (190, 38), (196, 30), (210, 30), (216, 38),
    (220, 170), (226, 200),
]  # fmt: skip
COMPACT_PRIME = ((116, 126), (122, 84))


def wall(points, prime, outline: str, fill: str, prime_colour: str, stroke: float, prime_stroke: float) -> str:
    base = points[0][1]
    fill_path = pts(points) + f" L{points[-1][0]:g} {base:g} Z"
    (x1, y1), (x2, y2) = prime
    return "\n  ".join(
        [
            f'<path d="{fill_path}" fill="{fill}"/>',
            f'<path d="{pts(points)}" {ROUND} stroke="{outline}" stroke-width="{stroke:g}"/>',
            f'<path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" {ROUND} stroke="{prime_colour}" stroke-width="{prime_stroke:g}"/>',
        ]
    )


def monitor() -> str:
    return "\n  ".join(
        [
            f'<rect x="36" y="60" width="440" height="310" rx="40" {ROUND} stroke="{NAVY}" stroke-width="20"/>',
            f'<path d="M36 318 H476" {ROUND} stroke="{NAVY}" stroke-width="20"/>',
            f'<path d="M226 370 L216 428 M286 370 L296 428 M184 436 H328" {ROUND} stroke="{NAVY}" stroke-width="20"/>',
            f'<path d="M110 140 L80 177 L110 214 M402 140 L432 177 L402 214" {ROUND} stroke="{LIGHT}" stroke-width="14"/>',
            # Code lines, kept clear of the wall's feet.
            f'<path d="M78 250 H118 M92 276 H128 M394 250 H434 M384 276 H420" {ROUND} stroke="{LIGHT}" stroke-width="12"/>',
        ]
    )


def svg(view_box: str, body: str, title: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="{title}">\n'
        f"  <title>{title}</title>\n  {body}\n</svg>\n"
    )


def text_path(font_file: str, text: str, size: float, tracking_em: float = 0.0) -> tuple[str, float, float]:
    """`text` as one SVG path at `size`, kerned by HarfBuzz. Returns (d, width, cap height)."""
    path = FONTS / font_file
    font = hb.Font(hb.Face(hb.Blob.from_file_path(str(path))))
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})

    tt = TTFont(path)
    scale = size / tt["head"].unitsPerEm
    glyphs = tt.getGlyphSet()
    pen = SVGPathPen(glyphs)
    x = 0.0
    infos, positions = buf.glyph_infos, buf.glyph_positions
    for i, (info, pos) in enumerate(zip(infos, positions)):
        name = tt.getGlyphName(info.codepoint)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale)))
        x += pos.x_advance * scale
        if i < len(infos) - 1:
            x += tracking_em * size
    return pen.getCommands(), x, tt["OS/2"].sCapHeight * scale


def logo(mark_body: str) -> str:
    width = 720
    # "PrimeCode" a little wider than the monitor, as in the concept; "SOLUTIONS" letter-spaced
    # underneath, about two thirds as wide.
    _, w100, _ = text_path("Inter-Bold.ttf", "PrimeCode", 100, -0.02)
    prime_d, prime_w, prime_cap = text_path("Inter-Bold.ttf", "PrimeCode", 100 * 600 / w100, -0.02)
    _, s100, _ = text_path("Inter-SemiBold.ttf", "SOLUTIONS", 100, 0.42)
    sol_d, sol_w, sol_cap = text_path("Inter-SemiBold.ttf", "SOLUTIONS", 100 * 400 / s100, 0.42)
    prime_base = 500 + prime_cap
    sol_base = prime_base + 46 + sol_cap
    body = "\n  ".join(
        [
            f'<g transform="translate({(width - 512) / 2:g} 0)">\n  {mark_body}\n  </g>',
            f'<path transform="translate({(width - prime_w) / 2:.2f} {prime_base:.2f})" d="{prime_d}" fill="{NAVY}"/>',
            f'<path transform="translate({(width - sol_w) / 2:.2f} {sol_base:.2f})" d="{sol_d}" fill="{NAVY}"/>',
        ]
    )
    return svg(f"0 0 {width} {sol_base + 40:.0f}", body, "PrimeCode Solutions")


def main() -> None:
    mark_body = monitor() + "\n  " + wall(WALL, WALL_PRIME, NAVY, LIGHT, BLUE, 12, 12)
    files = {
        "mark.svg": svg("0 0 512 512", mark_body, "PrimeCode"),
        "logo.svg": logo(mark_body),
        "symbol.svg": svg("0 0 240 240", wall(COMPACT, COMPACT_PRIME, NAVY, LIGHT, BLUE, 16, 16), "PrimeCode"),
        "symbol-reversed.svg": svg(
            "0 0 240 240", wall(COMPACT, COMPACT_PRIME, WHITE, BLUE, "#67e8f9", 16, 16), "PrimeCode"
        ),
    }
    for name, content in files.items():
        (OUT / name).write_text(content, encoding="utf-8", newline="\n")
        print(f"assets/brand/{name}: {len(content)} bytes")


if __name__ == "__main__":
    main()
