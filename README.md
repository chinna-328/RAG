# Lumen

A NotebookLM-style RAG app. Upload a PDF or text document, ask questions, and get grounded answers with citations back to the exact passages.

```
Upload → Extract → Chunk → Embed → Qdrant
                                        ↓
        Query → Embed → Top-K search → Gemini → Streamed answer + citations
```

## Stack

| Layer       | Choice                                              |
| ----------- | --------------------------------------------------- |
| Frontend    | Vite + React 18 + TypeScript + Tailwind             |
| Routing     | React Router                                        |
| State       | Zustand                                             |
| Backend     | Express (TS, run via `tsx`)                         |
| LLM         | Gemini `gemini-2.5-flash` (generation, streaming)   |
| Embeddings  | Gemini `gemini-embedding-001` (768-dim)             |
| Vector DB   | Qdrant Cloud — one collection per notebook          |
| PDF parsing | `pdf-parse`                                         |
| Streaming   | Server-Sent Events                                  |

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# fill in GEMINI_API_KEY and QDRANT_URL / QDRANT_API_KEY

# 3. Run (web on :5173, API on :3001 — Vite proxies /api)
npm run dev
```

Open <http://localhost:5173>.

### Required env vars

See `.env.example`. The two you must set:

- `GEMINI_API_KEY` — <https://aistudio.google.com/apikey>
- `QDRANT_URL` + `QDRANT_API_KEY` — free tier at <https://cloud.qdrant.io>

`/api/health` reports whether each is configured.

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Concurrent Vite dev server + Express API       |
| `npm run dev:web`   | Vite only                                      |
| `npm run dev:server`| Express only (`tsx watch`)                     |
| `npm run build`     | Type-check the project then build the SPA      |
| `npm run typecheck` | `tsc -b --noEmit` across all tsconfigs         |
| `npm start`         | Run the API (no watch)                         |

## Project layout

```
server/            Express API
  index.ts           Health + router mount + static uploads
  routes/notebooks.ts CRUD, upload, chat (SSE)
  lib/               gemini, qdrant, chunker, extract, indexer, prompt, store
src/               React app
  pages/             Landing, Library, Upload, Chat, Settings, AppLayout
  components/ui/     Button, Card, Badge, Avatar, Kbd, Logo
  store/             Zustand stores (notebook, settings)
  lib/               api client, helpers
shared/types.ts    Types shared between client and server
data/              Runtime: notebooks.json + uploaded source text (gitignored)
uploads/           Multer temp dir (gitignored)
```

## Routes

Frontend:

- `/` — landing
- `/app` — library (search, rename, delete)
- `/app/upload[/:id]` — upload + indexing stages
- `/app/notebooks/:id` — three-pane chat (sources · doc · chat)
- `/app/settings` — RAG / models / storage / general

API:

- `GET  /api/health`
- `GET  /api/notebooks`
- `POST /api/notebooks` `{ title? }`
- `GET  /api/notebooks/:id`
- `PATCH /api/notebooks/:id` `{ title }` — rename
- `DELETE /api/notebooks/:id` — also drops the Qdrant collection
- `POST /api/notebooks/:id/upload` (multipart `file`, optional `chunkSize`, `chunkOverlap`)
- `POST /api/notebooks/:id/chat` `{ query, topK }` — streams SSE: `citations`, `token`, `done`, `error`

## RAG defaults

Tunable in **Settings → RAG pipeline**, persisted in the Zustand settings store:

- Chunking: `RecursiveCharacterTextSplitter`, **1000 chars**, **200 overlap**
- Retrieval: **Top-3** chunks
- Embedding output: **768 dim** (Gemini `outputDimensionality`)
- System prompt enforces "answer from context only; cite `[1] [2] [3]`"

## Storage model

- **Notebook metadata** lives in `data/notebooks.json` (one JSON file, simple to inspect).
- **Source text** is persisted under `data/uploads/<source-id>.txt` and served read-only at `/api/uploads/...` for the doc viewer.
- **Vectors** live in Qdrant Cloud, one collection per notebook (`notebook_<id>`). Deleting a notebook drops its collection.

## Streaming

Chat uses fetch-over-SSE. The server emits:

```
event: data: {"type":"citations","value":[…]}
event: data: {"type":"token","value":"…"}
event: data: {"type":"done"}
```

The client parses these in `src/lib/api.ts → streamChat()` and exposes an `AbortController` to cancel mid-stream.

## Deploy to Vercel

The repo is wired for a single Vercel deploy (SPA + Express-as-serverless):

- `vercel.json` — sets `framework: vite`, declares `api/index.ts` as a Node function with `maxDuration: 60` (needed for SSE chat), and rewrites `/api/(.*)` → `/api/index`.
- `api/index.ts` — re-exports the Express `app` from `server/index.ts` as the function handler.
- `server/index.ts` — calls `app.listen()` and writes to disk only when `process.env.VERCEL` is unset (dev/self-host); otherwise just exports `app`.

### Steps

1. Push to GitHub, import the repo in Vercel.
2. Set env vars in **Project Settings → Environment Variables**:
   - `GEMINI_API_KEY`
   - `QDRANT_URL`, `QDRANT_API_KEY`
   - (optional) `GEMINI_GEN_MODEL`, `GEMINI_EMBED_MODEL`
3. Deploy. Vercel auto-detects Vite for the SPA build.

### Storage caveat (read this before deploying for real)

Vercel functions have a read-only filesystem (only `/tmp` is writable, and it's per-invocation). The current store and upload pipeline persist to disk:

- `server/lib/store.ts` writes notebook metadata to `data/notebooks.json`
- `server/lib/indexer.ts` writes extracted source text to `data/uploads/<id>.txt`
- `multer.diskStorage` writes incoming PDFs to `data/uploads/`

Before chat/upload will work end-to-end on Vercel, migrate to:

- **Vercel KV** (or Postgres / Upstash) for notebook metadata
- **Vercel Blob** *or* keep the full source text inside Qdrant point payloads
- `multer.memoryStorage()` for incoming uploads (PDF parsing is in-memory anyway)

`/api/health` works without any of that and is a useful smoke test.

## Notes

- Ships dark-only by design (see `tokens.css`).
- 50 MB upload cap (Multer).
- Vite dev server proxies `/api` to `http://localhost:3001`.
