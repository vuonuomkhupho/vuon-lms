# Vuon LMS

Learning Management System built on [Frappe LMS](https://github.com/frappe/lms), deployed with Docker on Railway + Cloudflare R2.

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌──────────────┐
│   Students  │────▶│  Frontend (Nginx)  :8080                 │     │ Cloudflare   │
│   Browser   │     │    ├── Backend (Frappe)  :8000            │────▶│ R2 Storage   │
└─────────────┘     │    ├── Websocket (Socket.IO)  :9000      │     │ (videos,     │
                    │    ├── Worker (background jobs)           │     │  PDFs, etc.) │
                    │    ├── Scheduler (cron)                   │     └──────────────┘
                    │    ├── MariaDB  :3306                     │
                    │    └── Redis  :6379                       │
                    └──────────────────────────────────────────┘
                              Railway / Docker Compose
```

## Quick Start (Local Docker)

```bash
# 1. Clone
git clone <this-repo>
cd vuon-lms

# 2. Build custom image with LMS + R2 storage apps
./scripts/build-image.sh vuon-lms:latest

# 3. Configure
cp .env.example .env
# Edit .env — set DB_PASSWORD, ADMIN_PASSWORD

# 4. Start all services
docker compose up -d

# 5. Create site and install apps
docker compose exec backend bench new-site lms.localhost \
  --mariadb-root-password <DB_PASSWORD> \
  --admin-password <ADMIN_PASSWORD> \
  --install-app erpnext \
  --install-app lms \
  --install-app dfp_external_storage

# 6. Open http://localhost:8080
```

## Railway Deployment

See [`scripts/railway-setup.sh`](scripts/railway-setup.sh) for step-by-step Railway deployment instructions.

**Estimated cost**: ~$7-17/mo (Railway services + R2 storage)

## Cloudflare R2 Setup

See [`scripts/setup-r2-storage.md`](scripts/setup-r2-storage.md) for R2 bucket creation, API keys, and Frappe configuration.

**Estimated cost**: ~$0.50/mo for 20 course sessions

## Project Structure

```
vuon-lms/
├── apps.json              # Frappe apps to include (LMS, DFP External Storage)
├── docker-compose.yml     # Local/production Docker Compose
├── Containerfile          # Reference Containerfile
├── .env.example           # Environment variables template
├── .gitignore
└── scripts/
    ├── build-image.sh         # Build custom Docker image
    ├── railway-setup.sh       # Railway deployment guide
    └── setup-r2-storage.md    # R2 storage configuration
```

## Content Types per Session

| Type | Format | Storage |
|------|--------|---------|
| Video recording | MP4/WebM | R2 bucket |
| Slides | PDF/images | R2 bucket |
| Recap | Text/mindmap | Frappe DB |
| Attached docs | Google Docs/Sheets links | Frappe DB (URLs only) |

## Tech Stack

- **LMS**: [Frappe LMS](https://github.com/frappe/lms) (Python/Vue.js)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) via [DFP External Storage](https://github.com/developmentforpeople/dfp_external_storage)
- **Database**: MariaDB 11.4
- **Cache/Queue**: Redis 7
- **Hosting**: Railway (or any Docker host)
