# GoWow Database Architecture, Migrations & Backup Guide

## 1. Relational Schema & Entity Relationships

The PostgreSQL database enforces relational integrity through explicit primary keys (UUIDv4), foreign keys with cascading actions, and query-optimized indexes:

```
[Users] ──────────┬──────────< [UserRoles] >────────── [Roles]
   │              ├──────────< [UserOrganizations] >── [Organizations]
   │              ├──────────< [AccessibilityProfiles]
   │              ├──────────< [LearningProfiles]
   │              │
   ▼              ▼
[Exams] ──────────< [ExamSections]
   │
   ├──────────────< [ExamCandidates] (Eligibility & Attempts)
   │
   ├──────────────< [ExamSessions] (Server-Authoritative Timing)
   │                     │
   │                     ├──────< [ExamAnswers] (Optimistic Locking)
   │                     └──────< [ExamSubmissions] (Idempotency Key)
   │
   └──────────────< [Results] (Evaluated Scores & Analytics)

[Questions] ──────< [QuestionVersions] (Accessibility Metadata & Math Transcripts)
[AuditLogs] (Non-repudiable Append-Only Trail)
```

---

## 2. Database User Role Separation

To enforce the principle of least privilege (Section 8), production databases should configure three isolated roles:

```sql
-- 1. Application Runtime Role (DML only, no DDL/DROP)
CREATE ROLE gowow_app_user WITH LOGIN PASSWORD 'app_secure_pass';
GRANT CONNECT ON DATABASE gowow_prod_db TO gowow_app_user;
GRANT USAGE ON SCHEMA public TO gowow_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gowow_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gowow_app_user;

-- 2. Migration Role (DDL & Schema Management for CI/CD)
CREATE ROLE gowow_migration_user WITH LOGIN PASSWORD 'migration_secure_pass';
GRANT ALL PRIVILEGES ON DATABASE gowow_prod_db TO gowow_migration_user;

-- 3. Read-Only Backup Role (for pg_dump snapshots)
CREATE ROLE gowow_backup_user WITH LOGIN PASSWORD 'backup_secure_pass';
GRANT CONNECT ON DATABASE gowow_prod_db TO gowow_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gowow_backup_user;
```

---

## 3. Query Performance & Indexing Strategy

Targeted indexes prevent table scans during high-concurrency examination events (Section 69):

| Table | Column(s) Indexed | Query Rationale |
| :--- | :--- | :--- |
| `users` | `email` (Unique) | O(1) Login credential lookups |
| `exams` | `status`, `organization_id`, `start_at` | Candidate exam catalogs & scheduling cron lookups |
| `exam_candidates` | `exam_id`, `candidate_id` | Eligibility verification prior to session start |
| `exam_sessions` | `exam_id`, `candidate_id`, `status` | Active candidate session recovery and examiner monitoring |
| `exam_answers` | `session_id`, `question_id` | Sub-50ms answer autosaves and state sync |
| `results` | `exam_id`, `candidate_id`, `session_id` | Instant result scorecard retrieval |
| `audit_logs` | `timestamp`, `action`, `actor_id` | Fast administrative compliance auditing |

---

## 4. Migration Management via Alembic

All schema modifications must be applied via tracked revisions:
```bash
# Generate a new auto-detected migration
alembic revision --autogenerate -m "add_indexes_for_performance"

# Upgrade database to latest revision
alembic upgrade head

# Rollback one migration step
alembic downgrade -1
```

---

## 5. Automated Backup, Verification & Retention Policy

- **Cadence:** Daily automated execution via systemd timer or cron job at `02:00 UTC`.
- **Retention:** Backups older than 30 days are automatically pruned via `backup.py`.
- **Integrity:** Every `.sql.gz` archive is paired with a companion `.sha256` checksum file.
- **Execution Command:**
  ```bash
  python backend/scripts/backup.py
  ```
- **Restoration Drill Command:**
  ```bash
  python backend/scripts/restore.py /path/to/archive.sql.gz
  ```
