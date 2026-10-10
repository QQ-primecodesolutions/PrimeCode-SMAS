"""
Rebuilds Inter for Satori. Run once when updating the fonts; the output is committed.

Why: Satori's bundled opentype.js only applies GPOS kerning lookups of type 2 (PairPos). Inter
wraps its main kerning lookup in a type 9 Extension lookup, so Satori skips it and headlines come
out unkerned ("Y our", "doesn ' t"). This script subsets Inter to Latin (which keeps the tables
small enough not to need Extension lookups) and unwraps every Extension lookup into its inner type.

Needs fontTools, kept out of the app's dependencies:

    python -m venv .venv && .venv/Scripts/python -m pip install fonttools==4.60.1
    .venv/Scripts/python scripts/fonts/build_fonts.py <dir with Inter 4.1 extras/ttf files> assets/fonts

Inter is SIL OFL 1.1 with no Reserved Font Name, so the modified files keep the name.
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

FILES = ["Inter-Regular", "Inter-SemiBold", "Inter-Bold", "Inter-ExtraBold"]

# Basic Latin, Latin-1, Latin Extended-A, general punctuation (dashes, curly quotes, ellipsis),
# currency, arrows, the minus sign and the tick/cross marks Inter has.
UNICODES = (
    list(range(0x0020, 0x007F))
    + list(range(0x00A0, 0x0180))
    + list(range(0x2000, 0x2070))
    + list(range(0x20A0, 0x20C0))
    + list(range(0x2190, 0x2200))
    + [0x2212, 0x2713, 0x2717, 0x2715, 0x2714]
)


def unwrap_extensions(font: TTFont) -> int:
    count = 0
    for tag in ("GPOS", "GSUB"):
        if tag not in font:
            continue
        ext_type = 9 if tag == "GPOS" else 7
        for lookup in font[tag].table.LookupList.Lookup:
            if lookup.LookupType != ext_type:
                continue
            inner = {st.ExtensionLookupType for st in lookup.SubTable}
            if len(inner) != 1:
                raise SystemExit(f"{tag} extension lookup mixes types {inner}")
            lookup.LookupType = inner.pop()
            lookup.SubTable = [st.ExtSubTable for st in lookup.SubTable]
            lookup.SubTableCount = len(lookup.SubTable)
            count += 1
    return count


def extension_lookups(path: Path) -> int:
    font = TTFont(path)
    return sum(
        1
        for tag, ext in (("GPOS", 9), ("GSUB", 7))
        if tag in font
        for lookup in font[tag].table.LookupList.Lookup
        if lookup.LookupType == ext
    )


def main(src: Path, out: Path) -> None:
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    for name in FILES:
        font = TTFont(src / f"{name}.ttf")
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=UNICODES)
        subsetter.subset(font)
        unwrapped = unwrap_extensions(font)
        target = out / f"{name}.ttf"
        font.save(target)
        left = extension_lookups(target)
        if left:
            raise SystemExit(f"{target}: {left} extension lookups came back on save (tables too big?)")
        print(f"{target}: {target.stat().st_size // 1024} KB, unwrapped {unwrapped} extension lookup(s)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))
