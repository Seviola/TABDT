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
