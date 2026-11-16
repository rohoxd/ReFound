# ReFound - Campus Lost & Found Portal

A small full-stack web app where students can report lost items, post items they have found,
search every listing, and mark a listing Open or Closed. No accounts needed.

| Layer    | Tech                                  |
| -------- | ------------------------------------- |
| Frontend | React 18 + Vite, React Router, CSS    |
| Backend  | Node.js + Express, Multer (uploads)   |
| Database | SQLite (via `better-sqlite3`)         |

## Features

- **Home**: recent lost/found posts as cards, with "Show older posts" pagination
- **Search & filters**: search across *all* posts (name, description, location, category); filter by Lost/Found, category and Open/Closed. Filters live in the URL, so a search can be shared
- **Post an item**: Lost/Found, item name, description, category, location, date, optional photo (JPG/PNG/WebP/GIF, max 5 MB)
- **Item page**: full details and a button to close or reopen the listing
- **Persistent storage**: everything is stored in SQLite on the server, so posts show up on any device

## Folder structure

```
refound/
├── package.json          # root scripts (dev, build, start)
├── client/               # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js    # dev proxy to the API
│   └── src/
│       ├── App.jsx, main.jsx, api.js, utils.js, styles.css
│       ├── components/ListingCard.jsx
│       └── pages/        # Home, NewListing, ItemDetail
└── server/               # Express API + SQLite
    ├── index.js          # app entry, serves the built client in production
    ├── db.js             # opens SQLite and creates the table
    ├── constants.js      # categories, types, statuses
    ├── routes/listings.js
    └── seed.js           # optional sample data
```

## Run it locally

You need **Node.js 18 or newer**.

```bash
npm run install:all     # installs root, server and client dependencies
npm run seed            # optional: add sample listings
npm run dev             # starts API on :4000 and the React app on :5173
```

Open http://localhost:5173.

The database file and uploaded photos are created in `server/data/` (git-ignored).

## API

| Method | Route                          | Purpose                                                         |
| ------ | ------------------------------ | --------------------------------------------------------------- |
| GET    | `/api/listings`                | List/search. Query: `q`, `type`, `category`, `status`, `page`, `limit` |
| GET    | `/api/listings/:id`            | One listing                                                     |
| POST   | `/api/listings`                | Create (multipart/form-data, optional `photo` file)             |
| PATCH  | `/api/listings/:id/status`     | Body `{ "status": "open" \| "closed" }`                         |
| GET    | `/api/meta`                    | Category list                                                   |
| GET    | `/api/health`                  | Health check                                                    |

## Put it on GitHub

```bash
cd refound
git init
git add .
git commit -m "Initial commit: ReFound lost & found portal"
git branch -M main
git remote add origin https://github.com/<your-username>/refound.git
git push -u origin main
```

`node_modules/`, the built `client/dist/` and `server/data/` are already in `.gitignore`.

## Deploy

Production runs as **one Node service**: the Express server serves the API, the uploaded photos
and the built React app.

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment:** `PORT` is set by most hosts automatically. Optionally set `DATA_DIR`.

### Important: keep your data

SQLite stores everything in a file, and so do photo uploads. Many free hosts wipe the disk on every
deploy or restart, which would delete your listings and photos.

- On **Render**, **Railway** or **Fly.io**, attach a persistent disk/volume and set `DATA_DIR` to its mount path (for example `/var/data`).
- Or choose a host with a VPS (Hetzner, DigitalOcean, etc.) where the disk is permanent.
- If you later outgrow this, move photos to hosted storage (Cloudinary, S3) and the data to Postgres.

### Render example

1. Push the repo to GitHub.
2. Render: **New > Web Service**, pick the repo.
3. Build command `npm run build`, start command `npm start`.
4. Add a **Disk** mounted at `/var/data`, then add the env var `DATA_DIR=/var/data`.

## Notes and limits

- There are no accounts, so anyone with a listing's link can close or reopen it. That matches the
  project scope; if abuse becomes a problem, the next step would be a secret edit link per listing.
- Listing text is rendered as plain text by React, so it cannot inject HTML.
- Never ask people to post ID numbers or other private details in descriptions.
