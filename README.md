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
## 🛠️ Tech Stack

### 🎨 Frontend (`oamp-frontend`)
| Layer | Teknologi |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4, shadcn/ui |
| State & Data | TanStack React Query, Axios |
| Routing | React Router v7 |
| Deployment | Docker (Nginx) |

### ⚙️ Backend (`oamp-backend`)
| Layer | Teknologi |
|-------|-----------|
| Bahasa | Go (Golang) 1.25+ |
| Framework HTTP | Gin Web Framework |
| Database & ORM | PostgreSQL / SQLite + GORM |
| Migrasi | golang-migrate |
| Realtime | WebSocket |
