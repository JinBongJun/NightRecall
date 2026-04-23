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
- `SOURCE_IMAGE_STORAGE_ROOT=/data/source-images` when the backend runs on Railway with a mounted volume

The API still creates jobs, but the worker should be the only process that actually runs them in production.

## Source image storage

The app now stores saved source images by reference instead of embedding the blob in Postgres.

- Local development can keep the default `SOURCE_IMAGE_STORAGE_ROOT=./storage/source-images`
- Railway production should mount a persistent volume and point `SOURCE_IMAGE_STORAGE_ROOT` at that mount, for example `/data/source-images`
- If you later move to S3/R2, keep the same `source_image_ref` API contract and swap only the storage service implementation
