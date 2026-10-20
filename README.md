# Digital Bookshelf

A web app for creating a shared shelf with other people and cataloging a
collection together (books, vinyls, or anything else you collect).

## Stack

| Side | Tech |
|---|---|
| Frontend | React 18 + TypeScript (Vite) |
| Backend | Node.js + Express |
| Database | SQLite (`node:sqlite`, built into Node 24) |

## Project structure

```
Digital Bookshelf/
├── CLAUDE.md           Project memory (read this for the full picture)
├── server/             Express API
│   ├── src/
│   │   ├── index.js            entry point
│   │   ├── config.js           env-driven constants
│   │   ├── constants/          FIELD_TYPES (shared source of truth)
│   │   ├── db/                 SQLite connection + schema
│   │   ├── repositories/       SQL
│   │   ├── controllers/        request handling + validation
│   │   ├── middleware/         file upload, error handling
│   │   └── routes/
│   └── data/            SQLite file + uploaded images (gitignored)
└── client/              React app
    └── src/
        ├── api/                 fetch wrappers, one file per resource
        ├── lib/                  recentShelves (localStorage), statistics (chart data)
        ├── types/                TypeScript types
        ├── context/              UserContext (lightweight identity)
        ├── pages/                HomePage, CreateShelfPage, ShelfPage
        └── components/
            ├── layout/
            ├── identity/
            ├── shelf/             shared ShelfIcon renderer
            ├── shelf-form/       the shelf creation wizard
            ├── shelf-view/       the shelf page's Items/Statistics/People tabs
            └── charts/            BarChart
```

## Running it locally

Two terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

The API listens on `http://localhost:3000`, the app on `http://localhost:5173`.
Copy `server/.env.example` to `server/.env` and `client/.env.example` to
`client/.env` if you need to change the defaults.

## Current state

You can create a shelf (name, emoji+background-color or photo icon, one or
more item types with custom criteria), and a shelf page lets you add, edit
and remove items (with a visible edit history), chart statistics over any
criterion or over who added items, and see the shelf's members (read-only
for now — inviting/removing people is still to come). A per-browser "Your
shelves" list on the home page remembers shelves you've created or opened.
See `CLAUDE.md` for the full feature vision and what's still to build.
