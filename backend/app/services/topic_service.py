import re


class TopicService:
    @staticmethod
    def extract_topics_from_note(note: str, limit: int = 5) -> list[str]:
        tokens = [chunk.strip(" ,.;:-") for chunk in re.split(r"[\n,]", note) if chunk.strip()]
        cleaned: list[str] = []
        for token in tokens:
            if len(token) < 3:
                continue
            cleaned.append(token[:60])
            if len(cleaned) == limit:
                break
        return cleaned or [note[:60]]
