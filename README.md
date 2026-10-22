# Digital Bookshelf

A web app for creating a shared shelf with other people and cataloging a
collection together (books, vinyls, or anything else you collect).

## Stack

| Side | Tech |
|---|---|
| Frontend | React 18 + TypeScript (Vite) |
| Data storage | Browser local storage (local-first, no backend required) |

## Project structure

```
Digital Bookshelf/
├── CLAUDE.md           Project memory (read this for the full picture)
└── client/              React app
    └── src/
        ├── api/                 local data service wrappers
        ├── lib/                  localStore (data), statistics (chart data)
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

Only one terminal is needed:

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173` and works fully offline/local in
the browser (seeded with demo data on first load).

## Current state

You can create a shelf (name, emoji+background-color or photo icon, one or
more item types with custom criteria), and a shelf page lets you add, edit
and remove items (with a visible edit history), chart statistics over any
criterion or over who added items, and see the shelf's members (read-only
for now — inviting/removing people is still to come). A per-browser "Your
shelves" list on the home page remembers shelves you've created or opened.
See `CLAUDE.md` for the full feature vision and what's still to build.
