# Backups

Railway Postgres backups are not available on the free plan. This repo uses GitHub Actions to create daily `pg_dump` artifacts.

## Configure

In GitHub repo settings:

- `Settings -> Secrets and variables -> Actions -> Secrets`
  - `WAITLIST_DATABASE_URL`: Railway `Postgres_to_waitlist` connection string
  - `APP_DATABASE_URL`: Railway app DB connection string

Backups are uploaded as GitHub Actions artifacts (retained for 14 days by default).

## Restore

1. Download the latest `db-backup-*.tar.gz` artifact from the workflow run.
2. Verify `SHA256SUMS.txt`.
3. Restore:

```bash
# custom-format dumps
pg_restore --no-owner --no-acl --clean --if-exists -d "$DATABASE_URL" waitlist.dump
pg_restore --no-owner --no-acl --clean --if-exists -d "$DATABASE_URL" app.dump
```

