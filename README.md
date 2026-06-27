# GeoSentinel — 軍事・地政学インテリジェンス

軍事ニュースAIエージェントの公開フロントエンド + FastAPI バックエンド（Render デプロイ対応の最小構成）。
中央に黒い世界地図、将来的に Three.js の黒い3D地球儀へ差し替え可能な構造。

## ドメイン名案（10案）

| # | ドメイン案 | 補足 |
|---|---|---|
| 1 | **geosentinel.io** | ← 採用（仮サービス名 GeoSentinel）。地球＋監視哨 |
| 2 | blackglobe.io | 黒い地球儀のビジュアルに直結 |
| 3 | warwatch.ai | 紛争モニタリング |
| 4 | aegisintel.com | 盾（Aegis）＝防衛情報 |
| 5 | geostrata.io | 地政学レイヤー分析 |
| 6 | terrasentry.com | 地球規模の見張り |
| 7 | orbitalrecon.io | 軌道偵察 |
| 8 | defconmap.com | DEFCON＋マップ |
| 9 | stratintel.io | Strategic Intelligence |
| 10 | sentinelglobe.com | 監視哨＋地球 |

**採用：GeoSentinel（geosentinel.io）** — `frontend/index.html` の `<title>` に設定済み。

## ディレクトリ構成

```
military-news-web/
├── frontend/
│   ├── index.html        # ダークHUD UI（Three.js統合用の #globe-layer を内包）
│   ├── style.css         # 黒基調・未来的テーマ
│   ├── script.js         # SVG読込・hover/クリック・/news 取得
│   └── assets/
│       └── worldmap.svg  # 黒い世界地図＋国ノード
├── backend/
│   ├── main.py           # FastAPI（/news, /download/*, フロント配信）
│   └── requirements.txt
├── render.yaml           # Render IaC（推奨）
├── Procfile              # 代替起動定義
├── requirements.txt      # ルートのフォールバック
└── README.md
```

## ローカル起動

```bash
cd military-news-web
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000 でフロントとAPIが同一オリジンで動作
```

> 注意: `worldmap.svg` は `fetch` で読み込むため、`index.html` を file:// で直接開くと
> 地図が表示されません。必ず上記サーバ経由で開いてください。

## API

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/news?country=JP` | 国コード指定のダミーニュース |
| GET | `/news?region=EastAsia` | 地域指定のダミーニュース |
| GET | `/download/excel` | ダミー Excel(CSV) ダウンロード |
| GET | `/download/word` | ダミー Word(TXT) ダウンロード |
| GET | `/api` | ヘルスチェック |

## Render デプロイ手順

1. このフォルダを Git リポジトリにして GitHub へ push
2. Render ダッシュボード → **New +** → **Blueprint**（`render.yaml` を自動検出）
   - もしくは **New Web Service** を選び、手動設定:
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. デプロイ完了後、`https://<service>.onrender.com/` で公開

## Three.js 統合の道筋

- `frontend/index.html` の `#globe-layer`（`.map-stage` 内・SVGの上層）に Three.js キャンバスをマウント
- `frontend/script.js` の `initGlobe()` で初期化し、完了後に `#map-layer` をフェード切替
- 国ノードの `data-code` / `data-region` をそのまま3D地球儀のクリック対象に流用可能
