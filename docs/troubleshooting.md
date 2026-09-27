# GoWow Operational Troubleshooting Guide

## 1. Frontend Cannot Connect to Backend API

**Symptom:** Client shows network error or API requests return `Failed to fetch`.

**Diagnoses & Resolution:**
1. Check `VITE_API_BASE_URL` in `.env.local` or `.env.production`:
   ```bash
   # Development should be:
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. Verify Backend CORS Configuration:
   - Check `backend/.env` `CORS_ORIGINS`.
   - Ensure the client's origin (e.g. `http://localhost:5173`) is explicitly listed in `CORS_ORIGINS`.
3. Check Backend Process Status:
   ```bash
   curl -i http://localhost:8000/health/live
   ```

---

## 2. Readiness Probe Fails (HTTP 503 on `/health/ready`)

**Symptom:** Container orchestrator marks backend as unhealthy.

**Diagnoses & Resolution:**
1. Test direct database connectivity:
   ```bash
   docker compose exec backend python -c "from app.db.database import engine; conn = engine.connect(); print('Connected successfully!')"
   ```
2. Check PostgreSQL container health:
   ```bash
   docker compose ps postgres
   docker logs gowow-postgres-dev --tail 50
   ```
3. Verify `DATABASE_URL` credentials in `.env`.

---

## 3. Database Migration Conflicts (`alembic.util.exc.CommandError`)

**Symptom:** Running `alembic upgrade head` aborts with `Target database is not up to date`.

**Diagnoses & Resolution:**
1. Inspect current database revision:
   ```bash
   alembic current
   ```
2. View migration history:
   ```bash
   alembic history --verbose
   ```
3. Stamp the database to current head if tables were pre-created:
   ```bash
   alembic stamp head
   ```

---

## 4. Rate Limit Throttling (HTTP 429 `RATE_LIMIT_EXCEEDED`)

**Symptom:** Candidate or test automation receives HTTP 429 responses.

**Diagnoses & Resolution:**
1. For automated testing suites, ensure `ENVIRONMENT=test` in `.env.test`. In test mode, rate limits are relaxed.
2. For high-volume examination centers behind a shared institutional NAT proxy, increase `RATE_LIMIT_PER_MINUTE` in backend environment settings:
   ```env
   RATE_LIMIT_PER_MINUTE=240
   ```

---

## 5. Playwright Accessibility Tests Fail in CI

**Symptom:** `npx playwright test` errors with missing browser binaries or libatk.

**Diagnoses & Resolution:**
Install complete Linux OS dependencies for Chromium:
```bash
npx playwright install --with-deps chromium
```
