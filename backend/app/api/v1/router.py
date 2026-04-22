from fastapi import APIRouter

from app.api.v1 import entitlements, ops, questions, reminder_settings, review, stats, study_inputs, usage, users, waitlist

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(entitlements.router, prefix="/entitlements", tags=["entitlements"])
api_router.include_router(study_inputs.router, prefix="/study-inputs", tags=["study-inputs"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(review.router, prefix="/review", tags=["review"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"])
api_router.include_router(reminder_settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(waitlist.router, prefix="/waitlist", tags=["waitlist"])
api_router.include_router(ops.router, prefix="/ops", tags=["ops"])
