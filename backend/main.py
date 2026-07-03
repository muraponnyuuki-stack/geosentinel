"""GeoSentinel バックエンド（FastAPI 最小構成）。

エンドポイント:
  - GET /news?country=JP        : 国コード指定のダミーニュース
  - GET /news?region=EastAsia   : 地域指定のダミーニュース
  - GET /download/excel         : ダミー Excel(CSV) ダウンロード
  - GET /download/word          : ダミー Word(TXT) ダウンロード
  - GET /api                    : ヘルスチェック
  - GET /                       : フロントエンド（../frontend）を配信

Render での起動:
  uvicorn backend.main:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import datetime as dt
import time
from pathlib import Path

import anthropic
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .services import classifier, summarizer

app = FastAPI(title="GeoSentinel API", version="0.1.0")

# フロント/別ホスト配信の両対応のため CORS を全許可（最小構成）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# 19地域分類（classifier.py と対応）
REGIONS = [
    "East Asia", "Southeast Asia", "South Asia", "Central Asia", "Oceania",
    "Gulf", "Levant", "Iran",
    "North Africa", "Sub-Saharan Africa",
    "Northern Europe", "Western Europe", "Eastern Europe",
    "Ukraine", "Russia", "Balkans",
    "North America", "Central America", "South America",
]

# ISO 3166-1 alpha-2 -> 19地域（classifier.py の体系に対応）
COUNTRY_REGION = {
    # East Asia
    "JP": "East Asia", "CN": "East Asia", "KR": "East Asia", "KP": "East Asia",
    "TW": "East Asia", "MN": "East Asia", "HK": "East Asia", "MO": "East Asia",
    # Southeast Asia
    "VN": "Southeast Asia", "PH": "Southeast Asia", "ID": "Southeast Asia",
    "MY": "Southeast Asia", "SG": "Southeast Asia", "TH": "Southeast Asia",
    "MM": "Southeast Asia", "KH": "Southeast Asia", "LA": "Southeast Asia",
    "BN": "Southeast Asia", "TL": "Southeast Asia",
    # South Asia
    "IN": "South Asia", "PK": "South Asia", "BD": "South Asia", "LK": "South Asia",
    "NP": "South Asia", "BT": "South Asia", "MV": "South Asia", "AF": "South Asia",
    # Central Asia
    "KZ": "Central Asia", "UZ": "Central Asia", "TM": "Central Asia",
    "KG": "Central Asia", "TJ": "Central Asia",
    # Oceania
    "AU": "Oceania", "NZ": "Oceania", "PG": "Oceania", "FJ": "Oceania",
    "SB": "Oceania", "VU": "Oceania", "WS": "Oceania", "TO": "Oceania",
    # Gulf
    "SA": "Gulf", "AE": "Gulf", "QA": "Gulf", "BH": "Gulf", "KW": "Gulf",
    "OM": "Gulf", "YE": "Gulf",
    # Levant
    "IL": "Levant", "PS": "Levant", "SY": "Levant", "LB": "Levant",
    "JO": "Levant", "IQ": "Levant", "TR": "Levant",
    # Iran
    "IR": "Iran",
    # North Africa
    "EG": "North Africa", "LY": "North Africa", "DZ": "North Africa",
    "TN": "North Africa", "MA": "North Africa",
    # Sub-Saharan Africa
    "NG": "Sub-Saharan Africa", "SO": "Sub-Saharan Africa", "ET": "Sub-Saharan Africa",
    "KE": "Sub-Saharan Africa", "UG": "Sub-Saharan Africa", "TZ": "Sub-Saharan Africa",
    "CD": "Sub-Saharan Africa", "CG": "Sub-Saharan Africa", "ML": "Sub-Saharan Africa",
    "NE": "Sub-Saharan Africa", "TD": "Sub-Saharan Africa", "SD": "Sub-Saharan Africa",
    "SS": "Sub-Saharan Africa", "SN": "Sub-Saharan Africa", "GH": "Sub-Saharan Africa",
    "CI": "Sub-Saharan Africa", "CM": "Sub-Saharan Africa", "ZA": "Sub-Saharan Africa",
    "ZW": "Sub-Saharan Africa", "MZ": "Sub-Saharan Africa", "AO": "Sub-Saharan Africa",
    "RW": "Sub-Saharan Africa", "ER": "Sub-Saharan Africa", "BF": "Sub-Saharan Africa",
    # Northern Europe
    "NO": "Northern Europe", "SE": "Northern Europe", "FI": "Northern Europe",
    "DK": "Northern Europe", "IS": "Northern Europe",
    # Western Europe
    "GB": "Western Europe", "FR": "Western Europe", "DE": "Western Europe",
    "ES": "Western Europe", "IT": "Western Europe", "NL": "Western Europe",
    "BE": "Western Europe", "AT": "Western Europe", "CH": "Western Europe",
    "IE": "Western Europe", "PT": "Western Europe",
    # Eastern Europe
    "PL": "Eastern Europe", "CZ": "Eastern Europe", "SK": "Eastern Europe",
    "HU": "Eastern Europe", "RO": "Eastern Europe", "BG": "Eastern Europe",
    "MD": "Eastern Europe", "EE": "Eastern Europe", "LV": "Eastern Europe",
    "LT": "Eastern Europe", "BY": "Eastern Europe", "SI": "Eastern Europe",
    "HR": "Eastern Europe",
    # Ukraine / Russia
    "UA": "Ukraine", "RU": "Russia",
    # Balkans
    "RS": "Balkans", "BA": "Balkans", "XK": "Balkans", "MK": "Balkans",
    "ME": "Balkans", "AL": "Balkans",
    # North America
    "US": "North America", "CA": "North America",
    # Central America / Caribbean
    "MX": "Central America", "GT": "Central America", "HN": "Central America",
    "SV": "Central America", "NI": "Central America", "CR": "Central America",
    "PA": "Central America", "CU": "Central America", "HT": "Central America",
    "DO": "Central America", "JM": "Central America",
    # South America
    "BR": "South America", "AR": "South America", "CL": "South America",
    "PE": "South America", "CO": "South America", "VE": "South America",
    "EC": "South America", "BO": "South America", "PY": "South America",
    "UY": "South America", "GY": "South America", "SR": "South America",
}


# ISO2 -> 日本語国名（Google News 検索クエリ用。未収録は ISO コードで代用）
COUNTRY_NAME_JA = {
    "JP": "日本", "CN": "中国", "KR": "韓国", "KP": "北朝鮮", "TW": "台湾", "MN": "モンゴル",
    "VN": "ベトナム", "PH": "フィリピン", "ID": "インドネシア", "MY": "マレーシア",
    "SG": "シンガポール", "TH": "タイ", "MM": "ミャンマー", "KH": "カンボジア", "LA": "ラオス",
    "IN": "インド", "PK": "パキスタン", "BD": "バングラデシュ", "LK": "スリランカ",
    "NP": "ネパール", "AF": "アフガニスタン",
    "KZ": "カザフスタン", "UZ": "ウズベキスタン", "TM": "トルクメニスタン",
    "KG": "キルギス", "TJ": "タジキスタン",
    "AU": "オーストラリア", "NZ": "ニュージーランド", "PG": "パプアニューギニア", "FJ": "フィジー",
    "SA": "サウジアラビア", "AE": "アラブ首長国連邦", "QA": "カタール", "BH": "バーレーン",
    "KW": "クウェート", "OM": "オマーン", "YE": "イエメン",
    "IL": "イスラエル", "PS": "パレスチナ", "SY": "シリア", "LB": "レバノン",
    "JO": "ヨルダン", "IQ": "イラク", "TR": "トルコ", "IR": "イラン",
    "EG": "エジプト", "LY": "リビア", "DZ": "アルジェリア", "TN": "チュニジア", "MA": "モロッコ",
    "NG": "ナイジェリア", "SO": "ソマリア", "ET": "エチオピア", "KE": "ケニア",
    "CD": "コンゴ民主共和国", "ML": "マリ", "SD": "スーダン", "SS": "南スーダン",
    "ZA": "南アフリカ", "NE": "ニジェール", "TD": "チャド", "BF": "ブルキナファソ",
    "NO": "ノルウェー", "SE": "スウェーデン", "FI": "フィンランド", "DK": "デンマーク", "IS": "アイスランド",
    "GB": "イギリス", "FR": "フランス", "DE": "ドイツ", "ES": "スペイン", "IT": "イタリア",
    "NL": "オランダ", "BE": "ベルギー", "AT": "オーストリア", "CH": "スイス", "IE": "アイルランド", "PT": "ポルトガル",
    "PL": "ポーランド", "CZ": "チェコ", "SK": "スロバキア", "HU": "ハンガリー", "RO": "ルーマニア",
    "BG": "ブルガリア", "MD": "モルドバ", "EE": "エストニア", "LV": "ラトビア", "LT": "リトアニア", "BY": "ベラルーシ",
    "UA": "ウクライナ", "RU": "ロシア",
    "RS": "セルビア", "BA": "ボスニア・ヘルツェゴビナ", "XK": "コソボ", "MK": "北マケドニア",
    "ME": "モンテネグロ", "AL": "アルバニア",
    "US": "アメリカ", "CA": "カナダ",
    "MX": "メキシコ", "GT": "グアテマラ", "HN": "ホンジュラス", "NI": "ニカラグア",
    "PA": "パナマ", "CU": "キューバ", "HT": "ハイチ",
    "BR": "ブラジル", "AR": "アルゼンチン", "CL": "チリ", "PE": "ペルー", "CO": "コロンビア",
    "VE": "ベネズエラ", "EC": "エクアドル", "BO": "ボリビア", "PY": "パラグアイ", "UY": "ウルグアイ",
}

# 19地域 -> 検索クエリ用の日本語語
REGION_NAME_JA = {
    "East Asia": "東アジア", "Southeast Asia": "東南アジア", "South Asia": "南アジア",
    "Central Asia": "中央アジア", "Oceania": "オセアニア", "Gulf": "中東 湾岸",
    "Levant": "中東", "Iran": "イラン", "North Africa": "北アフリカ",
    "Sub-Saharan Africa": "アフリカ", "Northern Europe": "北欧", "Western Europe": "欧州",
    "Eastern Europe": "東欧", "Ukraine": "ウクライナ", "Russia": "ロシア",
    "Balkans": "バルカン半島", "North America": "アメリカ", "Central America": "中米",
    "South America": "南米",
}

_MIL_JA = "軍事 OR 防衛 OR 安全保障 OR 紛争"
_MIL_EN = "military OR defense OR security OR conflict"
_GNEWS = "https://news.google.com/rss/search?q={q}&hl={hl}&gl={gl}&ceid={ceid}"
_CACHE: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL = 600   # 同一クエリのキャッシュ保持秒数
_MAX_ITEMS = 100   # Google News RSS が実際に返す上限に合わせて多めに取得

# 期間フィルターの選択肢（フロントの期間タブと対応）と、1ページあたりの件数
RANGE_DAYS = {"3d": 3, "1w": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365}
_PAGE_SIZE = 20


def _fetch_feed(query: str, hl: str, gl: str, ceid: str) -> list[dict]:
    """Google News RSS を取得・解析して記事リストを返す。"""
    import requests
    import feedparser
    from urllib.parse import quote

    url = _GNEWS.format(q=quote(query), hl=hl, gl=gl, ceid=ceid)
    resp = requests.get(url, headers={"User-Agent": "GeoSentinel/1.0"}, timeout=12)
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)

    out: list[dict] = []
    for e in feed.entries[:_MAX_ITEMS]:
        tp = getattr(e, "published_parsed", None)
        published = (
            dt.datetime(*tp[:6], tzinfo=dt.timezone.utc).isoformat() if tp else None
        )
        source = ""
        if getattr(e, "source", None) and getattr(e.source, "title", None):
            source = e.source.title
        import re as _re

        raw_summary = getattr(e, "summary", "") or ""
        clean_summary = _re.sub(r"<[^>]+>", " ", raw_summary)
        clean_summary = _re.sub(r"\s+", " ", clean_summary).strip()[:500]
        out.append({
            "title": getattr(e, "title", "").strip(),
            "url": getattr(e, "link", "").strip(),
            "source": source,
            "published": published,
            "summary": clean_summary,
        })
    return out


def fetch_real_news(country: str | None, region: str | None) -> list[dict]:
    """国コード or 地域名から実際のニュースを取得する（JP版→EN版の順、キャッシュ付き）。"""
    if country:
        code = country.upper()
        name_ja = COUNTRY_NAME_JA.get(code, code)
        q_ja = f"({_MIL_JA}) {name_ja}"
        q_en = f"({_MIL_EN}) {code}"
        cache_key = "c:" + code
        resolved_region = COUNTRY_REGION.get(code, region)
    else:
        name_ja = REGION_NAME_JA.get(region or "", region or "")
        q_ja = f"({_MIL_JA}) {name_ja}"
        q_en = f"({_MIL_EN}) {region or ''}"
        cache_key = "r:" + (region or "")
        resolved_region = region

    now = time.time()
    cached = _CACHE.get(cache_key)
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1]

    articles: list[dict] = []
    try:
        articles = _fetch_feed(q_ja, "ja", "JP", "JP:ja")
        if not articles:
            articles = _fetch_feed(q_en, "en-US", "US", "US:en")
    except Exception as exc:  # ネットワーク/解析失敗
        print(f"[news] 取得失敗: {exc}")
        articles = []

    for a in articles:
        a["region"] = resolved_region
        a["country"] = (country or "").upper() or None
    # 新しい記事が上に来るよう、公開日時の降順に並べ替える（未取得分は末尾）
    articles.sort(key=lambda a: a["published"] or "", reverse=True)
    _CACHE[cache_key] = (now, articles)
    return articles


def _dummy_articles(country: str | None, region: str | None) -> list[dict]:
    """取得失敗時のフォールバック用ダミーニュース（各記事に元記事URL付き）。"""
    from urllib.parse import quote

    label = country or region or "GLOBAL"
    resolved_region = (
        COUNTRY_REGION.get((country or "").upper(), region or "North America")
    )
    samples = [
        ("国防当局、地域内の軍事演習を発表（ダミー）", "military exercise"),
        ("国境地帯で緊張高まる、当局が監視強化（ダミー）", "border security"),
        ("安全保障に関する高官会談を実施（ダミー）", "defense talks"),
    ]
    # 発行時刻は ISO 8601(UTC)。フロント側で JST へ変換して表示する。
    base = dt.datetime.now(dt.timezone.utc)
    articles = []
    for i, (title, q) in enumerate(samples):
        published = (base - dt.timedelta(hours=i * 5)).isoformat()
        url = (
            "https://news.google.com/search?q="
            + quote(f"{label} {q}")
            + "&hl=ja&gl=JP&ceid=JP:ja"
        )
        articles.append({
            "title": f"[{label}] {title}",
            "source": "GeoSentinel Demo Feed",
            "region": resolved_region,
            "country": (country or "").upper() or None,
            "published": published,
            "url": url,
            "summary": "これはダミーデータです。実データは GDELT / Google News から供給予定。",
        })
    return articles


@app.get("/api")
def health() -> dict:
    return {"status": "ok", "service": "GeoSentinel API", "regions": len(REGIONS)}


@app.get("/news")
def news(
    country: str | None = Query(default=None, description="国コード 例: JP"),
    region: str | None = Query(default=None, description="地域 例: East Asia"),
    range: str = Query(default="1w", description="3d/1w/1m/3m/6m/1y"),
    page: int = Query(default=1, ge=1, description="1年など件数が多い期間向けのページ番号"),
) -> JSONResponse:
    """国コード or 地域で実ニュース（Google News RSS）を返す。失敗時はダミーで代替。

    range で公開日時を絞り込み、page で 20 件ずつページングする。
    """
    articles = fetch_real_news(country, region)
    fallback = False
    if not articles:
        articles = _dummy_articles(country, region)
        fallback = True

    days = RANGE_DAYS.get(range, RANGE_DAYS["1w"])
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)

    def _in_range(a: dict) -> bool:
        raw = a.get("published")
        if not raw:
            return True  # 公開日時不明の記事は除外しない
        try:
            pub = dt.datetime.fromisoformat(raw)
        except ValueError:
            return True
        return pub >= cutoff

    filtered = [a for a in articles if _in_range(a)]
    total = len(filtered)
    total_pages = max(1, (total + _PAGE_SIZE - 1) // _PAGE_SIZE)
    page = min(page, total_pages)
    start = (page - 1) * _PAGE_SIZE
    page_articles = filtered[start:start + _PAGE_SIZE]

    return JSONResponse(
        {
            "query": {"country": country, "region": region},
            "range": range,
            "page": page,
            "page_size": _PAGE_SIZE,
            "total": total,
            "total_pages": total_pages,
            "count": len(page_articles),
            "fallback": fallback,
            "articles": page_articles,
        }
    )


@app.get("/download/excel")
def download_excel() -> Response:
    """ダミー Excel（CSV 形式）を添付ファイルとして返す。"""
    csv_data = (
        "title,source,region,published\r\n"
        "ダミー軍事ニュースA,GeoSentinel Demo,East Asia,2026-06-27\r\n"
        "ダミー軍事ニュースB,GeoSentinel Demo,Levant,2026-06-27\r\n"
    )
    return Response(
        content=csv_data.encode("utf-8-sig"),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="geosentinel_news_dummy.csv"'},
    )


@app.get("/download/word")
def download_word() -> Response:
    """ダミー Word（テキスト形式）を添付ファイルとして返す。"""
    text = (
        "GeoSentinel 軍事ニュースまとめ（ダミー）\r\n"
        "================================\r\n\r\n"
        "1. ダミー軍事ニュースA — East Asia\r\n"
        "2. ダミー軍事ニュースB — Levant\r\n"
    )
    return Response(
        content=text.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="geosentinel_summary_dummy.txt"'},
    )


# =====================================================================
# Claude（Sonnet 4.6）による分類・要約エンドポイント
# =====================================================================
class ClassifyIn(BaseModel):
    title: str = ""
    content: str = ""


class ClassifyOut(BaseModel):
    category: str
    reason: str


class SummaryArticle(BaseModel):
    title: str = ""
    content: str = ""


class SummarizeIn(BaseModel):
    region: str
    articles: list[SummaryArticle] = []


class SummarizeOut(BaseModel):
    region: str
    summary: str


def _handle_claude_errors(exc: Exception) -> HTTPException:
    """Claude 呼び出しの例外を適切な HTTP エラーに変換する。"""
    if isinstance(exc, RuntimeError):  # APIキー未設定
        return HTTPException(status_code=503, detail=str(exc))
    if isinstance(exc, anthropic.APITimeoutError):
        return HTTPException(status_code=504, detail="Claude API がタイムアウトしました")
    if isinstance(exc, anthropic.RateLimitError):
        return HTTPException(status_code=429, detail="Claude API のレート制限に達しました")
    if isinstance(exc, anthropic.AuthenticationError):
        return HTTPException(status_code=401, detail="ANTHROPIC_API_KEY が無効です")
    if isinstance(exc, anthropic.APIError):
        return HTTPException(status_code=502, detail=f"Claude API エラー: {exc}")
    return HTTPException(status_code=500, detail=f"内部エラー: {exc}")


@app.post("/classify", response_model=ClassifyOut)
def classify_endpoint(payload: ClassifyIn) -> dict:
    """ニュースが軍事・安全保障かを分類する。"""
    try:
        return classifier.classify(payload.title, payload.content)
    except Exception as exc:  # noqa: BLE001 - まとめてHTTPエラーに変換
        raise _handle_claude_errors(exc)


@app.post("/summarize", response_model=SummarizeOut)
def summarize_endpoint(payload: SummarizeIn) -> dict:
    """地域内ニュースを 300〜500 文字で要約する。"""
    try:
        articles = [a.model_dump() for a in payload.articles]
        return summarizer.summarize(payload.region, articles)
    except Exception as exc:  # noqa: BLE001
        raise _handle_claude_errors(exc)


class NoCacheStaticFiles(StaticFiles):
    """更新後すぐ反映されるよう、ブラウザに常時再検証させる（ETag/Last-Modifiedでの304は維持）。"""

    def file_response(self, *args, **kwargs) -> Response:
        resp = super().file_response(*args, **kwargs)
        resp.headers["Cache-Control"] = "no-cache"
        return resp


# --- フロントエンド配信（API ルートの後にマウントする） ---
if FRONTEND_DIR.is_dir():
    app.mount("/", NoCacheStaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
