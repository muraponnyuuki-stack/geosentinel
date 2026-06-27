"""地域ごとのニュースを Claude で 300〜500 文字に要約する。"""

from __future__ import annotations

from .anthropic_client import call_json

SYSTEM = "あなたは国際情勢アナリストです。"

SCHEMA = {
    "type": "object",
    "properties": {
        "region": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["region", "summary"],
    "additionalProperties": False,
}

# 要約に渡す記事の最大件数（トークン・コスト抑制）
MAX_ARTICLES = 15


def summarize(region: str, articles: list[dict]) -> dict:
    """地域内ニュースを 300〜500 文字で要約して {region, summary} を返す。"""
    lines = []
    for a in articles[:MAX_ARTICLES]:
        title = (a.get("title") or "").strip()
        body = (a.get("content") or a.get("summary") or "").strip()
        lines.append(f"- {title}: {body}")
    article_block = "\n".join(lines) if lines else "（該当ニュースなし）"

    user = (
        f"以下のニュースを読み、「{region}」地域の動きを 300〜500 文字の日本語で"
        "要約してください。重要な出来事、関係国、緊張度、影響範囲を含めてください。\n\n"
        "出力は指定の JSON スキーマ（region, summary）に従ってください。\n\n"
        f"ニュース一覧：\n{article_block}"
    )
    data = call_json(SYSTEM, user, SCHEMA, max_tokens=1200, effort="medium")
    data.setdefault("region", region)
    return data
