# API Contract & Future Backend Architecture — GoWow

## Architecture Overview
The frontend communicates through modular API services (`client/src/services/`). During Phase 1, client-side placeholder services simulate deterministic responses. In future phases, these services map directly to REST/FastAPI microservices.

### Future Endpoints Planned:
- `POST /api/v1/auth/login`: Issue bearer tokens & user role claim.
- `POST /api/v1/auth/signup`: Create user profile with accessibility settings.
- `GET /api/v1/exams`: List published exams with attempt metadata.
- `GET /api/v1/exams/{id}`: Detailed test specs and question batches.
- `POST /api/v1/exams/{id}/attempt`: Secure server-authoritative test session initialization.
- `POST /api/v1/exams/{id}/submit`: Atomically lock attempt and trigger evaluation.
- `GET /api/v1/analytics/{candidate_id}`: Comprehensive weakness discovery & psychometric telemetry.
