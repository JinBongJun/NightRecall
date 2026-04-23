# Background Workers

NightRecall now supports background jobs for:

- question generation
- photo extraction

## Process roles

- `web`: serves the FastAPI API
- `worker`: claims queued jobs from the database and processes them

## Local commands

From `backend/`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
python -m app.workers.job_worker
python -m app.workers.job_worker --once
```

## Production settings

Set these in the backend environment:

- `JOB_INLINE_PROCESSING=false`
- `JOB_WORKER_POLL_INTERVAL_SECONDS=2.0`

The API still creates jobs, but the worker should be the only process that actually runs them in production.
