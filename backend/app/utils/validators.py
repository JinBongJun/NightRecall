def clamp_question_count(count: int) -> int:
    return max(1, min(count, 3))
