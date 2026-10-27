# CLAUDE.md — Digital Bookshelf project memory

> This file is working memory for this project. Read it in full before
> touching any file, and update it whenever something structural changes
> (decisions, data model, scope, vocabulary).

Last updated: 2026-10-27 — visual pass (shared `Button` component, CSS
animation system), a full translation of all user-facing text back to
English (reversing the earlier French pass), and a working invitations +
notifications system (search a user, invite them to a shelf, they get a live
envelope-style notification and can accept/decline) all built and
browser-tested end to end. See §6 for the identity model and §3's
"local-first, no backend" note for the invitations system's real constraint
(same-browser only).

Location: `C:\Projet Digital Bookshelf` — a sibling folder to the unrelated
`C:\Projet Tactical Rythm` game project, chosen because the request came in
while that was the working directory. An older, abandoned single-collection
prototype for a similar idea lives at `C:\projet vinyle` ("Vinylthèque":
React+Vite/JS, Express, SQLite, vinyl-only, real auth with JWT+bcrypt) — not
reused, but worth knowing about since it validated `node:sqlite` on this
machine before this project dropped its own backend (see §2).

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
**Members** (member list + a working "invite someone" search-and-send flow,
see §7).

**All user-facing text is in English.** Code identifiers, comments and commit
messages stay in English too — the whole app is English end to end. (This
reverses the earlier French-translation decision; see §10.)

## 2. Stack and why

| | |
|---|---|
| Frontend | React 18 + TypeScript, built with Vite |
| Backend | **none** — see below |
| "Database" | A single JSON blob in the browser's `localStorage` |

There used to be a Node + Express + `node:sqlite` backend (first build). It
was deliberately removed in favor of a **local-first** architecture: the
entire app runs as a static client, and `client/src/lib/localStore.ts` plays
the role of both API and database — it keeps one JSON object in
`localStorage` (key `digital-bookshelf.local-db.v1`, see
`LOCAL_DB_STORAGE_KEY`) holding every user, shelf, item, history entry,
invitation and notification, and every `api/*.ts` wrapper just calls
straight into it (still shaped like async API calls — `Promise`-returning,
throwing `ApiError` — so swapping in a real backend later only means
rewriting those wrappers, not the rest of the app).

**The practical consequence to always keep in mind**: `localStorage` is
scoped to one browser *origin*, shared by every tab open on it, but never
shared across two different physical devices or browsers. Two accounts
"talking to each other" (an invitation, a notification) only actually work
when both accounts live in the same browser — e.g. two tabs, each logged in
as a different user. This was a deliberate, confirmed tradeoff (see §10) to
get working multi-user flows (search, invite, accept/decline, live
notifications) without standing up a real shared backend again. The
notification bell listens for the browser's native `storage` event (fired in
every *other* tab of the same origin when `localStorage` changes) so a
second tab sees a new invitation/notification arrive live, with no reload
and no polling.

No charting library either: `components/charts/BarChart.tsx` is a small
hand-rolled horizontal bar chart (flat HTML/CSS, one flat brand color,
value always shown at the bar's end) built per the dataviz skill's
guidance — bar, not pie, is the right default for "compare magnitude"
data, and a single-series chart needs no categorical palette. Revisit only
if a genuinely different chart form (true time series, multi-series
comparison) is needed later.

No UI/animation framework either: `components/common/Button.tsx` is the one
shared button component (variants `primary`/`secondary`/`danger`/`ghost`,
plus `as="link"` to render a react-router `Link` styled identically so a
*navigation* action still looks and feels like a button, not plain text),
and all motion is plain CSS `@keyframes`/`transition` defined once in
`client/src/styles/global.css` (see §3) — no framer-motion or similar.

## 3. Project structure

```
Digital Bookshelf/
├── CLAUDE.md
├── README.md
├── .claude/launch.json              dev-server config for the Browser pane (client, port 5173)
└── client/                         React + TypeScript, Vite — the entire app
    ├── package.json
    └── src/
        ├── main.tsx                 BrowserRouter + UserProvider + App
        ├── App.tsx                  routes: "/", "/create", "/shelves/:id", "/shelves/:id/edit"
        ├── api/                     thin wrappers around lib/localStore.ts — see below
        │   ├── httpClient.ts         ApiError, API_URL (kept as '' — no real host)
        │   ├── userApi.ts            register/login
        │   ├── fieldTypesApi.ts
        │   ├── fieldSuggestionsApi.ts
        │   ├── shelfApi.ts
        │   ├── itemsApi.ts
        │   └── notificationsApi.ts   searchUsers/sendInvitation/fetchNotifications/respondToInvitation/...
        ├── lib/
        │   ├── localStore.ts         THE local "database" — see below
        │   ├── recentShelves.ts      localStorage "shelves this browser has seen" (see §7)
        │   ├── statistics.ts         turns an item list into BarChart-ready data per dimension
        │   └── relativeTime.ts       "il y a 5 min"-style formatting for notifications
        ├── types/
        │   ├── shelf.ts              app-wide data shapes (SavedItem, Invitation, AppNotification...)
        │   └── shelfForm.ts          local wizard-only draft shapes (uiId, raw option text)
        ├── context/
        │   └── UserContext.tsx       session (login/logout), see §6
        ├── pages/
        │   ├── HomePage.tsx           CTA + "Your shelves" list
        │   ├── CreateShelfPage.tsx   orchestrates the whole creation/edit form + validation + submit
        │   └── ShelfPage.tsx         the shelf itself: header + Objets/Statistiques/Membres tabs
        └── components/
            ├── common/
            │   └── Button.tsx         shared button (variants + `as="link"`), see §2
            ├── layout/AppLayout.tsx  header (brand, NotificationBell, signed-in-as), page shell
            ├── identity/
            │   └── AuthScreen.tsx     login/register screen, see §6
            ├── notifications/        the invite/notification UI, see §7
            │   ├── NotificationBell.tsx    badge + storage-event live refresh
            │   ├── NotificationPanel.tsx   the dropdown list
            │   └── NotificationCard.tsx    one "envelope" card (+ Accept/Decline for invites)
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
            │   ├── ItemHistoryDialog.tsx  fetches + renders history for one item
            │   ├── FieldValueInput.tsx    data-entry input per field type (text/number/date/list/person/photo)
            │   ├── FieldValueDisplay.tsx  read-only per-field-type cell renderer
            │   ├── Modal.tsx              shared overlay+dialog shell (scale/fade entrance)
            │   ├── StatisticsTab.tsx      dimension picker + BarChart/table toggle
            │   └── PeopleTab.tsx          member list + "Inviter quelqu'un" search dialog
            └── charts/
                └── BarChart.tsx      single-series horizontal bar chart, see §2
```

Styling: plain CSS Modules (`*.module.css` next to each component), no UI
framework. Design tokens (colors, radii, shadows, transition durations) are
CSS variables in `client/src/styles/global.css`, which also defines the
shared `@keyframes` used across the app (`fadeIn`, `fadeInUp`, `scaleIn`,
`slideDown`, `popIn`, `shake`, `flashHighlight`) behind a
`prefers-reduced-motion` guard — a warm "bookshelf" palette (cream
background, brown/amber accents), plus `--color-chart-*` tokens for
BarChart. No dark mode yet.

### Architecture notes
- **`lib/localStore.ts` is the single source of truth.** It owns one
  in-memory-shaped `LocalDb` object (`users`, `shelves`, `items`, `history`,
  `invitations`, `notifications`, plus per-table id counters), loaded from
  and saved back to `localStorage` on every read/write (`loadDb()`/
  `saveDb()`). `migrateDb()` backfills new fields (e.g. `invitations`) onto
  a DB blob saved before they existed, so upgrading the app never loses a
  user's local data. `createSeedDb()` seeds a first-run demo account
  (`demo`/`demo`) with one sample shelf.
- **`api/*.ts` stay API-shaped on purpose**: every exported function still
  returns a `Promise` and throws `ApiError` on failure, even though nothing
  crosses the network. This is the seam for a future real backend —
  `localStore.ts` is the only file that would need replacing.
- The client never hardcodes the list of field types: `FIELD_TYPES` lives
  once in `localStore.ts` (it used to be server-authoritative; now it's just
  the one place in the whole app), and `fieldTypesApi.ts` re-exports it —
  still a single source of truth, just no longer over HTTP.
- **Uploaded images (shelf icon, item photos) are stored as base64 data
  URLs** directly inside the `LocalDb` blob (`fileToDataUrl()`), since
  there's no server to receive a file upload to disk anymore. This is fine
  at prototype scale but means large/many images will bloat `localStorage`
  faster than they would have on disk — worth watching if a shelf
  accumulates a lot of photos (`localStorage` is typically capped around
  5–10MB per origin by the browser).
- "Reuse a criterion" suggestions have no dedicated template table: they're
  computed with a `Map`-based dedupe over every field that exists across
  every shelf in the local DB (`getFieldSuggestions()`), merged client-side
  in `ItemTypeList.tsx` with fields already typed into *other* item types
  in the current draft (so reuse works both across shelves and within the
  one being created, before it's even saved).
- **Items are soft-deleted** (`deletedAt`), never hard-deleted — history
  entries reference `itemId` and need something to attach to even after a
  "deleted" event. Item listing always filters out items with `deletedAt`
  set.
- **Item field values are loosely typed** in `LocalItem.values` (a
  `Record<fieldId, string | number | null>`); typing happens at the edges —
  `toSavedValue()` turns a stored value into a real `number` or a resolved
  `{id, displayName}` for `person` fields when reading, and
  `parseFieldValue()` validates and coerces an incoming raw string (per the
  field's `fieldType`) back down before writing.
- **History stores human-readable snapshots**, not ids to re-resolve later:
  a `person` field's old/new value is written as the member's display name
  at the time of the change (`toDisplayValue()`), not their user id. Simpler
  reads, and correct by construction since there's no rename feature to
  cause drift.
- **No dedicated statistics computation path.** `StatisticsTab` reuses the
  same item list the Items tab fetches and slices it client-side
  (`lib/statistics.ts`) by whichever field (or "Added by") the reader
  picks. Fine at this data scale; revisit if a shelf ever has enough items
  that shipping the full list client-side is the bottleneck.
- **Invitations and notifications, mechanically**: `sendInvitation()`
  creates a `LocalInvitation` (`status: 'pending'`) and a
  `LocalNotification` (`type: 'invite_received'`) for the recipient in one
  write. `respondToInvitation()` flips the invitation's status, adds the
  responder to `shelf.memberUserIds` on accept, and writes a notification
  back to the original sender (`invite_accepted`/`invite_declined`). A
  notification's `invitationStatus` is resolved live from the current
  invitation record at read time (not cached on the notification itself),
  so a card correctly stops offering Accept/Decline once any tab has
  already acted on it. `NotificationBell` re-fetches on mount and on every
  `storage` event; opening the panel calls `markNotificationsRead()`.

## 4. Data model (current — all inside the one `LocalDb` blob)

```ts
LocalUser          { id, username, displayName, passwordHash, createdAt }
LocalShelf         { id, name, icon, createdBy, createdAt, memberUserIds[], itemTypes[] }
LocalItemType      { id, name, fields: LocalField[] }
LocalField         { id, label, fieldType, isRequired, listOptions }
LocalItem          { id, shelfId, itemTypeId, createdBy, createdAt, deletedAt, values }
LocalHistoryEntry  { id, shelfId, itemId, changeType, fieldLabel, oldValue, newValue, changedBy, changedAt }
LocalInvitation    { id, shelfId, fromUserId, toUserId, status, createdAt, respondedAt }
LocalNotification  { id, userId, type, shelfId, actorUserId, invitationId, createdAt, readAt }
```

`icon` is `{ type: 'emoji', value, bgColor }` or `{ type: 'image', value:
<data URL>, bgColor: null }` — the `bgColor` swatch is only meaningful
behind an emoji (together they form the shelf's "image").

The "added by" field (`items.createdBy`) is system metadata, never a row in
an item type's `fields` — automatic and immutable, unlike a user-defined
`person`-type criterion (e.g. "Owner"), which IS just an ordinary field
whose value happens to be a member's user id.

## 5. Field types (the criteria system)

A field type is what the shelf creator picks when defining a criterion
(e.g. "Author" is a Text criterion, "Price" is a Number criterion). Defined
once, in `localStore.ts`'s `FIELD_TYPES`:

| id | Shown as | Use it for |
|---|---|---|
| `text` | Text | A short line, e.g. a title or an author name |
| `number` | Number | Any numeric value — price, page count, volume number... |
| `date` | Date | A calendar date, e.g. purchase date |
| `list` | Option list | A fixed set of choices, e.g. a genre (needs `listOptions`) |
| `photo` | Photo | An image, e.g. a cover photo |
| `person` | Person | A reference to someone on the shelf, e.g. a real-world owner or borrower |

User-friendly labels were a deliberate requirement (Louis's spec: show
"Price"-style plain language, not raw type jargon like "double"). The
*criterion's own name* (e.g. "Price", "Author", "Purchase date") is whatever
the shelf creator types as the field's `label` — the `fieldType` dropdown
only needs to name the underlying kind of value, which is what the table
above does.

`person` is wired to a real picker (`FieldValueInput.tsx` renders a
`<select>` of the shelf's current members) — **a `person` field is
restricted to existing shelf members only**, no free text. Now that
inviting/joining a shelf is real (§7), this picker's pool grows as people
accept invitations.

Every field also has `isRequired` (boolean) and, for `list` only,
`listOptions` (string array, parsed client-side from a comma-separated
input). `photo` is excluded from the Statistics tab's dimension picker
(not meaningful to chart).

## 6. Identity

`AuthScreen.tsx` is a real login/register screen (username + password,
register also asks for a display name). Passwords are hashed client-side
with `SHA-256` (`crypto.subtle.digest`, no salt) before being stored in the
local DB — **this is not real security** (no salt, fully client-side, no
server to keep the hash away from the data it's protecting), but it's a
step up from the old free-typed-display-name model and enough for a
single-device local-first prototype. `UserContext` persists the logged-in
user as JSON under `localStorage` key `digital-bookshelf.session`
(`loginSession()`/`logout()`); `App.tsx` shows `AuthScreen` whenever there's
no session. A first-run browser gets a seeded demo account: username
`demo`, password `demo`.

Because the session key lives in the same shared `localStorage`, **logging
in on one tab changes which account a *different* tab will resume as the
next time that tab reloads** (each tab's React state stays whichever user
it mounted as until it reloads) — expected behavior for this local-first
model, not a bug; keep it in mind when testing multi-account flows with
several tabs of the same browser.

## 7. How a shelf gets created, used, and shared (current flow)

1. Home page (`/`) — pitch + "Create a shelf" CTA, plus a **"Your
   shelves"** list. Today this is `fetchShelves()` → every shelf in the
   local DB, not filtered by membership (a shelf you were just invited to,
   or any other shelf, shows up the same way) — see §8, this is a known
   gap, not something the invitations work fixed.
2. `/create` (also used for editing, `mode="edit"`) — one scrollable form:
   - **Name and icon**: text input; emoji (curated grid + free-text
     fallback, *plus* a background-color swatch picker) or an uploaded
     photo (stored as a data URL, see §3).
   - **Item types**: one card per item type (e.g. "Book", "Manga"). Each
     card has a name and a list of criteria. "Reuse a criterion" chips
     suggest fields already used elsewhere; "+ Add another item
     type" appends another card.
3. Client-side validation (name required, ≥1 item type, every item type
   needs a name and ≥1 field, every field needs a label, `list` fields need
   ≥1 option) before submitting, with an immediate, specific error message.
4. On success the app navigates straight to `/shelves/:id` — no separate
   confirmation screen.
5. **The shelf page** (`ShelfPage.tsx`) has a header (`ShelfIcon` + name,
   "Back to shelves"/"Edit shelf" as real buttons) and three
   tabs:
   - **Items** (`ItemsTab.tsx`) — item table (one column per field, plus
     "Added by" and Edit/History/Remove actions), and
     "+ Add <type>" opening `ItemFormDialog`. A just-created row gets a
     brief highlight-flash animation. Removing asks `window.confirm` first
     and soft-deletes; every create/update writes a history entry.
   - **Statistics** (`StatisticsTab.tsx`) — pick an item type and a
     dimension ("Added by", or any non-`photo` field) and get an instant
     `BarChart`, with a "Show as table" toggle for the same data as a
     plain table (accessibility).
   - **Members** (`PeopleTab.tsx`) — the member list, plus a working
     **"Invite someone"** button: opens a search dialog
     (`searchUsers()`, debounced, matches display name or username,
     excludes current members and yourself), each result gets an "Invite"
     button that calls `sendInvitation()` and flips to a "✓ Invitation
     sent" confirmation. The invited person sees it land live in their
     own `NotificationBell` (if they're in another tab of the same
     browser — see §3's local-first constraint) as an envelope-styled card
     with Accept/Decline buttons; accepting adds them to
     `shelf.memberUserIds` immediately and notifies the inviter back.

Limits (arbitrary, mine, flag if wrong): shelf name ≤ 60 chars, field label
≤ 40 chars, ≤ 10 item types per shelf, ≤ 20 fields per item type, icon/photo
image ≤ 5MB (png/jpg/jpeg/webp/gif only), item text-field value ≤ 500 chars.

## 8. Known gaps / roadmap

Not built yet, roughly in the order they'd naturally come next:
- **Home page shelf list isn't membership-filtered** — `listShelves()`
  returns every shelf in the local DB regardless of whether the current
  user is a member. Pre-existing, not something this pass's invitations
  work changed; worth fixing now that membership is meaningful (accepting
  an invite actually changes who's a member of what).
- **Invitations/notifications only work within one browser** — see §2/§3.
  A real cross-device version needs an actual shared backend (the one that
  was removed, or something hosted) plus real multi-device auth; out of
  scope for a local-first prototype unless that tradeoff changes.
- **Real authentication** — client-side unsalted SHA-256 in `localStore.ts`
  (§6) is better than nothing but not a security model; a real backend
  would be needed before this app could safely leave "local prototype."
- **Removing a member from a shelf** — only adding members (via invite) is
  built; there's no "remove member" action yet in `PeopleTab`.

## 9. Open questions

1. **Backend**: if/when this needs to work across real devices, is the plan
   to resurrect a real backend (Express+SQLite, or something hosted), or
   keep pushing the local-first model further (e.g. export/import, or a
   sync layer)?
2. **Home page scoping**: should "Your shelves" start filtering to shelves
   the current user is actually a member of now that membership is real
   (see §8), or is "every local shelf" still useful for solo testing?
3. **Limits** in §7 (name length, max item types/fields, image size, text
   value length) are my own arbitrary picks — adjust if they don't fit real
   collections.
4. Should the shelf's own icon and a per-item `photo` criterion share more
   than just the underlying `fileToDataUrl()` mechanism (e.g. a shared
   gallery/picker UI), or are they fine staying conceptually separate?
5. **Statistics depth**: today it's one dimension at a time (count-by or
   value-per-item). Worth a two-dimension breakdown (e.g. Genre *by*
   Owner) later, or does that cross into "just use the table view"
   territory?

## 10. Decisions already made — don't re-litigate

1. React + TypeScript, Vite — no backend anymore. The original Node +
   Express + `node:sqlite` backend was removed in favor of a fully
   local-first app (`lib/localStore.ts` as the "database", see §2/§3).
2. **All user-facing text is in English**, same as the code and comments —
   the whole app is English end to end. This reverses an earlier
   "French UI text" decision — explicit, deliberate change (2026-10-27).
3. Invitations/notifications are built on the shared local `LocalDb` blob,
   not a real backend — confirmed tradeoff: works between accounts in the
   same browser (e.g. two tabs), not across physical devices. The
   alternative (rebuild a real shared backend) was explicitly rejected for
   this pass as disproportionate to a local-first prototype.
4. `FIELD_TYPES` lives once in `localStore.ts`; the rest of the app reads
   it from there rather than keeping a second hand-maintained copy.
5. "Reuse a criterion" suggestions are computed from existing data, not a
   separate template table.
6. Username + password identity (`AuthScreen`) with client-side hashing —
   a deliberate step up from the old free-typed-display-name model, still
   explicitly not a real security model (§6, §8, §9.1).
7. Plain CSS Modules, no UI/CSS/animation framework — a shared `Button`
   component (§2) and a small set of global `@keyframes` in `global.css`
   are enough.
8. Single-page creation form, not a multi-step wizard — simpler to build
   and validate for this amount of content.
9. Items are soft-deleted (`deletedAt`), never hard-deleted — keeps history
   entries attachable without needing cascade-delete semantics.
10. No charting library — a hand-rolled single-series `BarChart` is enough
    for "any criterion, or people" and keeps the dependency list small (§2).
11. No dedicated statistics computation path — computed client-side from
    the same item list the Items tab already fetches (§3).
12. Uploaded images are stored as base64 data URLs inside the local DB
    blob, not on a filesystem — there's no server left to receive a file
    upload to disk (§3).
