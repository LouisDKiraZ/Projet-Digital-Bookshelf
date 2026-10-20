# CLAUDE.md — Digital Bookshelf project memory

> This file is working memory for this project. Read it in full before
> touching any file, and update it whenever something structural changes
> (decisions, data model, scope, vocabulary).

Last updated: 2026-10-19 — item management (add/edit/remove, with visible
history), the shelf page's three-tab layout (Items / Statistics / People),
client-side statistics charts, emoji+background-color shelf icons, and a
local "recent shelves" list all built and browser-tested end to end. People
tab is a read-only stub — inviting/removing members is explicitly deferred
(Louis's call, see §8). No join flow, no real auth yet — see "Known gaps"
below.

Location: `C:\Projet Digital Bookshelf` — a sibling folder to the unrelated
`C:\Projet Tactical Rythm` game project, chosen because the request came in
while that was the working directory. An older, abandoned single-collection
prototype for a similar idea lives at `C:\projet vinyle` ("Vinylthèque":
React+Vite/JS, Express, SQLite, vinyl-only, real auth with JWT+bcrypt) — not
reused, but worth knowing about since it validated `node:sqlite` on this
machine and the client/server folder split.

---

## 1. Concept

Users create or join a **shared shelf** with other people to catalog a
collection together — books, vinyls, manga, board games, anything. A shelf
defines what kinds of objects it can hold (its "item types") and, for each
item type, exactly which criteria matter (author, genre, price, purchase
date, a photo, who owns the physical copy...). Every item on a shelf can
later be edited, and every edit is kept in a visible history. Who originally
added an item is permanent, system-tracked metadata — never user-editable,
and distinct from any user-defined "owner"-style criterion.

A shelf page has three parts: **Items** (browse/add/edit/remove, with
history), **Statistics** (charts over any criterion or over people), and
**People** (currently a read-only member list — invite/remove is future
work).

**All code and all player/user-facing text are in English.**

## 2. Stack and why

| | |
|---|---|
| Frontend | React 18 + TypeScript, built with Vite |
| Backend | Node.js + Express (plain JS, ES modules — not TypeScript) |
| Database | SQLite via `node:sqlite` (Node's built-in driver, Node 24+) |

`node:sqlite` was picked over `better-sqlite3` specifically to avoid any
native/node-gyp build step on Windows — confirmed working: synchronous
`prepare().run()/.get()/.all()`, foreign keys enforced via
`new DatabaseSync(path, { enableForeignKeyConstraints: true })`. It's still
flagged experimental by Node (prints an `ExperimentalWarning` on startup);
revisit if a future Node LTS changes its API.

No ORM, no migration framework yet: `server/src/db/schema.js` runs
`CREATE TABLE IF NOT EXISTS` at startup, plus a small `ensureColumn()`
helper (`ALTER TABLE ... ADD COLUMN` guarded by a `PRAGMA table_info`
check) for columns added after a table already existed — used today for
`shelves.icon_bg_color`, so an existing local dev database picks up new
columns without losing its data. Fine while the schema is this young;
replace both with real migrations once it needs to evolve data in place
beyond "add a table/column".

No charting library either: `components/charts/BarChart.tsx` is a small
hand-rolled horizontal bar chart (flat HTML/CSS, one flat brand color,
value always shown at the bar's end) built per the dataviz skill's
guidance — bar, not pie, is the right default for "compare magnitude"
data, and a single-series chart needs no categorical palette. Revisit only
if a genuinely different chart form (true time series, multi-series
comparison) is needed later.

## 3. Project structure

```
Digital Bookshelf/
├── CLAUDE.md
├── README.md
├── .claude/launch.json              dev-server config for the Browser pane (client, port 5173)
├── server/                         Express API, plain JS, ESM
│   ├── package.json
│   ├── .env.example                 PORT, CLIENT_ORIGIN
│   ├── data/                        gitignored: bookshelf.sqlite + uploads/
│   └── src/
│       ├── index.js                 entry point: express app, static /uploads, listen
│       ├── config.js                the ONE place reading process.env
│       ├── constants/
│       │   └── fieldTypes.js        FIELD_TYPES — server-authoritative, see §5
│       ├── db/
│       │   ├── connection.js        DatabaseSync handle + runInTransaction()
│       │   └── schema.js            CREATE TABLE IF NOT EXISTS + ensureColumn() migrations
│       ├── repositories/            one file per table group, raw SQL only
│       │   ├── usersRepository.js
│       │   ├── shelvesRepository.js   + listShelfMembers()
│       │   ├── itemsRepository.js     items CRUD, value formatting, history writes
│       │   └── fieldSuggestionsRepository.js
│       ├── controllers/             request parsing/validation + response shaping
│       │   ├── usersController.js
│       │   ├── shelvesController.js   + getMembers
│       │   ├── itemsController.js     per-field-type value validation (parseValues)
│       │   └── fieldSuggestionsController.js
│       ├── middleware/
│       │   ├── shelfIconUpload.js   multer config for the shelf's own icon (fixed field name)
│       │   ├── itemPhotoUpload.js   multer .any() for item `photo` fields (dynamic field names)
│       │   └── errorHandler.js
│       └── routes/                  thin: just wires path -> controller
│           ├── shelvesRouter.js       mounts itemsRouter at /:shelfId/items
│           └── itemsRouter.js         mergeParams: true
└── client/                         React + TypeScript, Vite
    ├── package.json
    ├── .env.example                 VITE_API_URL
    └── src/
        ├── main.tsx                 BrowserRouter + UserProvider + App
        ├── App.tsx                  routes: "/", "/create", "/shelves/:id"
        ├── vite-env.d.ts
        ├── api/                     one fetch wrapper per resource, all go through httpClient.ts
        │   ├── httpClient.ts         apiGet/apiPostJson/apiPostForm/apiPatchForm/apiDelete, ApiError, API_URL
        │   ├── userApi.ts
        │   ├── fieldTypesApi.ts
        │   ├── fieldSuggestionsApi.ts
        │   ├── shelfApi.ts           + fetchShelfMembers
        │   └── itemsApi.ts           fetchItems/createItem/updateItem/deleteItem/fetchItemHistory
        ├── lib/
        │   ├── recentShelves.ts      localStorage "shelves this browser has seen" (see §7)
        │   └── statistics.ts         turns an item list into BarChart-ready data per dimension
        ├── types/
        │   ├── shelf.ts              mirrors the API's JSON shapes (SavedItem, ItemHistoryEntry, ShelfMember...)
        │   └── shelfForm.ts          local wizard-only draft shapes (uiId, raw option text)
        ├── context/
        │   └── UserContext.tsx       lightweight identity, see §6
        ├── pages/
        │   ├── HomePage.tsx           CTA + "Your shelves" (recentShelves) list
        │   ├── CreateShelfPage.tsx   orchestrates the whole creation form + validation + submit
        │   └── ShelfPage.tsx         the shelf itself: header + Items/Statistics/People tabs
        └── components/
            ├── layout/AppLayout.tsx  header (brand, signed-in-as), page shell
            ├── identity/DisplayNamePrompt.tsx
            ├── shelf/
            │   └── ShelfIcon.tsx      shared emoji+bgColor-tile-or-image renderer
            ├── shelf-form/           the creation wizard's building blocks
            │   ├── ShelfIconPicker.tsx    emoji/image tab toggle + live ShelfIcon preview
            │   ├── EmojiPicker.tsx        curated grid + free-text fallback
            │   ├── ColorSwatchPicker.tsx  curated swatches + native color input (emoji bg only)
            │   ├── ItemTypeList.tsx       manages the array of item types, computes suggestions
            │   ├── ItemTypeEditor.tsx     one item type card: name + its fields
            │   ├── FieldEditor.tsx        one criterion row: label, type select, required, options
            │   └── FieldSuggestions.tsx   "reuse a criterion" chips
            ├── shelf-view/           the shelf page's three tabs + their dialogs
            │   ├── ItemTypeSwitcher.tsx   shared item-type picker (Items tab + Statistics tab)
            │   ├── ItemsTab.tsx           item table, add/edit/remove, wires the dialogs below
            │   ├── ItemFormDialog.tsx     add/edit form, one input per field (via FieldValueInput)
            │   ├── ItemHistoryDialog.tsx  fetches + renders item_history for one item
            │   ├── FieldValueInput.tsx    data-entry input per field type (text/number/date/list/person/photo)
            │   ├── FieldValueDisplay.tsx  read-only per-field-type cell renderer
            │   ├── Modal.tsx              shared overlay+dialog shell
            │   ├── StatisticsTab.tsx      dimension picker + BarChart/table toggle
            │   └── PeopleTab.tsx          read-only member list (stub, see §8)
            └── charts/
                └── BarChart.tsx      single-series horizontal bar chart, see §2
```

Styling: plain CSS Modules (`*.module.css` next to each component), no UI
framework. Design tokens (colors, radii, shadows) are CSS variables in
`client/src/styles/global.css` — a warm "bookshelf" palette (cream
background, brown/amber accents), plus `--color-chart-*` tokens for
BarChart. No dark mode yet.

### Architecture notes
- The client never hardcodes the list of field types: it fetches
  `GET /api/field-types` at the start of the creation flow and renders
  whatever the server returns. `server/src/constants/fieldTypes.js` is the
  only place that list is defined (also feeds the DB's CHECK constraint and
  request validation) — this was a deliberate choice to avoid a
  client/server copy drifting apart, same spirit as Tactical Rythm's
  "mirror the two files in the same prompt" rule but solved by not having
  two copies at all.
- `POST /api/shelves` is multipart (`multer`) because it can carry an image
  file; it creates the shelf, its membership row, every item type and every
  field in one SQLite transaction (`runInTransaction` in
  `db/connection.js` — manual `BEGIN`/`COMMIT`/`ROLLBACK`, since
  `node:sqlite` has no built-in `.transaction()` helper the way
  `better-sqlite3` does).
- "Reuse a criterion" suggestions have no dedicated template table: they're
  just `SELECT DISTINCT label, field_type, list_options FROM
  item_type_fields` (`fieldSuggestionsRepository.js`), merged client-side
  in `ItemTypeList.tsx` with fields already typed into *other* item types
  in the current draft (so reuse works both across shelves and within the
  one being created, before it's even saved).
- **Items are soft-deleted** (`items.deleted_at`), never hard-deleted —
  `item_history` rows reference `item_id` with no `ON DELETE CASCADE`, and
  SQLite's default `NO ACTION` foreign-key behavior would block a real
  delete while history rows still point at it. Soft-delete also means the
  "deleted" history entry itself has something to attach to. Item listing
  always filters `deleted_at IS NULL`.
- **Item field values are untyped TEXT** in `item_field_values`
  (one row per `item_id`+`field_id`); typing happens at the edges —
  `itemsRepository.js`'s `toApiValue()` turns a stored string into a real
  `number` or into a resolved `{id, displayName}` for `person` fields when
  serving the API, and `itemsController.js`'s `parseValues()` validates
  and coerces an incoming raw value (per the field's `fieldType`) back down
  to the string that gets stored.
- **`item_history` stores human-readable snapshots**, not foreign keys to
  re-resolve later: a `person` field's old/new value is written as the
  member's display name at the time of the change (`toDisplayValue()` in
  `itemsRepository.js`), not their user id. Simpler reads, and correct by
  construction since there's no rename feature to cause drift.
- **No dedicated statistics endpoint.** `StatisticsTab` reuses the same
  `GET /api/shelves/:id/items?itemTypeId=` list the Items tab fetches and
  slices it client-side (`lib/statistics.ts`) by whichever field (or
  "Added by") the reader picks. Fine at this data scale; revisit if a shelf
  ever has enough items that shipping the full list client-side is the
  bottleneck.
- A `photo`-type field's upload field name is `photo_<fieldId>` (handled by
  `itemPhotoUpload.js`'s `multer().any()`, since the set of possible field
  names is dynamic per item type) — distinct from the shelf's own icon
  upload, which keeps `shelfIconUpload.js`'s fixed `iconImage` field name.

## 4. Data model (current)

```sql
users            (id, display_name UNIQUE, created_at)
shelves          (id, name, icon_type 'emoji'|'image', icon_value, icon_bg_color, created_by -> users, created_at)
shelf_members    (shelf_id -> shelves, user_id -> users, joined_at)
item_types       (id, shelf_id -> shelves, name, sort_order)
item_type_fields (id, item_type_id -> item_types, label, field_type, is_required, list_options JSON, sort_order)
items            (id, item_type_id -> item_types, created_by -> users [immutable], created_at, deleted_at)
item_field_values(item_id -> items, field_id -> item_type_fields, value TEXT)  -- PK (item_id, field_id)
item_history     (id, item_id -> items, change_type 'created'|'updated'|'deleted', field_label,
                   old_value, new_value, changed_by -> users, changed_at)
```

`icon_bg_color` is only meaningful when `icon_type = 'emoji'` (the color
swatch behind the emoji — together they form the shelf's "image"); it's
`NULL` for an uploaded-image icon, and also `NULL` on shelves created
before this column existed (the client falls back to a default swatch —
see `ShelfIcon.tsx`).

Uploaded shelf icons live at `server/data/uploads/shelf-icons/<uuid>.<ext>`
and are served at `/uploads/shelf-icons/<uuid>.<ext>`; uploaded item photos
live at `server/data/uploads/item-photos/<uuid>.<ext>`, served the same way.

The "added by" field is system metadata on `items` itself, never a row in
`item_type_fields` — it's automatic and immutable, unlike a user-defined
`person`-type criterion (e.g. "Owner"), which IS just an ordinary field
whose value happens to be a `shelf_members` user id.

## 5. Field types (the criteria system)

A field type is what the shelf creator picks when defining a criterion
(e.g. "Author" is a Text criterion, "Price" is a Number criterion). Defined
once, in `server/src/constants/fieldTypes.js`:

| id | Shown as | Use it for |
|---|---|---|
| `text` | Text | A short line, e.g. a title or an author name |
| `number` | Number | Any numeric value — price, page count, volume number... |
| `date` | Date | A calendar date, e.g. purchase date |
| `list` | List of options | A fixed set of choices, e.g. a genre (needs `listOptions`) |
| `photo` | Photo | An image, e.g. a cover photo |
| `person` | Person | A reference to someone on the shelf, e.g. a real-world owner or borrower |

User-friendly labels were a deliberate requirement (Louis's spec: show
"Price"-style plain language, not raw type jargon like "double"). The
*criterion's own name* (e.g. "Price", "Author", "Purchase date") is
whatever the shelf creator types as the field's `label` — the `fieldType`
dropdown only needs to name the underlying kind of value, which is what the
table above does.

`person` is now wired to a real picker (`FieldValueInput.tsx` renders a
`<select>` of `GET /api/shelves/:id/members`) — resolved answer to §9's old
open question #3: **a `person` field is restricted to existing shelf
members only**, no free text. Revisit once "join a shelf" exists and
members are more than just the creator.

Every field also has `isRequired` (boolean) and, for `list` only,
`listOptions` (string array, parsed client-side from a comma-separated
input). `photo` is excluded from the Statistics tab's dimension picker
(not meaningful to chart).

## 6. Identity (not real auth)

There's no login, no password, yet. `UserContext` asks for a display name
once (`DisplayNamePrompt`), persists it in `localStorage`
(`digital-bookshelf.displayName`), and finds-or-creates a row in `users` by
exact name match (`POST /api/users/identify`). This is enough to attribute
a shelf to its creator and give it a members list, without building real
accounts yet. **It is not secure**: anyone who types an existing display
name becomes that user. Fine for a single-developer local-first prototype,
not fine to ship. See §8 and §9.

## 7. How a shelf gets created and used (current flow)

1. Home page (`/`) — pitch + "Create a shelf" CTA, plus a **"Your
   shelves"** list read from `lib/recentShelves.ts` (a `localStorage` array
   of `{id, name, icon}`, capped at 20, newest first). A shelf is
   remembered there the moment it's created *or* opened (`rememberShelf()`
   is called from both `CreateShelfPage` and `ShelfPage`) — this is the
   fix for "don't make me recreate a shelf to test again": it's purely a
   per-browser convenience list, not a real account, and a ✕ next to an
   entry only forgets it locally (`forgetShelf()`), it doesn't delete the
   shelf. There is still no real multi-device dashboard — see §8.
2. `/create` — one scrollable form, not a multi-step wizard:
   - **Name and icon**: text input; emoji (curated grid + free-text
     fallback, *plus* a background-color swatch picker — `ColorSwatchPicker.tsx`
     — since emoji + background color together are the shelf's "image";
     a live `ShelfIcon` preview sits next to the picker) or an uploaded
     photo (`<input type="file">`, preview via `URL.createObjectURL`).
   - **Item types**: one card per item type (e.g. "Book", "Manga"). Each
     card has a name and a list of criteria (`FieldEditor` rows: label,
     type, required checkbox, options input when the type is `list`).
     "Reuse a criterion" chips above "+ Add a criterion" suggest fields
     already used elsewhere (other item types in this draft, or any past
     shelf) — clicking one pre-fills a new row instead of starting blank.
     "+ Add another item type" appends another card.
3. Client-side validation mirrors the server's rules (name required, at
   least one item type, every item type needs a name and ≥1 field, every
   field needs a label, `list` fields need ≥1 option) before submitting, so
   the error message is immediate and specific.
4. `POST /api/shelves` (multipart) creates everything in one transaction;
   on success the app navigates to `/shelves/:id` — the shelf page itself,
   not a separate confirmation screen (the old `ShelfCreatedPage` was
   retired once the shelf page could actually do something).
5. **The shelf page** (`ShelfPage.tsx`) has a header (`ShelfIcon` + name)
   and three tabs:
   - **Items** (`ItemsTab.tsx`) — an `ItemTypeSwitcher` if the shelf has
     more than one item type, a table of items for the selected type (one
     column per field, via `FieldValueDisplay`, plus "Added by" and
     Edit/History/Remove actions), and "+ Add <type>" opening
     `ItemFormDialog` (one `FieldValueInput` per field). Removing asks
     `window.confirm` first and soft-deletes. Every create/update writes an
     `item_history` row (§4); "History" opens `ItemHistoryDialog`, newest
     first.
   - **Statistics** (`StatisticsTab.tsx`) — pick an item type and a
     dimension ("Added by", or any non-`photo` field) and get an instant
     `BarChart`: counts-per-value for text/list/person fields, counts
     bucketed by month for `date` fields, and the field's own value
     *per item* for `number` fields (e.g. compare every item's Price
     directly rather than counting). A "Show as table" toggle renders the
     same data as a plain `<table>` (accessibility — see §2's dataviz
     note). This is the "more accessible than Excel" ask: point at a
     criterion, get a chart, no pivot-table setup.
   - **People** (`PeopleTab.tsx`) — currently just lists
     `GET /api/shelves/:id/members`. Inviting/removing is explicitly
     deferred, see §8.

Limits (arbitrary, mine, flag if wrong): shelf name ≤ 60 chars, field label
≤ 40 chars, ≤ 10 item types per shelf, ≤ 20 fields per item type, icon/photo
image ≤ 5MB (png/jpg/jpeg/webp/gif only), item text-field value ≤ 500 chars.

## 8. Known gaps / roadmap

Not built yet, roughly in the order they'd naturally come next:
- **Inviting/removing people from a shelf** — `PeopleTab` only lists
  current members read-only. Explicitly deferred by Louis this pass ("tu
  feras ça une autre fois"); `shelf_members` and the People tab shell are
  both ready for it.
- **Join an existing shelf** (by code or invite link) — only creation
  exists, so right now a shelf's only member is ever its creator. Needed
  before "invite people" means anything.
- **A real multi-device shelf dashboard** — today "Your shelves" (§7) is a
  per-browser `localStorage` convenience list, not a synced account-backed
  list. Fine for solo dev testing, not for the real multi-person use case.
- **Real authentication** — the lightweight display-name identity in §6 is
  a stand-in, not a security model.

## 9. Open questions

1. **Identity**: is the free-typed-display-name approach (§6) acceptable
   to keep building on for a while, or should real accounts (password or
   magic link) be prioritized before "invite people" and a real dashboard,
   given multiple people will be editing the same shelf?
2. **Joining a shelf**: invite by code (like Tactical Rythm's room codes),
   by shareable link, or both?
3. ~~`person`-type criteria restricted to members or free text?~~ **Resolved
   (§5): restricted to existing shelf members only.**
4. **Limits** in §7 (name length, max item types/fields, image size, text
   value length) are my own arbitrary picks — adjust if they don't fit real
   collections.
5. Should the shelf's own icon and a per-item `photo` criterion share more
   than just the underlying upload mechanism (e.g. a shared gallery/picker
   UI), or are they fine staying conceptually separate?
6. **Statistics depth**: today it's one dimension at a time (count-by or
   value-per-item). Worth a two-dimension breakdown (e.g. Genre *by*
   Owner) later, or does that cross into "just use the table view"
   territory?

## 10. Decisions already made — don't re-litigate

1. React + TypeScript (frontend) / Node + Express in plain JS (backend) /
   SQLite via `node:sqlite` (not `better-sqlite3`, not Postgres) — per
   Louis's spec.
2. All code and user-facing text in English.
3. No ORM, no migration framework — `schema.js`'s `CREATE TABLE IF NOT
   EXISTS` (+ the small `ensureColumn()` helper for added columns) is
   enough until the schema needs real migrations.
4. `FIELD_TYPES` lives once on the server; the client fetches it rather
   than keeping a hand-maintained TypeScript copy.
5. "Reuse a criterion" suggestions are computed from existing data
   (`DISTINCT` query), not a separate template table.
6. Lightweight name-only identity now, real auth later (§6, §9.1).
7. Plain CSS Modules, no UI/CSS framework.
8. Single-page creation form, not a multi-step wizard — simpler to build
   and validate for this amount of content.
9. Items are soft-deleted (`deleted_at`), never hard-deleted — keeps
   `item_history` intact without fighting SQLite's FK behavior (§3).
10. No charting library — a hand-rolled single-series `BarChart` is enough
    for "any criterion, or people" and keeps the dependency list small (§2).
11. No dedicated statistics API — computed client-side from the same item
    list the Items tab already fetches (§3).
12. "Your shelves" is a per-browser `localStorage` list, not a real
    account-backed dashboard — explicitly a stopgap for solo dev testing
    until real auth + a real dashboard exist (§7, §8).
