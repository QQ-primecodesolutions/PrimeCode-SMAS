/**
 * A small syntax highlighter for CODE-01 slides: enough to colour short, hand-written snippets
 * (html, css, js/ts, sql, json), not a parser. Pure; the view colours each token (brand/tokens.ts).
 */
import type { Code } from "@/lib/post/schema";

export type TokenKind = "plain" | "keyword" | "string" | "comment" | "number" | "function" | "tag" | "attr" | "punct";
export type Token = { text: string; kind: TokenKind };

type Rule = [TokenKind, RegExp];

const STRING = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y;
const NUMBER = /\b\d+(?:\.\d+)?\b/y;

const JS: Rule[] = [
  ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
  ["string", STRING],
  ["number", NUMBER],
  [
    "keyword",
    /\b(?:const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|new|class|this|true|false|null|undefined|type|interface|try|catch|throw|of|in)\b/y,
  ],
  ["function", /[A-Za-z_$][\w$]*(?=\s*\()/y],
  ["plain", /[A-Za-z_$][\w$]*/y],
  ["punct", /[{}()[\];,.<>=+\-*/!&|?:%]+/y],
];

const SQL: Rule[] = [
  ["comment", /--[^\n]*/y],
  ["string", /'(?:''|[^'\n])*'/y],
  ["number", /\$\d+|\b\d+(?:\.\d+)?\b/y],
  [
    "keyword",
    /\b(?:select|from|where|insert|into|values|update|set|delete|create|table|primary|key|references|foreign|not|null|unique|default|int|integer|text|varchar|date|timestamp|boolean|serial|join|left|on|and|or|order|by|group|as|returning|limit)\b/iy,
  ],
  ["function", /[A-Za-z_]\w*(?=\()/y],
  ["plain", /[A-Za-z_]\w*/y],
  ["punct", /[(),;.*=<>]+/y],
];

const CSS: Rule[] = [
  ["comment", /\/\*[\s\S]*?\*\//y],
  ["string", STRING],
  ["keyword", /@[\w-]+/y],
  ["number", /#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|s|ms|vh|vw|fr)?\b/y],
  ["attr", /[\w-]+(?=\s*:[^:])/y],
  ["plain", /[\w-]+/y],
  ["punct", /[{}();:,.>+~*]+/y],
];

const JSON_RULES: Rule[] = [
  ["attr", /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
  ["string", /"(?:\\.|[^"\\\n])*"/y],
  ["number", /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
  ["keyword", /\b(?:true|false|null)\b/y],
  ["punct", /[{}[\],:]/y],
];

function scan(source: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < source.length) {
    let matched = false;
    for (const [kind, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(source);
      if (m && m[0].length > 0) {
        out.push({ text: m[0], kind });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) out.push({ text: source[i++]!, kind: "plain" });
  }
  return out;
}

/** HTML needs a little state: words inside a tag are attributes, outside they're text. */
function scanHtml(source: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let inTag = false;
  const at = (re: RegExp) => {
    re.lastIndex = i;
    return re.exec(source)?.[0];
  };
  while (i < source.length) {
    let t: string | undefined;
    if ((t = at(/<!--[\s\S]*?-->/y))) out.push({ text: t, kind: "comment" });
    else if ((t = at(/<\/?[A-Za-z][\w-]*/y))) {
      out.push({ text: t, kind: "tag" });
      inTag = true;
    } else if (inTag && (t = at(/\/?>/y))) {
      out.push({ text: t, kind: "tag" });
      inTag = false;
    } else if (inTag && (t = at(/"[^"]*"|'[^']*'/y))) out.push({ text: t, kind: "string" });
    else if (inTag && (t = at(/[A-Za-z_:][\w:.-]*/y))) out.push({ text: t, kind: "attr" });
    else if (inTag && (t = at(/=/y))) out.push({ text: t, kind: "punct" });
    else if (!inTag && (t = at(/[^<]+/y))) out.push({ text: t, kind: "plain" });
    else out.push({ text: (t = source[i]!), kind: "plain" });
    i += t.length;
  }
  return out;
}

export function tokenize(source: string, language: Code["language"]): Token[] {
  switch (language) {
    case "html":
      return scanHtml(source);
    case "js":
    case "ts":
      return scan(source, JS);
    case "sql":
      return scan(source, SQL);
    case "css":
      return scan(source, CSS);
    case "json":
      return scan(source, JSON_RULES);
    default:
      return [{ text: source, kind: "plain" }];
  }
}

/** Tokens split into lines, tabs expanded to two spaces, adjacent tokens of a kind merged. */
export function highlightLines(source: string, language: Code["language"]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(source.replace(/\t/g, "  ").replace(/\s+$/, ""), language)) {
    token.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (!part) return;
      const line = lines.at(-1)!;
      const last = line.at(-1);
      if (last && last.kind === token.kind) last.text += part;
      else line.push({ text: part, kind: token.kind });
    });
  }
  return lines;
}
