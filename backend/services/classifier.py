"""ニュースが軍事・安全保障に関係するかを Claude で分類する。"""

from __future__ import annotations

from .anthropic_client import call_json

SYSTEM = "あなたは軍事・安全保障ニュースの専門アナリストです。"

# 出力スキーマ（構造化出力で妥当性を保証）
SCHEMA = {
    "type": "object",
    "properties": {
        "is_military": {"type": "boolean"},
        "category": {
            "type": "string",
            "enum": ["military", "security", "diplomacy", "terrorism", "other"],
        },
        "reason": {"type": "string"},
    },
    "required": ["is_military", "category", "reason"],
    "additionalProperties": False,
}


def classify(title: str, content: str) -> dict:
    """1記事を分類して {is_military, category, reason} を返す。"""
    user = (
        "以下のニュースが軍事・安全保障に関係するか分類してください。\n\n"
        "出力は指定の JSON スキーマ（is_military, category, reason）に従ってください。\n"
        "category は military / security / diplomacy / terrorism / other のいずれか。\n"
        "reason は簡潔な日本語で。\n\n"
        f"タイトル: {title}\n"
        f"ニュース本文:\n{content}"
    )
    return call_json(SYSTEM, user, SCHEMA, max_tokens=400, effort="low")
