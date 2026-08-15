<<<<<<< HEAD
# Resume Builder

A resume editor, template renderer, and PDF export pipeline built with
Next.js, TypeScript, Tailwind, Prisma, Tiptap, and Playwright.

## Status: Checkpoint 7 — Polish (MVP complete)

Checkpoint 1 (Foundation) contains:

- Next.js 16 / React 19 / TypeScript / Tailwind project scaffold
- Prisma schema (`prisma/schema.prisma`) — SQLite for local dev, written to
  be Postgres-compatible with no changes beyond the datasource block
- Core resume data types (`types/resume.ts`) — the shape the editor, every
  template, and the PDF pipeline all agree on
- The template interface (`templates/types.ts`) and a registry
  (`templates/index.ts`) with a placeholder Classic template, proving the
  "swap templates without touching content" architecture compiles end to end
- A minimal auth stub (`lib/auth.ts`) — single local user today, structured
  so real auth is a one-function change later

Checkpoint 2 (this one) adds:

- **API routes** (`app/api/resumes/`) — list/create resumes; per-resume
  fetch, full-document autosave sync, metadata patch (rename/template),
  delete
- **`lib/resume/serialize.ts`** — Prisma nested query result → `ResumeData`
- **`lib/resume/sync.ts`** — the autosave write path (see "How autosave
  persistence works" below) and new-resume skeleton seeding
- **`lib/resume/validation.ts`** — Zod validation for the autosave payload
- **Zustand + immer store** (`store/resumeStore.ts`,
  `store/ResumeStoreProvider.tsx`) — full CRUD for personal info, sections
  (add/remove/rename/reorder/hide), education entries, experience-style
  entries, and one-level-nested bullets. Instantiated per-resume via React
  context so switching resumes never leaks state between them.
- **`hooks/useAutosave.ts`** — debounced (1.2s) save-on-change with status
  tracking and a `beforeunload` guard
- **Editor UI** (`components/editor/`) — section sidebar, personal info
  form, and section-type editors (education table, experience-style entries
  with nested bullets, freeform text). Text fields use plain
  `<input>`/`<textarea>` for now; every value already round-trips through a
  plain-text ↔ Tiptap-JSON bridge (`lib/resume/richtext.ts`) so Checkpoint 3
  can drop in the real rich text editor with **no data migration**.
- A minimal dashboard "bridge" page (create/list/open resumes) — just enough
  to reach the editor; the real dashboard (rename, duplicate, delete, export
  UI) is Checkpoint 6.

Checkpoint 3 (this one) adds:

- **Real rich text editing**, replacing the interim plain-text bridge
  everywhere it was used:
  - `lib/tiptap/extensions.ts` — builds the Tiptap extension set for three
    variants: `block` (freeform sections like Skills — full toolbar
    including bullet/numbered lists and text alignment), `paragraph`
    (entry/education descriptions — marks + font family/size/color/
    highlight/links, multiple paragraphs, no lists), and `inline` (a single
    bullet's text — same marks as paragraph, but constrained to one line;
    Enter is suppressed rather than starting a new paragraph)
  - `lib/tiptap/fontSize.ts` — a small custom extension adding a `fontSize`
    attribute to the `textStyle` mark (Tiptap doesn't ship a stable official
    one yet)
  - `components/editor/rich-text/RichTextEditor.tsx` +
    `RichTextToolbar.tsx` — the editing surface and its formatting toolbar
    (bold/italic/underline/strike, font family, font size, text color,
    highlight, links, bullet/numbered lists where applicable, alignment
    where applicable, undo/redo)
  - The store's plain-text setters (`setRichContentText`,
    `updateBulletText`, etc.) were replaced with doc-based ones
    (`setRichContent`, `updateBulletContent`, etc.) that take a Tiptap
    `RichTextDoc` directly — since Checkpoint 2 already stored everything in
    that structured format, this was a pure swap with **no data migration**
  - Education/entry descriptions and bullets now use the `paragraph`/
    `inline` variants; freeform (Skills-style) sections use `block`

Checkpoint 4 (this one) adds:

- **The real Classic template** (`templates/classic/ClassicTemplate.tsx` +
  `classic.css`), recreating `ResumeOLD.pdf`: centered serif name + rule,
  a gray section-header bar per section, a bordered 4-column education
  table, and bulleted entries with right-aligned dates and one level of
  nested sub-bullets. An entry with no title/date (used for plain
  bullet-only sections like "Academic Achievements") renders its bullets
  directly at the top level instead of an empty header line — see the
  comment above `EntriesList` in the template for why.
  - CSS uses pt-based sizing (not Tailwind's rem scale) so the on-screen
    preview and the Checkpoint 5 Playwright PDF stay visually identical.
  - Every class is prefixed `classic-` since this is a plain global CSS
    import (Next's App Router allows importing CSS from any component, but
    it's not scoped like a CSS Module) — any future template should adopt
    its own prefix the same way.
- **`components/resume/RichTextRenderer.tsx`** — turns a stored
  `RichTextDoc` into JSX (marks, links, nested lists). This is template-
  agnostic and reused by every template; in Checkpoint 5 the PDF route
  renders through the exact same template components, so this is also what
  keeps rich text identical between preview and PDF.
- **`lib/resume/present.ts`** — presentation-neutral helpers
  (`displayDateRange`, `visibleSections`) that any template can reuse
  without duplicating logic.
- **Live preview** (`components/preview/ResumePreview.tsx`) — renders the
  resume's selected template at *true* A4 print dimensions, then scales it
  down visually with a CSS transform, with zoom controls (50–100%) and a
  page-boundary/shadow. It's wired into the editor as a togglable third
  pane (`EditorShell`'s "Hide/Show preview" button) so there's more editing
  room on request.

**All seven checkpoints are now complete.** See below for what Checkpoint 7
added.

### How autosave persistence works

The editor keeps one big `ResumeData` object in memory. On every debounced
save, the client sends its **entire current** `personalInfo` + `sections`
tree to `PUT /api/resumes/[id]`, and the server replaces the resume's
content wholesale inside one transaction (delete all sections — which
cascades to entries/education rows/bullets — then recreate from the payload).
This is simpler and more robust against drift than diffing granular
mutations across a deeply nested tree, and resumes are small enough (dozens
of rows at most) that a full replace is cheap. See the comments in
`lib/resume/sync.ts` for the details, including why bullets are inserted in
two passes (parents, then children — `Bullet.parentId` is a self-relation,
so a child row's parent must exist first).

### Testing note for this checkpoint

This sandbox has no network access to Prisma's binary host, so **no Prisma
CLI command at all** — not just `generate`, but `db push`/`migrate` too —
could be run here (schema-engine, a Rust binary, is required even just to
load the schema, regardless of which client architecture is configured).
This is purely a sandbox restriction and will work normally on your machine.

Everything that *could* be verified without a live database was: `next
build`/`tsc --noEmit` pass cleanly (the one remaining error is the expected
"Prisma client not generated yet"), and:

- Checkpoint 2: all pure logic (store mutations, nested bullets, the
  rich-text bridge, and the Zod validation schema against real store output)
  was exercised with a standalone smoke test before being removed
- Checkpoint 3: since Tiptap needs a DOM, its extension schemas were
  smoke-tested with `jsdom` + `@tiptap/core`'s `generateJSON`/`generateHTML`
  (no full editor view needed) — confirming the `block` variant registers
  bullet/ordered lists and the `paragraph`/`inline` variants correctly don't,
  and that the custom `fontSize` mark round-trips alongside `color` and
  `fontFamily`. Also removed before packaging.
- Checkpoint 4: a pre-installed Playwright/Chromium happened to be available
  in this sandbox, so the Classic template could actually be visually
  verified — a temporary dev-only route rendered it with the reference
  resume's real content, screenshotted, and compared side-by-side against
  `ResumeOLD.pdf`. One discrepancy was caught and fixed this way (entry
  dates were rendering italic; the reference is plain). That route, its
  screenshot script, and the Playwright/tsx dev dependencies were all
  removed before packaging — none of it ships.

The one area **not** exercised end-to-end (needs a live DB) is the Prisma
transaction code itself (`syncResumeContent`'s nested creates and two-pass
bullet insert) — worth a careful look and a quick manual test (create a
resume, format some bullet text with bold/links, add nested bullets, refresh
the page) after your first `prisma generate && prisma db push`.

## Checkpoint 5 — PDF export

Adds:

- **`lib/pdf/generateResumePdf.ts`** — launches headless Chromium via
  Playwright and calls `page.pdf()` against the app's own print route.
  Nothing here re-implements resume layout; it screenshots the same
  template component the live preview uses.
- **`app/print/[id]/page.tsx`** — a minimal, chrome-free route rendering
  only `<Template data={resume} isPrintMode />`. See the comment in that
  file for a known limitation: it authenticates exactly like every other
  route (today, a single seeded local user), so once real per-user auth
  exists, Playwright's unauthenticated browser context will need a
  server-to-server credential (e.g. a short-lived signed token) — this is
  the one place that will need to change for that.
- **`app/api/resumes/[id]/pdf/route.ts`** — verifies ownership, generates
  the PDF, streams it back with a sanitized `Content-Disposition` filename.
- **`EditorShell`**'s "Export PDF" button is now live, with a loading state
  and inline error message.

**This was the most thoroughly tested checkpoint.** A pre-installed
Playwright/Chromium happened to be available in this sandbox, so — unlike
every other checkpoint here — the actual PDF pipeline could be exercised for
real: generating genuine multi-page PDFs from test content and rasterizing
them (via `pdftoppm`) for visual inspection, rather than just type-checking.

That testing caught a real bug: page 1 had correct top/bottom margins (from
the template's own CSS padding), but page 2+ had none. Container padding
only appears once at the very start/end of a continuous content flow, not at
each page-break Chromium inserts when slicing it into pages. Fixed by moving
vertical margin to Playwright's `page.pdf({ margin })` option (which
correctly repeats on every page) while keeping horizontal margin in the
template's own CSS (safe, since it's a single block's inline padding and
naturally appears on every page slice), and adding a `@media screen`-only
padding rule so the un-paginated live preview still looks right. Re-verified
across a 5-page test PDF — every page has consistent margins, and the
`break-inside: avoid` rules on sections/entries are working (nothing splits
awkwardly across a page boundary in the tested content).

All temporary test routes/scripts were removed before packaging, and
Playwright was bumped from the version pinned for sandbox testing back to
the actual latest release for shipping.

### A note on installing Playwright's browser

`npm install` alone does **not** download Chromium — Playwright needs a
separate step:

```bash
npx playwright install chromium
```

Run this once after `npm install`. If PDF export fails with a "Chromium
executable doesn't exist" style error, this is almost always why — the API
route's error message points back here.

## Checkpoint 6 — Resume dashboard

Adds the real multi-resume dashboard (`components/dashboard/Dashboard.tsx` +
`ResumeCard.tsx`), replacing Checkpoint 2's minimal create/list "bridge":

- **Create** — same as before, now with an inline error message on failure
  and an empty state ("No resumes yet") for first-time use
- **Rename** — inline edit-in-place on the card, saved via
  `PATCH /api/resumes/[id]` (already built in Checkpoint 2, just wired up
  here); optimistic UI update, fire-and-forget request
- **Duplicate** — `POST /api/resumes/[id]/duplicate` deep-clones a resume's
  full `personalInfo` + section/entry/bullet tree under a new `Resume` row
  with fresh ids at every level (see `duplicateResume` and the
  `clone*WithNewIds` helpers in `lib/resume/sync.ts`). It reuses the exact
  same `createSectionRow` helper the autosave path uses, so there's only one
  place that knows how to write a section tree into the database.
- **Delete** — optimistic removal from the list with rollback if the
  `DELETE` request fails
- **Export** — the same `GET /api/resumes/[id]/pdf` route from Checkpoint 5,
  triggered from the card as a direct download (loading spinner, inline
  error message on failure) without needing to open the editor first
- The dashboard page itself (`app/dashboard/page.tsx`) is a server component
  that loads the initial resume list via `listResumes()` directly (no
  client-side fetch waterfall on first paint), then hands off to the client
  `Dashboard` component for all the interactive parts

### Testing note for this checkpoint

Same sandbox limitation as every other checkpoint (no live database
available), but this time the *other* previously-untested risk area could
finally be checked directly: with Playwright available, I ran the actual
`generateResumePdf()` function (Checkpoint 5's real production code, not a
reimplementation) against a temporary content-heavy test route, producing a
genuine 3-page PDF. Rasterizing it page-by-page confirmed correct A4
dimensions, consistent margins repeating correctly on every page, and the
`break-inside: avoid` rules keeping entries intact across page breaks — the
exact scenario the margin fix above was designed for. Bold text, links, and
the bordered education table all render correctly in the real PDF output,
not just the browser preview. That route and script were removed afterward;
nothing from it ships. The duplicate/clone logic was also re-verified with
its existing smoke test (fresh ids at every level — resume, section, entry,
bullet, nested bullet — with no id collisions, content preserved) before
that test was removed too.

The Prisma transaction code itself is still the one thing that can only be
exercised on your machine — worth trying the full loop once your database is
set up: create a resume, duplicate it, rename the copy, export both to PDF,
delete one.

## Checkpoint 7 — Polish (MVP complete)

Rounds out loading/error/empty states and responsiveness across the whole
app:

- **Loading states**: `app/dashboard/loading.tsx` and
  `app/editor/[id]/loading.tsx` provide skeleton UIs matching each page's
  real layout while server data loads, using Next's App Router `loading.tsx`
  convention (no extra client-side spinner logic needed).
- **Not-found / error states**: `app/not-found.tsx`,
  `app/editor/[id]/not-found.tsx` (a deleted-or-missing resume), and
  `app/error.tsx` (an unexpected error boundary with a "Try again" action)
  give every failure mode a real page instead of a blank screen or a raw
  Next.js error.
- **Empty states**: `components/ui/InlineEmptyState.tsx` is used inside the
  Education and Entries section editors ("No education added yet", "Nothing
  here yet") so a fresh section doesn't just look broken. `SectionSidebar`
  now also hints at the "+ Add Section" control when a resume has none.
  `Dashboard`'s existing empty state ("No resumes yet") was already in place
  from Checkpoint 6.
- **Save/export feedback**: already covered by earlier checkpoints
  (`SaveStatusBadge`, inline export-error messages) — Checkpoint 7 mainly
  extended the same pattern (a small inline error, not a blocking modal) to
  every action that touches the network.
- **Responsiveness**: `EditorShell` gets a real mobile treatment — a
  drawer-style sidebar (triggered by a hamburger button, matching the
  skeleton's `lg:hidden` behavior), the live preview pane hidden below `lg`
  (editing content takes the full width instead), and icon-only buttons
  where a text label would crowd a small header. `Dashboard`/`ResumeCard`
  and the section editors' field grids (`grid-cols-1 sm:grid-cols-2/3`) all
  collapse to a single column below `sm`. Desktop editing remains the
  priority per the spec, but nothing is unusable on a phone.
- A small layout-stability fix: `RichTextEditor` now renders a same-sized
  skeleton instead of `null` before Tiptap finishes its (deliberately
  deferred) first mount, so fields with several rich text editors on screen
  at once don't visibly jump into place.

### Two real bugs found and fixed this checkpoint

Auditing pre-existing work here (see the testing note below) turned up two
issues worth calling out specifically, since both would have shipped
unnoticed otherwise:

1. **A genuine PDF export bug**: `.classic-page` had an unconditional
   `min-height: 297mm`. Combined with Playwright's own per-page top/bottom
   margins (`lib/pdf/generateResumePdf.ts`), this made the content box
   taller than what actually fits on one printed page after those margins
   are subtracted — so **any short or empty resume silently exported with a
   blank trailing second page**. Confirmed by generating a real PDF for a
   near-empty resume (2 pages, second one entirely blank), fixed by making
   `min-height` apply only under `@media screen` (it's still needed there,
   so a short resume still fills an A4-shaped box in the live preview), and
   re-verified: the same resume now exports as 1 page, and the earlier
   3-page pagination test still produces byte-identical output — zero
   regression.
2. **A production-build hardening gap**: `next.config.ts` had no
   `serverExternalPackages` entry for `playwright`. Without it, Next may try
   to bundle Playwright's native bindings for the PDF API route, which is a
   well-known way for headless-browser-based PDF generation to break in a
   production build even though it works fine in dev. Added
   `serverExternalPackages: ["playwright"]`.

### Testing note for this checkpoint

Picking this checkpoint up, a substantial amount of polish work already
existed on disk — same pattern as Checkpoints 5 and 6, from turns outside
what's visible in the conversation history. Rather than assume it was
correct, everything was audited by reading the actual source, and several
things were verified by actually running them rather than just reading the
code:

- Re-ran the real `generateResumePdf()` function (not a reimplementation)
  against both a near-empty resume and the original heavy multi-page test
  content from Checkpoint 6, rasterizing each result to confirm the min-height
  fix above — this is what caught the bug in the first place.
- Re-ran the mobile/desktop editor and dashboard screenshots fresh against
  the current source rather than trusting existing screenshots at face
  value. This was the right call: one pre-existing screenshot showed a
  "Hide preview" button on mobile that turned out to be stale — the actual
  current code correctly hides it below `lg`. Re-generating confirmed the
  real behavior matches what the source says.
- Attempted a full production build (`next build`) with the new
  `serverExternalPackages` config to check for bundling regressions; it
  still fails at the type-check stage on the same unavoidable
  "Prisma client not generated" error as every other checkpoint (this
  sandbox has no route to Prisma's binary host — see above), so `next
  start` specifically couldn't be verified end-to-end here. `next build`
  did get far enough to confirm the config change introduces no new
  compile/bundle errors before hitting that gate.
- All temporary test routes, scripts, and screenshots (old and freshly
  regenerated alike) were removed before packaging; none of it ships.

## Setup

```bash
npm install
npx playwright install chromium   # PDF export needs this once
npx prisma generate
npx prisma db push   # creates dev.db (SQLite) from the schema
npm run dev
```

Then open http://localhost:3000.

> **Note:** `npx prisma generate` needs to reach `binaries.prisma.sh` to
> download its query engine. This was built in a sandboxed environment
> without access to that host, so Prisma generation/migration could not be
> tested here — it will work normally on a machine with standard internet
> access. Everything else in this checkpoint was type-checked
> (`npx tsc --noEmit`) with zero errors other than the expected
> "PrismaClient not generated yet" error.

## Moving to Postgres later

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

and set `DATABASE_URL` in `.env` to your Postgres connection string, then
`npx prisma migrate dev`. No other code changes are required — every field
in the schema was chosen to be valid on both providers.

## Project structure

```text
app/
  dashboard/    the resume list (Checkpoint 6)
  editor/[id]/  the editor (Checkpoints 2-4)
  print/[id]/   chrome-free route used only by PDF generation (Checkpoint 5)
  api/resumes/  CRUD + duplicate + pdf routes
components/
  dashboard/    Dashboard, ResumeCard — Checkpoint 6
  editor/       sidebar, section editors, rich-text editor — Checkpoints 2-3
  preview/      live A4 preview — Checkpoint 4
  resume/       RichTextDoc -> JSX renderer, shared by every template
  ui/           small shared primitives (Button, Field, SaveStatusBadge)
templates/      the template registry + each template's component
  classic/      the first template — see templates/types.ts for the contract
  types.ts      the contract every template implements
lib/
  db/           Prisma client singleton
  auth.ts       local-user stub, swap for real auth later
  pdf/          Playwright PDF generation — Checkpoint 5
  resume/       resume data helpers (serialize, sync/duplicate, validation, presentation)
  tiptap/       Tiptap extension config + custom font-size mark — Checkpoint 3
prisma/
  schema.prisma the data model
types/
  resume.ts     ResumeData and friends — the editor/template/PDF contract
```

## Roadmap / checkpoints

1. Foundation
2. Data + editor core
3. Rich text editing
4. Classic template + live A4 preview
5. PDF export
6. Resume dashboard
7. **Polish (loading/error/empty states, responsiveness)** ← all complete

Each checkpoint was delivered as a runnable project so progress was never
lost even when work stopped mid-build. The MVP defined in the original spec
(create/edit/save/preview/export resumes, template independent from
content, autosave, multi-resume management) is now fully built — see
"Suggested next steps" below for what's reasonable to tackle after this.

## Suggested next steps

Nothing here is required — the MVP is complete per the original spec. A few
things worth knowing if you keep building on this:

- **Real auth**: `lib/auth.ts` is the one function to change (see its
  comments) — swap the seeded local user for a real session lookup and
  every route/query downstream keeps working unmodified.
- **A second template**: drop a new folder under `templates/`, implement
  the `ResumeTemplateComponent` contract (`templates/types.ts`), register it
  in `templates/index.ts`. No changes needed to the editor, database, or PDF
  route — that decoupling was the core architectural requirement from the
  start.
- **Postgres**: see "Moving to Postgres later" above.
- **Per-user PDF auth**: if real auth is added, `app/print/[id]/page.tsx`
  has a comment on exactly what needs to change (Playwright navigates as an
  unauthenticated browser context today, which only works because there's
  currently just one seeded user).
=======
# resume-builder
Simple Resume Builder
>>>>>>> ca0f6a6f65fb57add7ed2f8b3618a79475379334
