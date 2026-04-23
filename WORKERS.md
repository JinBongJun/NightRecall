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
- `SOURCE_IMAGE_STORAGE_PROVIDER=s3` or `r2`
- `SOURCE_IMAGE_STORAGE_ENDPOINT_URL=https://...`
- `SOURCE_IMAGE_STORAGE_BUCKET=...`
- `SOURCE_IMAGE_STORAGE_REGION=auto` or the bucket region
- `SOURCE_IMAGE_STORAGE_ACCESS_KEY_ID=...`
- `SOURCE_IMAGE_STORAGE_SECRET_ACCESS_KEY=...`

The API still creates jobs, but the worker should be the only process that actually runs them in production.

## Source image storage

The app now stores saved source images by reference instead of embedding the blob in Postgres.

- Local development can keep the default `SOURCE_IMAGE_STORAGE_PROVIDER=local` and `SOURCE_IMAGE_STORAGE_ROOT=./storage/source-images`
- Production should use an S3-compatible object store such as AWS S3 or Cloudflare R2
- Keep the same `source_image_ref` API contract and swap only the storage settings
