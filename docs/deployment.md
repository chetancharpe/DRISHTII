# GoWow Production Deployment Guide

## 1. Prerequisites & System Requirements

- **Linux Server:** Ubuntu 22.04 LTS or Debian 12 (Minimum 2 vCPU, 4GB RAM, 40GB SSD)
- **Container Engine:** Docker 24+ and Docker Compose v2.20+
- **Domain & DNS:** Fully Qualified Domain Names (e.g., `app.gowow.org` and `api.gowow.org`)
- **TLS Certificates:** Valid SSL/TLS certificate (via Let's Encrypt / Certbot or Cloudflare)

---

## 2. Directory & Architecture Layout

```
/opt/gowow/
├── docker-compose.prod.yml
├── .env.production
├── backend/
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── scripts/
│   │   ├── backup.py
│   │   └── restore.py
│   └── app/
└── client/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
```

---

## 3. Step-by-Step Production Deployment

### Step 1: Clone Repository & Create Release Directory
```bash
sudo mkdir -p /opt/gowow
sudo chown $USER:$USER /opt/gowow
cd /opt/gowow
git clone https://github.com/gowow/gowow-platform.git .
```

### Step 2: Configure Production Secrets
Copy the production environment template and generate secure keys:
```bash
cp backend/.env.production.example .env.production

# Generate secure 64-character JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/GENERATE_64_CHAR_HEX_SECRET_VIA_OPENSSL_RAND_HEX_32/$JWT_SECRET/" .env.production

# Set strong database password
DB_PASS=$(openssl rand -hex 16)
sed -i "s/CHANGE_ME_IN_PRODUCTION_STRONG_PASSWORD/$DB_PASS/" .env.production
```

### Step 3: Pre-Deployment Database Backup
Always trigger a database snapshot before applying schema changes or container updates:
```bash
docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup.py || true
```

### Step 4: Build and Deploy Containers
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### Step 5: Execute Database Migrations
```bash
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Step 6: Post-Deployment Smoke Verification
Run automated sanity checks to verify system readiness:
```bash
# Verify API Liveness
curl -fsS http://localhost:8000/health/live

# Verify Database Connection Readiness
curl -fsS http://localhost:8000/health/ready

# Verify Frontend Nginx Health
curl -fsS http://localhost/health
```

---

## 4. Rollback Strategy

If smoke verification fails or a regression is detected:

1. **Revert Application Containers:**
   ```bash
   git checkout <previous_stable_tag>
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
   ```
2. **Revert Database Schema (If Necessary):**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T backend alembic downgrade -1
   ```
3. **Emergency Point-in-Time Database Restoration:**
   ```bash
   LATEST_BACKUP=$(ls -t backend/backups/*.sql.gz | head -1)
   docker compose -f docker-compose.prod.yml exec -T backend python scripts/restore.py "$LATEST_BACKUP"
   ```
