# PrimeCode Studio: session kickoff prompt

Paste everything below the line into a new Claude Code session opened in
`C:\Users\retsh\Videos\PrimeCode-SMAS`.

---

You're helping me build **PrimeCode Studio**: a small local tool that turns PrimeCode Solutions'
planned social posts into publish-ready images. I'm the founder of PrimeCode Solutions, a small
software company in Phuthaditjhaba, QwaQwa.

## Context: read these first

**In this folder (`PrimeCode-SMAS`):**
- `primecode-content-calendar.xlsx` has five sheets:
  - Content Calendar (24 posts)
  - Ideas Backlog
  - Analytics
  - Brand Knowledge
  - Reference: series mix, the 8 visual templates and their design direction, the CTA library, and
    the status workflow
- `primecode-first-4-posts.md`: the first four posts in full (slides, captions, Facebook variants
  and visual briefs). They set the tone for every later post.
- `primecode-publisher-mcp-spec.md`: an earlier, larger plan (MCP server, Meta Graph API,
  Playwright, Railway, Supabase). **We're NOT building that now.** Read it for:
  - the template analysis in §6 (which templates can be rendered from text alone)
  - the output specs (1080×1350, 4:5)
  - §13 on scope

  Its Playwright, MCP and Meta parts are out of scope for this session.
- Git: this repo exists but has no commits yet.

**Elsewhere, read-only:**
- `C:\Users\retsh\Videos\PrimeCode Digital Presence Engine\01-brand\primecode-brand-brain.md` is the
  Brand Brain: positioning, voice, the "never claim" rules, the content pillars and the CTA library.
  Copy it into this repo as `brand/brand-brain.md` so there's one source of truth.
  - Its template list is out of date (`BUSINESS-01`, `BRAND-01` = Journey). The workbook's
    Reference sheet is newer (`BIZ-01`, `BRAND-01` = Services, plus `JOURNEY-01` and `LOCAL-01`).
  - Make the workbook's 8 codes canonical and update the copied Brand Brain's §22 to match.
- `C:\Users\retsh\Videos\grassrootsfootballplatform` is my production Next.js 16 app.
  - Its `lib/graphics/` already renders branded PNG graphics with Satori via `next/og`. **Reuse
    that approach.** Read these before designing anything:
    - `lib/graphics/render.tsx` (JSX → `ImageResponse` → PNG bytes)
    - `assets.ts` (fonts and logos read from disk once)
    - `sizes.ts` (a size table)
    - `model.ts` (pure, tested view models)
    - `graphics.tsx` and `parts.tsx` (layout, the `Words` and `upper()` helpers)
    - the "Graphics" section of its `CLAUDE.md`
  - **Don't modify anything in that repo.** Copy ideas and small helpers, not the football logic.

## What to build (render-only)

**Flow:** post file → live preview in the browser → exported slide images plus caption text files.
I publish by hand in Meta Business Suite Planner.

**No auto-publishing.** That means no Meta API, MCP server, Railway or Supabase. An optional phase
later may add publishing, and the design should leave room for it, but don't build it.

### Stack
- Next.js 16 (App Router), TypeScript strict, Tailwind v4, pnpm, zod, Vitest: the same as the
  football platform. Next.js 16 differs from older versions, so check `node_modules/next/dist/docs/`
  before using an API.
- **Rendering: Satori through `next/og` `ImageResponse`.** No headless browser, no Chromium.
- Runs locally only (`pnpm dev`). It may move to Vercel later, so keep it stateless: no runtime
  file writes from the web app.
- Add a dependency only with a clear reason, and say why in the commit.

### Content model
- **One file per post:** `content/posts/PC-2026-0NN.json`, validated by a zod schema in
  `lib/post/schema.ts`.
- **Field names match the workbook's Content Calendar columns:** `contentId`, `week`,
  `publishDate` (ISO date, SAST), `series`, `pillar`, `topic`, `audience`, `objective`, `format`
  (`"Carousel" | "Single image"`), `platform`, `hook`, `caption`, `captionFB?`, `cta`,
  `visualTemplate`, `visualBrief`, `hashtags`, `status`, `notes?`.
- **Plus `slides[]`:** each slide has `title`, `subtitle?`, `body?`, `items?`, `asset?` and
  `assetAlt?`.
- **Plus `clientPermission?`**, for posts that name a client: who gave permission, when and how.
  - The schema must **refuse** a `PROJECT-01` post, or any post naming a client from the Brand
    Brain's project list, without `clientPermission`.
  - This puts the Brand Brain's "written permission before naming a client" rule in code.
- **Seed script:** `scripts/import-calendar.ts` reads the xlsx once and writes the post files,
  including the four posts written in full in `primecode-first-4-posts.md`.
  - Ask me before adding an xlsx library. A one-off CSV export from Excel is an acceptable
    alternative.
  - From then on, the post files are the source of truth and you edit them directly when we draft
    content together.

### Brand tokens
- `brand/tokens.ts` holds colours, fonts and logo paths. **I have a logo and the brand colours. Ask
  me for them first**, before choosing any colours.
- **Fonts:** Satori accepts **TTF/OTF/WOFF, not WOFF2**.
  - Store the font files in `assets/fonts/`, with their licence. Use SIL OFL fonts unless I provide
    licensed ones.
  - Load them once per process, as `lib/graphics/assets.ts` does in the football app.
- **Logo:** read it from `assets/brand/` and pass it to Satori as a data URI.

### Output
- **Sizes:**
  - Feed: 1080×1350 (4:5), the default.
  - Square: 1080×1080.
  - Story: 1080×1920.
  - Every slide in a carousel must be exactly the same size, because Instagram rejects mixed sizes.
- **Export:** `pnpm export PC-2026-005` writes `out/PC-2026-005/`, containing:
  - `01.png … NN.png`
  - `caption-instagram.txt`
  - `caption-facebook.txt` (the FB variant, or the IG caption plus its FB additions)
  - `hashtags.txt`
- **Rendering in the script:** the script imports the render functions directly. No running
  server is needed. The football platform does the same in a scratch script that stubs
  `next/cache`.
- **Preview page:** `/` lists the posts by date and status. `/post/[contentId]` shows every slide
  side by side at phone size, with a size switcher and the captions.
- **Route:** `/render/[contentId]/[slide].png?size=` serves one slide, so the preview hot-reloads
  while we design.
- **Every slide gets:**
  - a slide counter ("2 / 6") on carousels
  - the logo in a consistent position
  - the final slide carrying the CTA
- Keep text large enough to read on a phone at arm's length.

### Satori rules (learned the hard way on the football platform)
- **Layout:**
  - Any element with more than one child needs `display: flex`.
  - There's no `z-index`: later siblings paint on top, so put overlays after the background.
  - There's no `space-evenly`.
  - Satori supports only a subset of CSS, so test each new property.
- **Kerning:** text across ordinary spaces is kerned unevenly. Render headings with no-break spaces
  (`upper()` in the football app) or pre-wrapped lines (its `<Words>` component).
- **Wrapping:** compute line breaks yourself from an average character width, never mid-word.
- **Fit:** pick one font size that fits the longest headline in a carousel, and use it for every
  slide so the set looks consistent.
- **Images:** pass them as data URIs or absolute file reads, never as relative URLs.
- **Checking:** look at every size by eye after each layout change. Render the PNGs and open
  them; don't trust the JSX.

### Templates, in this order
The canonical design directions are on the workbook's Reference sheet.

1. **`INSIGHT-01`**: typography only; the sentence is the design. Use it first for **PC-2026-001**:
   its brief asks for "dark background, one bold sentence per slide, no stock photo", which is a
   typographic design, not a photo one.
   - This also settles the `JOURNEY-01` conflict noted in the spec: `JOURNEY-01` stays photo-led,
     and 001 uses the typographic design.
   - **Confirm this with me before building.**
2. **`BIZ-01`**: a problem slide, then numbered signs or solutions with tick/cross icons. Draw the
   icons as simple shapes or inline SVG; no icon font. Covers PC-003, 009, 013, 017, 019, 023.
3. **`BRAND-01`**: services in a consistent grid, an icon plus a short line. Covers PC-002 and 006.
   List only the four services we sell: websites, web applications, custom software and SEO.
4. **`TECH-01`**:
   - a large question headline
   - simple diagram primitives (box, arrow, label, two-column comparison)
   - the logo bottom-right
5. **`CODE-01`**: render code as text (monospace font, syntax colours as spans) instead of
   screenshots. Also build flow diagrams from the `TECH-01` primitives.
6. **`PROJECT-01`**:
   - a laptop or phone device frame drawn in Satori, with a real screenshot inside
   - screenshots are files I supply in `assets/shots/`
   - a problem → what we built → why it mattered structure
7. **`JOURNEY-01`** and **`LOCAL-01`**: photo-led. They need photos I supply.
   - Use a light text overlay, with a gradient for legibility.
   - `LOCAL-01` frames must be labelled clearly as illustrative concepts, never implying a real
     client.

Build **one template end to end** (schema → model → layout → preview → export → tests) before
starting the next. After each template, render the posts that use it and show me the PNGs.

### Code layout (mirrors the football app)
- `lib/post/`: the zod schema, loading post files, and status rules. Pure and tested.
- `lib/graphics/model.ts`: post plus slide index → a pure view model (wrapping, font size, counter).
  Tested with Vitest.
- `lib/graphics/templates/<code>.tsx`: one layout per template. `parts.tsx` holds shared pieces
  (logo, counter, `Words`, icons, device frame, diagram primitives).
- `lib/graphics/render.tsx`: model plus template → `ImageResponse` → PNG bytes.
  `assets.ts`: fonts and images. `sizes.ts`: the sizes.
- `app/`: the preview pages and the thin render route.
- `scripts/`: the calendar import and the export.

### Content rules (from the Brand Brain, enforced where code can)
- **Never invent:**
  - clients, testimonials, statistics or project results
  - services we don't offer
  - expertise we don't have
- **Before naming a client or showing their site:** written permission. Thiboloha Special School
  must give it before PC-2026-004 is published.
- **Metrics:** use only figures I can verify; PC-2026-020 needs real numbers.
- **Voice:** "Here's the problem. Here's why it happens. Here's how technology can help." Avoid the
  jargon list in the Brand Brain.
- **Status workflow:** IDEA → … → APPROVED → SCHEDULED → PUBLISHED.
  - **Only I** may set a post to `APPROVED`.
  - You may draft and move posts up to `HUMAN_REVIEW`.
  - The export prints a clear warning on any post not yet `APPROVED`.
- When we draft captions together, check them against the first four posts for tone.

### Calendar
None of the 24 posts has been published yet: the calendar slipped. After the import, propose new
dates:
- Same Tuesday/Friday rhythm.
- **Start on Tuesday 13 October 2026, or the first Tuesday the studio can render**, whichever is
  realistic. Ask me which.
- Keep the order.
- Store the dates in the post files.
- **Don't edit the xlsx.** It stays as the archive and the Analytics sheet.

### Working agreement
- Before every commit: `pnpm typecheck && pnpm lint && pnpm test`. Fix any failures.
- **Git: commit locally only.** Never push or open PRs; I push.
  - **Never add `Co-Authored-By` or any attribution trailer** to commit messages.
- Write a `CLAUDE.md` for this repo early, recording the stack, the Satori rules, the content rules
  and these git rules, so later sessions follow them.
- Timezone: `Africa/Johannesburg` for every date shown.
- **Work in milestones.** After each one, tell me what changed and how to try it:
  1. **M1:** scaffold, brand tokens (ask me for colours and logo), fonts, post schema, calendar
     import, CLAUDE.md.
  2. **M2:** the render pipeline, preview page, export script, and `INSIGHT-01` (with PC-001 and
     PC-005 rendered).
  3. **M3:** `BIZ-01` and `BRAND-01` (PC-002, PC-003 rendered).
  4. **M4:** `TECH-01` and `CODE-01`.
  5. **M5:** `PROJECT-01`, `JOURNEY-01` and `LOCAL-01`, plus the asset folders.
  6. **Later, only if I ask:** publishing, after weeks of consistent manual posting.
- **Ask me when unsure.** Ask about brand choices, anything about clients, and anything the Brand
  Brain doesn't cover. Don't guess.

**Start now:** confirm you've read the files above, list any conflicts you find between them,
then ask me for the logo file and brand colours.
