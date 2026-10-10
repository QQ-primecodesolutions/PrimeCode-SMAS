# PrimeCode Publisher — MCP Server Specification

**Version 0.2 · Implementation brief for Claude Code**

A self-hosted MCP server that lets Claude render branded PrimeCode social graphics and publish them to the PrimeCode Facebook Page and Instagram Business account, with a human approval gate that the model cannot bypass.

### What changed in 0.2

Reviewed 25 August 2026 against `primecode-content-calendar.xlsx` and `primecode-first-4-posts.md`.

| # | Change | Why |
|---|---|---|
| 1 | Added §0, Meta prerequisites | The longest lead-time work wasn't in the document at all |
| 2 | Added §5.1, approval authority | §9 claimed an invariant the tool surface didn't back |
| 3 | Added `update_post` (§7) | Captions written in chat had no path into a row |
| 4 | `publishedUrl` → `published` map (§5) | Posting to FB and IG yields two IDs, one field |
| 5 | Added slide/row image assets (§5, §6) | Four of the eight templates are photo-led and cannot be rendered from text |
| 6 | Added `audience`, `objective` (§5) | Two spreadsheet columns were missing |
| 7 | Dropped `"Reel"` from `format` (§5) | No row in the calendar uses it and nothing handles video |
| 8 | Added idempotency rules (§8) | A timeout after a successful publish would double-post |
| 9 | Added timezone rule (§5) | The calendar is SAST; nothing said so |
| 10 | Revised M0 estimate (§10) | Half a day was the code, not the Meta account work |

---

## 0. Prerequisites

None of this is code. All of it blocks code. The Meta portion is the only part of the project with an external waiting period, so it starts first.

### Meta account checklist

- [ ] The PrimeCode Instagram account is converted to a **Professional (Business)** account
- [ ] That Instagram account is linked to the PrimeCode Facebook **Page**
- [ ] Both the Page and the IG account are owned by a Meta **Business portfolio** (Business Manager), not by a personal profile
- [ ] A Meta **app** exists *inside that Business portfolio*, of type Business
- [ ] A **System User** exists in Business settings, with the Page and the IG account assigned to it as assets, with full control
- [ ] A System User token is generated with these scopes:
      `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
      `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`,
      `read_insights`, `business_management`
- [ ] **Confirm whether Advanced Access or App Review is required** for `instagram_content_publish` and `pages_manage_posts` given that the app and the assets sit in the same Business portfolio. Standard Access may be sufficient; if it is not, App Review is a submission and a wait, and you want to discover that in week one rather than week three.

**Done when:** with nothing but `curl` and the token, both of these return the right names — before a single line of TypeScript exists.

```bash
curl -s "https://graph.facebook.com/v23.0/me/accounts" -H "Authorization: Bearer $TOKEN"
curl -s "https://graph.facebook.com/v23.0/$IG_USER_ID?fields=username" -H "Authorization: Bearer $TOKEN"
```

### Decisions (detail in §12)

- [ ] Storage provider and the domain that serves media
- [ ] Host
- [ ] Whether the eight templates are redrawn from Canva in CSS or designed fresh
- [ ] Where the photography for the photo-led templates comes from (see §6)

### Brand assets to collect

- [ ] Brand fonts as `woff2`, with a licence that permits self-hosting on a server
- [ ] Brand colour hex values
- [ ] Logo as SVG
- [ ] Photography for `JOURNEY-01`, `PROJECT-01`, `LOCAL-01` and screenshots for `CODE-01`

---

## 1. Purpose and scope

### What this replaces

The Canva Autofill API requires a Canva Enterprise subscription, so no automation can pour captions into a branded Canva template on a Free, Pro or Teams plan. This server sidesteps that entirely by rendering PrimeCode's templates as HTML and screenshotting them.

### In scope (v1)

- Render PrimeCode's 8 visual templates to publish-ready JPEGs
- Host those images at public HTTPS URLs (Meta fetches media server-side)
- Publish single images and carousels to a Facebook Page and an Instagram Business account
- Read back post insights
- Enforce an approval gate before anything publishes

### Explicitly out of scope (v1)

- Caption generation — Claude does that in conversation, against the Brand Knowledge sheet
- Comment/DM automation — engagement stays human, per the brand rules
- Multi-tenant support — this is one company's internal tool until it isn't
- Analytics dashboards — the existing spreadsheet is the analytics layer for now
- Video and Reels — no row in the current calendar uses them; all 24 posts are Carousel or Single image

### Non-goals worth stating

This is not a scheduler competing with Meta Business Suite. Its reason to exist is the render step. If the rendering doesn't work well, the whole project is worse than the free tool it replaces.

### Where the calendar actually is

As of 25 August 2026, the workbook holds 24 posts across 12 weeks. `PC-2026-001` is dated **today**. Posts 001–004 are at `DRAFT` with full captions written; 005–024 are at `IDEA` with captions empty. Nothing is `APPROVED`.

This server will not exist in time for the first post, and probably not the second. **Publish those by hand through Meta Business Suite**, exactly as `primecode-first-4-posts.md` already describes, and let the server take over at the first post it can actually render. The calendar does not wait for the tool. A tool that arrives after the content habit has already died has nothing left to automate.

---

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript, Node 20+ | Matches existing PrimeCode work |
| MCP | `@modelcontextprotocol/sdk`, Streamable HTTP transport | Required for remote custom connectors |
| HTTP server | Fastify | Small, fast, good TS types |
| Rendering | Playwright (Chromium) | Full CSS. See §6 for the lighter alternative |
| Storage | **Supabase Storage**, public-read bucket (decided) | Meta must fetch the media itself |
| Data | JSON file (M0–M2) → PostgreSQL + Prisma (M3+) | Don't start with a database |
| Hosting | **Railway** (decided), Docker image + persistent volume | Needs a long-lived process, a Chromium binary, and a writable disk |

**Do not deploy to a serverless function** — this rules out Vercel, and for two independent reasons. Cold starts plus a Chromium binary is a bad combination, and more decisively, serverless filesystems are ephemeral: `data/calendar.json` and `data/audit.log` are written at runtime and would be lost between invocations. `update_post` would appear to succeed and silently discard the write, and the audit log §9 requires would not survive.

The general rule, worth carrying past this project: serverless is for stateless request handling. A long-lived browser process and a source of truth on disk both want a machine that stays up.

If serverless ever becomes a hard requirement, both problems have to be solved together — switch rendering to the Satori path in §6, *and* move the calendar and audit log off the filesystem into Postgres.

---

## 3. Repository layout

```
primecode-publisher/
├── src/
│   ├── server.ts              # Fastify + MCP transport mount at /mcp
│   ├── auth.ts                # Bearer token check on every request
│   ├── tools/
│   │   ├── whoami.ts
│   │   ├── listPosts.ts
│   │   ├── updatePost.ts      # Writes content fields. Never writes status.
│   │   ├── renderPost.ts
│   │   ├── publishPost.ts
│   │   ├── schedulePost.ts
│   │   └── getInsights.ts
│   ├── render/
│   │   ├── engine.ts          # Playwright lifecycle, browser reuse
│   │   ├── templates/         # One .html.ts per template code
│   │   ├── assets/            # Logo SVG, photography, screenshots
│   │   └── fonts/             # Self-hosted woff2 files
│   ├── meta/
│   │   ├── client.ts          # Graph API wrapper
│   │   ├── facebook.ts
│   │   └── instagram.ts       # Container create → poll → publish
│   ├── store/
│   │   ├── calendar.ts        # Read/write content rows
│   │   ├── atomicWrite.ts     # Temp file + rename, serialised through one queue
│   │   └── auditLog.ts        # Append-only publish log
│   └── config.ts              # Env parsing, fails fast on missing vars
├── scripts/
│   └── seedCalendar.ts        # xlsx -> calendar.json, re-runnable
├── data/
│   ├── calendar.json          # Seeded from primecode-content-calendar.xlsx
│   └── audit.log
├── tests/
└── CLAUDE.md
```

---

## 4. Configuration

```bash
# Server auth — the bearer token Claude's custom connector sends
MCP_BEARER_TOKEN=

# Meta
META_GRAPH_VERSION=v23.0        # Pin explicitly. Verify the current stable version before setting.
META_SYSTEM_USER_TOKEN=
META_PAGE_ID=
META_IG_USER_ID=

# Storage
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_PUBLIC_BASE_URL=        # e.g. https://media.primecodesolutions.co.za

# Behaviour
DRY_RUN=true                    # Default true. Must be explicitly disabled in production.
TZ=Africa/Johannesburg          # Every date in the calendar is SAST. See §5.
```

`config.ts` validates all of these at boot and exits with a clear message if any are missing. A server that starts without a Page ID and fails on the first publish is worse than one that refuses to start.

Send the Meta token as an `Authorization: Bearer` header, never as an `?access_token=` query parameter. Query strings end up in access logs, proxy logs, and the text of thrown errors — which is exactly the set of places a token must never be.

---

## 5. Data model

### Content row

Seeded from `primecode-content-calendar.xlsx` (Content Calendar sheet). Field names match the spreadsheet's 20 columns so the two stay reconcilable.

```ts
type ContentRow = {
  contentId: string;        // "PC-2026-001"
  week: number;
  publishDate: string;      // ISO date, SAST. See "Timezone" below.
  day: string;              // "Tue" | "Fri" today, but the schedule may change
  series: string;
  pillar: string;
  topic: string;
  audience: string;         // Spreadsheet column H
  objective: string;        // Spreadsheet column I
  format: "Carousel" | "Single image";
  platform: "IG + FB" | "FB" | "IG";
  hook: string;
  caption: string;          // Instagram caption
  captionFB?: string;       // Facebook variant, where it differs
  cta: string;
  visualTemplate: TemplateCode;
  visualBrief: string;
  hashtags: string;
  status: Status;
  slides?: Slide[];         // Carousel content, one entry per image
  renderedUrls?: string[];  // Populated by render_post
  published?: PublishRecord;
  notes?: string;
};

// One entry per platform. Posting to both yields two IDs, and a
// publish can succeed on one platform and fail on the other.
type PublishRecord = {
  FB?: { postId: string; url: string; at: string };
  IG?: { mediaId: string; url: string; at: string };
};

type Status =
  | "IDEA" | "SELECTED" | "DRAFT" | "AI_REVIEW" | "HUMAN_REVIEW"
  | "REVISION" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ANALYSED" | "ARCHIVED";

type TemplateCode =
  | "TECH-01" | "BIZ-01" | "CODE-01" | "PROJECT-01"
  | "INSIGHT-01" | "BRAND-01" | "JOURNEY-01" | "LOCAL-01";

type Slide = {
  title: string;
  subtitle?: string;
  body?: string;
  assetPath?: string;       // Photo/screenshot for photo-led templates. See §6.
  assetAlt?: string;
};
```

`format` no longer includes `"Reel"`. No row in the calendar uses it, and nothing in §6 or §8 handles video. Add it back the day a video pipeline exists, not before.

### Timezone

Every date in the workbook is South African Standard Time (UTC+2), and SAST has no daylight saving. Store and compare timestamps in **UTC**; display them in SAST. This matters in three places: `publishDate`, `schedule_post`'s `publishAt`, and the rolling 24-hour quota window in §8. A quota window computed in the wrong zone is off by two hours in the direction that lets you over-publish.

### Concurrency

`calendar.json` is read-modify-write. Two tool calls arriving together will silently lose one of the writes. Serialise all writes through a single in-process queue, and write via temp file + `rename` so a crash mid-write cannot truncate the calendar. That is what `store/atomicWrite.ts` is for, rather than a bare `fs.writeFile`.

### Audit log

Append-only, one JSON line per publish attempt: timestamp, contentId, platform, outcome, resulting post URL or error, and whether `DRY_RUN` was active. This is how you answer "how did that get posted" three months from now.

### 5.1 Approval authority

The opening line of this document promises "a human approval gate that the model cannot bypass". That promise is only kept if the model cannot reach the thing that grants approval. Stated as a rule:

> **No MCP tool may write `status`, with one exception: `publish_post` sets `PUBLISHED` after Meta confirms.**

Which means approval happens somewhere the model has no access to:

| Milestone | Who sets `APPROVED` | How |
|---|---|---|
| M0–M2 | You | Edit `data/calendar.json` by hand, or set it in the workbook and re-run `scripts/seedCalendar.ts` |
| M3+ | You | A small admin page behind its own login, separate from `/mcp` |

Note what this rules out: an `approve_post` tool. If the model can call it, then "no publish without `APPROVED`" costs one extra tool call to defeat, and the gate is decoration.

It is worth being precise about `confirm: true` too. It is a parameter the *model* fills in, so it is not a human gate — it is a guard against an accidental or mis-parsed tool call. Useful, but not consent. The status check is the gate; `confirm` is the safety catch.

The workbook's Reference sheet already states the human check: accuracy, authenticity, brand fit, visual quality, CTA, and whether any client claim can be substantiated. `PC-2026-004` additionally needs written permission from Thiboloha Special School on file before it may move to `APPROVED`.

---

## 6. Rendering

### Output specifications

| Setting | Value |
|---|---|
| Dimensions | 1080 × 1350 (4:5 portrait) |
| Format | JPEG, quality 90 |
| Colour | sRGB |
| Carousel | Every slide identical dimensions — Instagram rejects mixed aspect ratios in one carousel |

### The templates

Eight HTML/CSS layouts, one per template code, matching the design direction on the Reference sheet of the calendar workbook. Each exports a function taking `{ title, subtitle, body, assetPath, slideIndex, slideCount }` and returning an HTML string.

### Not every template can be generated from text

This is the constraint that shapes the whole render layer, and it was not obvious until the Reference sheet was read alongside the spec. Four of the eight templates are image-led:

| Template | Design direction (Reference sheet) | Rendered from text alone? |
|---|---|---|
| `INSIGHT-01` | Typography only. The sentence is the design. | Yes |
| `BRAND-01` | Service icon + short line, consistent grid | Yes |
| `BIZ-01` | Problem slide, then solutions, tick/cross iconography | Yes |
| `TECH-01` | Large question headline, simple diagram | Mostly — diagram is per-post |
| `JOURNEY-01` | **Real photograph**, light text overlay | No |
| `PROJECT-01` | **Device mockup of the live site** | No |
| `LOCAL-01` | **Local imagery**, before/after frames | No |
| `CODE-01` | **Screenshot or diagram-led** | No |

So `render_post` needs an image input, not just strings. That is what `Slide.assetPath` in §5 is for: a path into `render/assets/`, or a URL the renderer fetches and inlines, composited under the text overlay by the template's CSS.

The build order follows from this. **Build `BRAND-01` and `BIZ-01` first** — they are text-only, and they cover `PC-2026-002` and `PC-2026-003`, the first two posts the server could plausibly publish. `PC-2026-001` uses `JOURNEY-01` and is dated today; it goes out by hand.

**Open conflict to resolve before building `JOURNEY-01`.** The Reference sheet specifies "real photograph, light text overlay". The visual brief for `PC-2026-001` in `primecode-first-4-posts.md` specifies "dark background, one bold sentence per slide, no stock photography". Those are different templates. Decide which one `JOURNEY-01` is and make the workbook and the brief agree, because the renderer can only implement one of them.

### Font loading

Self-host the brand fonts as woff2 in `render/fonts/` and load them with `@font-face`. Before screenshotting, **await `document.fonts.ready`**. Without this the first render silently falls back to a system face and you won't notice until the post is live.

### Browser lifecycle

Launch Chromium once and reuse it across requests; create a fresh page per render and close it. Set a render timeout of 15 seconds and fail loudly rather than returning a blank image.

### Lighter alternative

If Chromium proves painful to host, swap `render/engine.ts` for Satori (JSX → SVG) plus resvg (SVG → PNG). No browser, deployable anywhere, but a CSS subset — no arbitrary layout tricks. Keep `engine.ts` behind a narrow interface so this swap doesn't touch the tools layer.

---

## 7. Tool contracts

All tools return structured JSON. **No tool ever returns the Meta token, the bearer token, or any storage credential** — MCP tool output lands in a model's context, and anything in context can be echoed.

### `whoami`

No input. Returns the Page name and ID, the IG username and ID, token expiry if available, and current `DRY_RUN` state. Build this first — it turns most auth problems into a five-second check.

### `list_posts`

Input: `{ status?: Status, from?: string, to?: string, limit?: number }`
Returns content rows minus the caption body (keep responses small); include `contentId`, `topic`, `publishDate`, `status`, `platform`.

### `update_post`

Input: `{ contentId: string, fields: { ... } }`

Without this tool the workflow has a hole in it. §1 puts caption writing outside the server — Claude drafts captions in conversation — but `publish_post` posts `row.caption`, and nothing else can write to a row. The caption would have to be pasted into the spreadsheet by hand every time, which defeats the point.

Writable fields, and **only** these:

`hook`, `caption`, `captionFB`, `cta`, `hashtags`, `slides`, `visualTemplate`, `visualBrief`, `notes`, `topic`, `audience`, `objective`

Explicitly **not** writable: `status`, `published`, `renderedUrls`, `contentId`, `publishDate`. See §5.1 — the field allow-list is what keeps the approval gate honest. Reject unknown or forbidden keys with an error naming the offending field; do not silently ignore them.

Any edit to a row whose status is `APPROVED` or `SCHEDULED` **resets it to `REVISION`**. Approving text and then rewriting it means the approval no longer refers to anything a human read.

### `render_post`

Input: either `{ contentId: string }` or an inline `{ template: TemplateCode, title, subtitle?, slides? }`.
Returns `{ imageUrls: string[], width, height }`.

Renders and uploads to public storage. **Does not publish.** If given a `contentId`, writes `renderedUrls` back to the row but does not change `status`.

Inline input is for previewing a layout in conversation. Publishing always goes through a row, so anything you intend to post must be saved with `update_post` first.

Object keys must be random (a UUID), not `PC-2026-001-slide-1.jpg`. The bucket is public, and guessable keys mean unpublished drafts are readable by anyone who can count.

### `publish_post`

Input: `{ contentId: string, platforms: ("FB" | "IG")[], confirm: true }`

Hard preconditions, checked in this order, each returning a distinct error:

1. Row exists
2. `status === "APPROVED"` or `"SCHEDULED"` — **anything else refuses**
3. `renderedUrls` present and non-empty
4. `confirm === true` passed explicitly
5. 24-hour publishing quota not exhausted

Returns a per-platform result, because a publish to `["FB", "IG"]` can half-succeed:

```ts
{ results: { FB?: {ok, postId?, url?, error?}, IG?: {ok, mediaId?, url?, error?} } }
```

On full success: sets `status` to `PUBLISHED`, fills `published`, appends to the audit log. **On partial success** — FB posted, IG failed — record the platform that succeeded in `published`, leave `status` at `APPROVED`, and return the error. A retry must then publish only the platform still missing from `published`, never the one already there.

When `DRY_RUN` is true, performs every check and returns exactly what it *would* post without calling Meta.

### `schedule_post`

Input: `{ contentId: string, publishAt: string }`. Same preconditions as publish. M3 or later — a queue plus a worker, not a `setTimeout`.

### `get_insights`

Input: `{ contentId: string }` or `{ postId: string }`. Returns reach, likes, comments, saves, shares, profile clicks. Field names should match the Analytics sheet columns so results paste straight in.

Note that Meta tightened insights metrics in 2024 — several now require `metric_type=total_value`. Expect to adjust field requests during implementation.

---

## 8. Publishing flows

### Facebook Page — single call

`POST /{PAGE_ID}/photos` with `url`, `caption`, `access_token`. Returns a post ID. Build this first; it's the only single-step path in the whole system.

### Instagram — single image

1. `POST /{IG_USER_ID}/media` with `image_url`, `caption` → returns a creation ID
2. Poll `GET /{creation-id}?fields=status_code` until `FINISHED` (backoff: 1s, 2s, 4s, 8s; give up after ~60s and return the last `status_code`)
3. `POST /{IG_USER_ID}/media_publish` with the creation ID

### Instagram — carousel

1. Create a container per slide with `is_carousel_item=true` (no caption on children)
2. Poll each to `FINISHED`
3. Create a parent container with `media_type=CAROUSEL`, the ordered `children` array, and the caption
4. Poll the parent, then publish it

Order of the children array is the order users swipe. Get it wrong and slide 6 becomes the cover.

### Idempotency

Publishing is not safely retryable by default, and this is the failure that produces a duplicate post on a live company page.

The dangerous case is an *ambiguous* outcome: the request to Meta times out at the network layer, but Meta processed it. The post exists; your process never learned the ID. A naive retry posts it twice.

Rules:

1. Write the audit line **before** the network call (§9 already requires this). An ambiguous outcome is then a line with no recorded result, which is exactly what you need to detect one.
2. On a timeout or a 5xx, **do not retry blind.** Reconcile first: `GET /{IG_USER_ID}/media` or `GET /{PAGE_ID}/posts`, look for a post whose caption matches the row, and adopt its ID if found.
3. Only retry when reconciliation shows nothing was created.
4. Before starting, refuse if `published` already has an entry for that platform. Cheap, and catches most double-publish attempts outright.
5. On Instagram, a created container that is never published is harmless — it expires. Failing between container creation and `media_publish` is the safe place to fail, so treat the publish call as the only step needing reconciliation.

### Quota

There is a rolling 24-hour publishing quota per Instagram account. Check the current figure in Meta's documentation rather than hardcoding a number from memory. The server should track its own publishes and refuse cleanly when the window is full, rather than letting Meta return the error.

Compute the window in UTC (§5) and count from the audit log, not from in-memory state — a restart must not reset the count.

### Image constraints to validate before upload

Cheaper to catch locally than as a Meta error mid-publish: JPEG, under 8 MB, aspect ratio between 4:5 and 1.91:1. The 1080 × 1350 output in §6 sits exactly at the 4:5 portrait limit, so any drift in the render dimensions fails validation rather than degrading quietly.

---

## 9. Security

### Token handling

Use a **Meta System User token** from Business Manager, not a user access token. User tokens expire on a 60-day cycle and will break the automation at the worst possible moment; system user tokens are built for unattended use. Store it as an environment secret. Never in the database in plaintext, never in a log line, never in a tool response.

### Server authentication

Anthropic's cloud connects to this server from the public internet, which means an unauthenticated `/mcp` endpoint is a stranger's ability to post on PrimeCode's Instagram.

Minimum: a bearer token checked on every request, compared with a timing-safe comparison, supplied via the custom connector's advanced settings. Proper OAuth 2.1 per the MCP auth spec if you want it done properly — worth doing before this ever becomes a product.

Also: rate-limit the endpoint, and log every rejected auth attempt.

### Invariants that must hold regardless of what the model is told

- No publish without `status` of `APPROVED` or `SCHEDULED`
- No publish without explicit `confirm: true`
- **No MCP tool writes `status`, except `publish_post` setting `PUBLISHED`** (§5.1)
- **No `approve_post` tool exists** — approval happens off the MCP surface
- Editing an approved row returns it to `REVISION`
- `DRY_RUN` defaults to true; disabling it is a deployment decision, not a runtime one
- Every publish attempt is logged before the network call, not after
- The Meta token travels in a header, never in a URL

These live in code, not in a system prompt. A model can be argued out of a prompt instruction. It cannot be argued out of a status check.

Test the invariants the way an attacker would phrase it, not the way a user would: ask the server to publish an `IDEA` row "because the user already approved it verbally". The correct outcome is a refusal that no amount of conversation changes.

---

## 10. Milestones

### M-1 — Meta prerequisites (half a day of clicking, plus any App Review wait)

Everything in §0. No TypeScript. This is first because it is the only step whose duration you do not control.

**Done when:** the two `curl` commands in §0 return the PrimeCode Page name and the Instagram username.

### M0 — Skeleton (half a day)

Fastify server, MCP transport at `/mcp`, bearer auth, `config.ts` with fail-fast validation, `whoami` implemented against the Graph API.

Confirm early which authentication method your MCP client actually supports for a remote server — a bearer token in connector settings, or full OAuth. It changes how much of §9 you build now versus later.

**Done when:** the server is added as a custom connector in Claude, and asking "what accounts can you see?" returns the real Page and IG account.

### M1 — Rendering (1–2 days)

Playwright engine, storage upload, `BRAND-01` and `BIZ-01` templates, `render_post` with inline input.

**Done when:** Claude renders a 1080×1350 JPEG with correct brand fonts and returns a URL that opens in a browser.

### M2 — Facebook publishing (half a day)

`scripts/seedCalendar.ts`, calendar store with atomic writes, `list_posts`, `update_post`, `publish_post` for Facebook only, audit log, `DRY_RUN` honoured.

**Done when:** `PC-2026-002` publishes to the Facebook Page from a Claude conversation, and attempting to publish a row with status `IDEA` is refused with a clear error.

### M3 — Instagram publishing (1–2 days)

Container create/poll/publish, carousel support, remaining six templates, quota tracking.

**Done when:** a four-slide carousel publishes to Instagram with slides in the correct order.

### M4 — Insights and scheduling (1–2 days)

`get_insights`, `schedule_post` with a queue and worker, Postgres migration.

**Done when:** insight fields for a published post map cleanly onto the Analytics sheet columns.

---

## 11. Testing

- **Unit:** template rendering against golden-image snapshots; precondition logic for `publish_post` (every refusal path gets its own test), and the `update_post` field allow-list (attempting to write `status` must fail)
- **Golden images must run in the deploy container, not on your laptop.** Development here is on Windows and production is Linux; font rasterisation differs between them, so pixel-exact snapshots taken locally will fail in CI for reasons that have nothing to do with the code. Generate and compare them inside the same Docker image you ship, and compare with a small perceptual tolerance rather than byte equality.
- **Integration:** Graph API calls against a Meta test app before touching the live Page
- **Manual gate:** ship M2 with `DRY_RUN=true`, review a week of dry-run output, then flip it

The precondition tests matter more than they look. They're the thing standing between a conversational mistake and a live post on a company page.

---

## 12. Decisions to make before starting

1. ~~Storage provider~~ — **decided: Supabase Storage**, public bucket. Serve media from the Supabase public URL for now; a custom domain on `primecodesolutions.co.za` can come later, since Meta caches its own copy of every image it fetches and does not care what the hostname is.
2. ~~Host~~ — **decided: Railway**. Deploy from a Dockerfile based on `mcr.microsoft.com/playwright`, so the Chromium system libraries are already present. **Attach a persistent volume mounted at `data/`** — without one, Railway's container filesystem resets on every redeploy and takes the calendar and audit log with it. Set `DRY_RUN` and every secret as Railway service variables, never in the image.
3. Whether the eight templates come from redrawing the existing Canva designs in CSS, or a fresh design pass
4. Whether image URLs stay public indefinitely, or expire after publish (Meta caches its own copy, so expiry is safe — but it breaks re-publishing)
5. **Where photography comes from** for `JOURNEY-01`, `PROJECT-01`, `LOCAL-01` and `CODE-01` (§6) — a shot folder committed to the repo, an uploaded asset per post, or a redesign that removes the dependency
6. **What `JOURNEY-01` actually is** — the Reference sheet and the `PC-2026-001` visual brief currently describe two different designs (§6)

---

## 13. A note on scope

The temptation with this project is to build the whole thing before posting anything. That's what stalled the last attempt. Build M-1 to M2 — Facebook only, two text-only templates, a JSON file — and publish a real post with it. The remaining milestones are worth doing only if that first one earns its keep.

And keep posting by hand in the meantime. The calendar started today; the server has not. Of the two, the calendar is the one that matters.
