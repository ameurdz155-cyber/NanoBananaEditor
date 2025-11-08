"""Utility functions for image processing and data handling."""

import base64
from typing import Any, List
from models import ImagePayload


def normalize_base64(data: str) -> bytes:
    """Return raw bytes from a base64 string or data URL."""
    if not data:
        raise ValueError("Empty image payload")
    if "," in data and data.strip().startswith("data:"):
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def serialize_inline_image(data: bytes, mime_type: str = "image/png") -> ImagePayload:
    """Serialize image bytes to ImagePayload format."""
    return ImagePayload(mime_type=mime_type, b64_data=base64.b64encode(data).decode("ascii"))


def summarize_candidate(candidate: Any) -> str:
    """Return a compact summary of a Gemini candidate for debugging."""
    finish_reason_value = getattr(candidate, "finish_reason", None)
    finish_reason_map = {
        0: "UNSPECIFIED",
        1: "STOP",
        2: "MAX_TOKENS",
        3: "SAFETY",
        4: "RECITATION",
        5: "OTHER",
        6: "BLOCKLIST",
        7: "PROHIBITED_CONTENT",
        8: "SPII",
        9: "MALWARE",
    }
    finish_reason_label = finish_reason_map.get(finish_reason_value, "UNKNOWN")
    safety_parts: List[str] = []

    for rating in getattr(candidate, "safety_ratings", []) or []:
        category = getattr(rating, "category", "unknown")
        probability = getattr(rating, "probability", "unspecified")
        blocked = getattr(rating, "blocked", False)
        flag = "blocked" if blocked else "ok"
        safety_parts.append(f"{category}={probability} ({flag})")

    safety_text = ", ".join(safety_parts) if safety_parts else "none"
    return f"finish_reason={finish_reason_value} ({finish_reason_label}), safety=[{safety_text}]"


def extract_candidate_text(candidate: Any, *, limit: int = 160) -> str:
    """Return truncated textual content from a Gemini candidate for diagnostics."""
    texts: List[str] = []
    content = getattr(candidate, "content", None)
    if not content:
        return ""

    for part in getattr(content, "parts", []) or []:
        text_value = getattr(part, "text", None)
        if not text_value:
            continue
        trimmed = text_value.strip().replace("\n", " ")
        if trimmed:
            texts.append(trimmed)

    if not texts:
        return ""

    combined = " | ".join(texts)
    if len(combined) <= limit:
        return combined
    return f"{combined[: limit - 3]}..."


def summarize_prompt_feedback(feedback: Any) -> str:
    """Extract and summarize prompt feedback from Gemini response."""
    if not feedback:
        return ""

    reason = getattr(feedback, "block_reason", None)
    safety = getattr(feedback, "safety_ratings", None)
    pieces: List[str] = []

    if reason:
        pieces.append(f"block_reason={reason}")

    if safety:
        safety_parts: List[str] = []
        for rating in safety:
            category = getattr(rating, "category", "unknown")
            probability = getattr(rating, "probability", "unspecified")
            safety_parts.append(f"{category}={probability}")
        if safety_parts:
            pieces.append("safety=" + ", ".join(safety_parts))

    return ", ".join(pieces)
