/**
 * Just enough of an .xlsx reader for the one-off calendar import: unzip with node:zlib and pull
 * cell values out of the sheet XML with regexes. No dependency; it isn't a general parser (no
 * formulas evaluated, no styles), and it only has to read primecode-content-calendar.xlsx.
 */
import { inflateRawSync } from "node:zlib";

/** Unzips every entry of a zip archive (stored or deflated) into a name → bytes map. */
export function unzip(zip: Buffer): Map<string, Buffer> {
  // End of central directory: the last 0x06054b50 signature (the trailing comment is ≤ 64 KB).
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file (no end of central directory)");
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error("Bad central directory entry");
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const name = zip.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const data = zip.subarray(start, start + size);
    if (method === 0) files.set(name, Buffer.from(data));
    else if (method === 8) files.set(name, inflateRawSync(data));
    else throw new Error(`Unsupported zip compression method ${method} for ${name}`);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

export function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

/** Text of every <t> inside `xml`, joined (rich-text runs become one string). */
function texts(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1]!)).join("");
}

/** "AB12" → { col: 27, row: 12 } (col is 0-based, row 1-based). */
export function cellRef(ref: string): { col: number; row: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) throw new Error(`Bad cell reference ${ref}`);
  let col = 0;
  for (const ch of m[1]!) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m[2]) };
}

/** Excel serial date (1900 system) → ISO date. Serial 1 = 1900-01-01; Excel's fake 1900-02-29 is 60. */
export function serialToIsoDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86_400_000);
  return new Date(ms).toISOString().slice(0, 10);
}

export type Sheet = { name: string; rows: Map<number, string[]> };

/** Every sheet's cell values as strings, by 1-based row number. Numbers stay as their raw text. */
export function readWorkbook(xlsx: Buffer): Sheet[] {
  const files = unzip(xlsx);
  const read = (name: string) => {
    const f = files.get(name);
    if (!f) throw new Error(`Missing ${name} in workbook`);
    return f.toString("utf8");
  };
  const shared = files.has("xl/sharedStrings.xml")
    ? [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]!))
    : [];
  const rels = new Map(
    [...read("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\s[^>]*?>/g)].map((m) => [
      /Id="([^"]+)"/.exec(m[0])![1]!,
      /Target="([^"]+)"/.exec(m[0])![1]!,
    ]),
  );
  return [...read("xl/workbook.xml").matchAll(/<sheet\s[^>]*?>/g)].map((m) => {
    const name = decodeXml(/name="([^"]*)"/.exec(m[0])![1]!);
    const target = rels.get(/r:id="([^"]+)"/.exec(m[0])![1]!)!;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    const rows = new Map<number, string[]>();
    for (const c of read(path).matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1]!;
      const body = c[2] ?? "";
      const { col, row } = cellRef(/r="([A-Z]+\d+)"/.exec(attrs)![1]!);
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = "";
      if (type === "s" && v !== undefined) value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = texts(body);
      else if (v !== undefined) value = decodeXml(v);
      if (value === "") continue;
      const cells = rows.get(row) ?? [];
      cells[col] = value;
      rows.set(row, cells);
    }
    return { name, rows };
  });
}
