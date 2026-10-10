# PrimeCode Studio

A local tool that turns PrimeCode Solutions' planned social posts into publish-ready slide images
and caption files. The founder publishes by hand in Meta Business Suite Planner.

**Render only.** No Meta API, MCP server, Playwright, Railway or Supabase. A later, optional phase
may add publishing; don't build it unless asked. `primecode-publisher-mcp-spec.md` is the old,
larger plan, kept for reference (template analysis §6, output specs, scope §13).

## Stack
- Next.js 16 (App Router), TypeScript strict, Tailwind v4, pnpm, zod 4, Vitest.
- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API.
- Rendering: Satori through `next/og` `ImageResponse`. No headless browser.
- Local only (`pnpm dev`), but stateless so it can move to Vercel: the web app never writes files.
- Add a dependency only with a clear reason, and give the reason in the commit message.

## Commands
- `pnpm dev`: preview at http://localhost:3000.
- `pnpm typecheck && pnpm lint && pnpm test`: run before every commit, and fix any failures.
- `pnpm import-calendar [--force]`: the one-off seed from the xlsx and
  `primecode-first-4-posts.md`. Don't rerun it with `--force`; the post files are now the source
  of truth.
- `pnpm reschedule --from YYYY-MM-DD [--skip A..B] [--write]`: new Tue/Fri dates. Only `--write`
  saves them.
- `pnpm export PC-2026-005 [more ids] [--size feed|square|story]`: writes `out/<id>/` (`01.png …`,
  `caption-instagram.txt`, `caption-facebook.txt`, `hashtags.txt`). Non-feed sizes go to
  `out/<id>/<size>/`.
  - It refuses posts with pending client permission or an unbuilt template.
  - It warns on any post that isn't cleared.
- **Preview:**
  - `/` lists the posts.
  - `/post/<id>?size=` shows the slides at phone size, plus the captions.
  - `/render/<id>/<n>.png?size=` serves one slide, uncached.

## Layout
- `content/posts/PC-2026-NNN.json`: one file per post, validated by `lib/post/schema.ts`. Edit
  these directly when drafting. Field names match the workbook's Content Calendar columns, plus:
  - `slides[]`
  - `captionFB` (the full Facebook caption, when it differs)
  - `clientPermission`
- `lib/post/`: schema, loading, status rules, client list and schedule. Pure and tested.
- `lib/graphics/`, mirroring the football platform's `lib/graphics`:
  - `sizes.ts`
  - `assets.ts`: fonts and the logo, read once
  - `model.ts`: post + slide → a pure, tested view model
  - `parts.tsx`: shared pieces
  - `templates/<code>.tsx`: one layout per template
  - `render.tsx`: model + template → PNG
- `app/`: the preview pages and a thin render route. `scripts/`: the import, reschedule and export.
- `brand/brand-brain.md`: positioning, voice and the rules for what we may claim. This copy is the
  maintained one.
- `brand/tokens.ts`: the website's palette, Inter and JetBrains Mono, and the logo.
- `assets/`:
  - `fonts/`: TTF only, with their OFL licences
  - `brand/logo.png`
  - `shots/`: client site screenshots
  - `photos/`: photos for JOURNEY-01 and LOCAL-01
- The workbook `primecode-content-calendar.xlsx` is the archive and holds the Analytics sheet.
  Never edit it.

## Templates
The 8 codes are on the workbook's Reference sheet and in Brand Brain §22. The series and the
template are separate fields: PC-001 is a Journey post drawn with INSIGHT-01, and JOURNEY-01 stays
photo-led.

Build one template end to end (model → layout → preview → export → tests) before starting the
next. Then render the posts that use it and show the PNGs.

## Satori rules
- **Layout:**
  - Any element with more than one child needs `display: flex`.
  - There's no `z-index`: later siblings paint on top, so put overlays after the background.
  - There's no `space-evenly`. Satori supports only a subset of CSS, so test each new property.
- **Kerning:** text is kerned unevenly across ordinary spaces. Render headings with no-break spaces
  (`upper()`) or as pre-wrapped lines (`<Words>`).
- **Wrapping:** compute line breaks yourself from an average character width, never mid-word.
- **Fit:** pick one font size that fits the longest headline in a carousel, and use it on every
  slide.
- **Fonts:** TTF, OTF or WOFF only, never WOFF2. Load them once per process.
- **Kerning:** Satori's opentype.js applies only type 2 GPOS kerning lookups, and skips type 9
  Extension lookups.
  - Stock Inter keeps its main kerning in an Extension lookup, so it renders unkerned ("Y our").
  - `assets/fonts/Inter-*.ttf` are rebuilt by `scripts/fonts/build_fonts.py`: subset to Latin,
    with the Extension lookups unwrapped. Rebuild them the same way if you update Inter or add a
    weight.
- **Measuring:** `lib/graphics/metrics.ts` reads real advance widths from the TTFs, which wrapping
  uses. It ignores kerning, so a measured line can only be wider than the rendered one.
- **Quotes:** text goes through `smartQuotes` before measuring.
- **Story safe zone:** keep about 250 px clear at the top and bottom of stories (`FRAME.padY`).
- **Images:** pass them as data URIs; never use relative URLs.
- **Sizes:** feed 1080×1350 (the default), square 1080×1080, story 1080×1920. Every slide in a
  carousel must be the same size.
- **Every slide:** the logo in a consistent position, and a counter ("2 / 6") on carousels. The
  final slide carries the CTA. Text must be readable on a phone at arm's length.
- **Check by eye:** after each layout change, render the PNGs at every size and open them. Don't
  trust the JSX.

## Content rules (Brand Brain; enforced in code where possible)
- **Never invent** clients, testimonials, statistics, project results, services we don't offer, or
  expertise we don't have.
- **Services:** we sell only websites, web applications, custom software and SEO. Future services
  may be mentioned only for education.
- **Clients:** written permission is needed before naming a client or showing their site.
  - The schema refuses a post that names a client in `lib/post/clients.ts`, or a `PROJECT-01`
    post, unless it has `clientPermission`.
  - `{ status: "pending" }` allows drafting only. The post can't be approved or exported until
    permission is recorded as `given` (email, WhatsApp, letter or signed form).
- **Metrics:** use only figures the founder can verify.
- **Voice:** "Here's the problem. Here's why it happens. Here's how technology can help." Avoid
  the jargon list in the Brand Brain. Check drafts against posts 001–004 for tone.
- **Status:** `IDEA → SELECTED → DRAFT → AI_REVIEW → HUMAN_REVIEW → REVISION → APPROVED →
  SCHEDULED → PUBLISHED → ANALYSED → ARCHIVED`.
  - **Only the founder sets `APPROVED`** or anything after it. Claude moves posts up to
    `HUMAN_REVIEW`, or back to `REVISION`.
  - The export warns on any post that isn't cleared (APPROVED, SCHEDULED or PUBLISHED).
- **Dates:** posts go out on Tuesdays (value) and Fridays (PrimeCode). Every date shown uses
  `Africa/Johannesburg`.

## Git
- Commit locally only. Never push or open PRs; the founder pushes.
- **Never add `Co-Authored-By` or any other attribution trailer** to commit messages.
- Don't modify `C:\Users\retsh\Videos\grassrootsfootballplatform` (read-only reference) or the
  PrimeCode website repo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
