# 🧠 OAMP (BrainBlock)

Platform kompetisi & analitik catur/CTF berbasis AI. Repository ini merupakan **meta-repo** yang menampung dua layanan utama yang saling terintegrasi:

- 🎨 **`oamp-frontend`** — Antarmuka pengguna (React + Vite).
- ⚙️ **`oamp-backend`** — API Server & WebSocket (Golang + Gin).

---

## 🏗️ Arsitektur Sistem

Aplikasi ini terdiri dari dua *service* terpisah yang berkomunikasi via HTTP dan WebSocket.

```text
┌─────────────────┐       HTTP / WS       ┌──────────────────┐
│  oamp-frontend  │ ────────────────────► │   oamp-backend   │
│  (React + Vite) │ ◄──────────────────── │ (Go + Gin + GORM)│
└─────────────────┘                       └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │    PostgreSQL    │
                                          └──────────────────┘
## Tech Stack

### Frontend (`oamp-frontend`)

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI) |
| HTTP Client | Axios |
| Charts | Recharts |
| Routing | React Router v7 |
| Data Fetching | TanStack React Query |
| Icons | Lucide React |
| Toast | Sonner |
| Payment | Midtrans Snap |

### Backend (`oamp-backend`)

| Layer | Technology |
|-------|------------|
| Language | Go (Golang) 1.25+ |
| Framework | Gin Web Framework |
| Database | PostgreSQL / SQLite |
| ORM | GORM |
| Migration | golang-migrate |
| Realtime | WebSocket |


