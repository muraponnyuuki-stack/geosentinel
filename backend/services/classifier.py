"""ニュースを「紛争・戦争・外交・政策・軍事演習」の5分類に振り分ける。"""

from __future__ import annotations

from .anthropic_client import call_json

SYSTEM = "あなたは軍事・安全保障ニュースの専門アナリストです。"

# 5分類（フロントエンドのタブ・色分けと対応。判別しづらい記事は other。）
CATEGORIES = ["conflict", "war", "diplomacy", "policy", "military_exercise", "other"]

# 出力スキーマ（構造化出力で妥当性を保証）
SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": CATEGORIES},
        "reason": {"type": "string"},
    },
    "required": ["category", "reason"],
    "additionalProperties": False,
}

_CATEGORY_GUIDE = """\
- conflict（紛争）: 宣戦布告のない武力衝突・交戦・攻撃・小競り合い・テロなど
- war（戦争）: 国家間の全面戦争・侵攻・正式な戦争状態
- diplomacy（外交）: 外交会談・交渉・制裁・条約・首脳会談などの外交的動き
- policy（政策）: 防衛予算・法整備・装備調達・国防政策や戦略の策定
- military_exercise（軍事演習）: 軍事演習・合同訓練の実施や計画
- other（該当なし）: 上記のいずれにも当てはまらない場合"""


def classify(title: str, content: str) -> dict:
    """1記事を5分類のいずれかに振り分けて {category, reason} を返す。"""
    user = (
        "以下のニュースを、次の6分類のうち最も当てはまるものに1つ分類してください。\n\n"
        f"{_CATEGORY_GUIDE}\n\n"
        "出力は指定の JSON スキーマ（category, reason）に従ってください。\n"
        "reason は簡潔な日本語で。\n\n"
        f"タイトル: {title}\n"
        f"ニュース本文:\n{content}"
    )
    return call_json(SYSTEM, user, SCHEMA, max_tokens=400, effort="low")
