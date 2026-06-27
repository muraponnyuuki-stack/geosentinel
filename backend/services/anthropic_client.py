"""Anthropic（Claude）クライアントの共通処理。

- APIキーは環境変数 ANTHROPIC_API_KEY から読み込む
- モデルは ANTHROPIC_MODEL で上書き可能（既定 claude-sonnet-4-6）
- 構造化出力（output_config.format）で必ず妥当な JSON を受け取る
- タイムアウト・リトライをクライアント側で設定

※ 「Claude 3.7 Sonnet」(claude-3-7-sonnet-20250219) は 2026-02-19 に提供終了
   のため、後継の Sonnet 4.6 を既定にしている。
"""

from __future__ import annotations

import json
import os
from functools import lru_cache

import anthropic

# プロジェクト直下の .env を「ファイル位置基準」で読み込む（起動方法に依存しない）
try:
    from pathlib import Path

    from dotenv import load_dotenv

    _env_path = Path(__file__).resolve().parents[2] / ".env"  # military-news-web/.env
    load_dotenv(_env_path)
    load_dotenv()  # 念のため cwd 側も
except ImportError:
    pass

# 既定モデル（環境変数で差し替え可能）
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

# リクエストのタイムアウト（秒）とリトライ回数
REQUEST_TIMEOUT = float(os.getenv("ANTHROPIC_TIMEOUT", "60"))
MAX_RETRIES = int(os.getenv("ANTHROPIC_MAX_RETRIES", "2"))


@lru_cache(maxsize=1)
def get_client() -> anthropic.Anthropic:
    """Anthropic クライアントを遅延生成する（キー未設定なら RuntimeError）。"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY が未設定です。環境変数に API キーを設定してください。"
        )
    return anthropic.Anthropic(
        api_key=api_key,
        timeout=REQUEST_TIMEOUT,
        max_retries=MAX_RETRIES,
    )


def call_json(
    system: str,
    user: str,
    schema: dict,
    *,
    max_tokens: int = 1024,
    effort: str = "medium",
) -> dict:
    """Claude を呼び出し、指定スキーマに沿った JSON を dict で返す。

    output_config.format により応答の先頭テキストブロックは妥当な JSON になる。
    """
    client = get_client()
    resp = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
        output_config={
            "effort": effort,  # low | medium | high（Sonnet 4.6 は max 非対応）
            "format": {"type": "json_schema", "schema": schema},
        },
    )
    text = next((b.text for b in resp.content if b.type == "text"), "")
    return json.loads(text)
