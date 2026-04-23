# NightRecall Usage Limits

This document defines the product-facing quota rules for the free plan.

## Free Plan Rules

- Users can extract study points from photos up to 3 times per local day.
- Users can generate up to 3 new questions per local day.
- Users can generate up to 30 new questions per local month.
- Extracting and saving study material without generating questions does not consume question quota.
- Generating questions from saved learning consumes question quota at the time of generation.
- Reviewing already generated questions does not consume extraction or question quota.

## User-Facing Terminology

- `Photo reads left tonight`: remaining photo extraction attempts for the current local day.
- `Questions left tonight`: remaining new questions the user can generate for the current local day.
- `Ready now`: questions already generated and available to review right away.
- `Day streak`: consecutive local days with at least one completed review.

## Enforcement Notes

- Daily and monthly limits reset based on the user's stored timezone.
- The backend is the source of truth for remaining usage.
- The frontend may optimistically guide the user, but quota enforcement happens on the server.
