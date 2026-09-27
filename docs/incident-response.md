# GoWow Site Reliability & Incident Response Playbook

## 1. Incident Classification Matrix

| Severity Level | Definition | Target RTO | Target RPO | Escalation Lead |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Active examination disruption, database unavailability, or authentication outage preventing candidate participation | **< 30 mins** | **< 15 mins** | Incident Commander & DevOps Lead |
| **SEV-2 (Major)** | Degradation of learning modules, analytics reports, or examiner scheduling without impacting live examinations | **< 2 hours** | **< 1 hour** | Backend / Frontend Lead |
| **SEV-3 (Minor)** | Cosmetic UI inconsistencies, non-blocking telemetry bugs, or localized reporting friction | **< 24 hours** | **N/A** | On-Call Engineer |

---

## 2. Live Examination Outage Procedure (Section 80)

During an active digital examination, candidate independence and response integrity must be preserved:

```
[1. Detect & Alert] ──> [2. Scope Triage] ──> [3. Preserve Logs] ──> [4. Protect Answers]
         │
         ▼
[5. Accessible Communication] ──> [6. Service Recovery] ──> [7. Session Verification]
         │
         ▼
[8. Re-Sync Answers] ──> [9. Incident Post-Mortem] ──> [10. Preventative Fix]
```

1. **Detect Issue:** Prometheus alert, Sentry error spike, or examiner monitoring alert triggers automated paging.
2. **Determine Scope:** Identify whether outage impacts all candidates, a specific organization, or network gateway.
3. **Preserve Logs:** Snapshot running container logs (`docker logs --timestamps`) and reverse proxy logs before restarting services.
4. **Protect Candidate Data:** Active candidate responses are cached in browser `localStorage`. Do **not** issue a blanket cache clearing instruction.
5. **Communicate Status (Accessible):** Announce incident via high-contrast, screen-reader accessible system alert banners:
   - *"The examination server is temporarily reconnecting. Your answers are saved locally on your device. Please do not close your browser."*
6. **Restore Service:** Restart failed backend containers or failover to secondary database replica.
7. **Verify Sessions:** Query `exam_sessions` to ensure `server_expires_at` was extended by the exact duration of the outage downtime.
8. **Verify Answers:** Candidate client automatically flushes pending answers upon connection restoration with server timestamp handshake.
9. **Document Incident:** Record timeline, affected candidate IDs, and exact start/end timestamps.
10. **Review Root Cause:** Conduct blameless post-mortem within 48 hours.

---

## 3. Accessible Incident Communication Guidelines (Section 81)

- Critical system notices must be injected into an `aria-live="assertive"` container.
- Never use visual red banners alone; prefix messages with clear text glyphs: `[Notice: Offline]` or `[Status: Reconnected]`.
- Provide unambiguous keyboard actions (e.g. `[Alt+R to Retry Sync]`).

---

## 4. Security Incident & Credential Compromise Protocol (Section 82)

If database credentials, `JWT_SECRET_KEY`, or server access keys are leaked:

1. **Revoke Affected Tokens:** Rotate `JWT_SECRET_KEY` immediately in the secret manager, instantly invalidating active sessions.
2. **Rotate Database Passwords:** Update PostgreSQL credentials via `ALTER USER gowow_app_user WITH PASSWORD 'new_password';` and restart application containers.
3. **Audit Access Logs:** Inspect `audit_logs` table for anomalous actions (`USER_LOGIN_SUCCESS`, `EXAM_SUBMISSION`, `ROLE_UPDATE`) performed during the breach window.
4. **Notify Stakeholders:** Deliver non-technical, accessible incident notices to affected candidates and institutions.
