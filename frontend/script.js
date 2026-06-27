// GeoSentinel — Three.js 黒地球儀 + 19地域タブ + JST + 日英国名 + ニュースリンク
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import earcut from "earcut";

const API_BASE = ""; // 同一オリジン配信なら空文字

// ===== 配色（黒基調ダークテーマ） =====
const COLOR_BG = 0x02060a;
const COLOR_LAND = 0x12303d;
const COLOR_LAND_HOVER = 0x39ff88;
const COLOR_LAND_ACTIVE = 0xff5a5a;
const COLOR_BORDER = 0x4f9fc0;
const COLOR_OCEAN = 0x061018;
const GLOBE_R = 1.0;

// ===== ISO 3166-1 alpha-2 → 日本語/英語 国名辞書 =====
const countryNames = {
  JP:{ja:"日本",en:"Japan"}, CN:{ja:"中国",en:"China"}, KR:{ja:"韓国",en:"South Korea"},
  KP:{ja:"北朝鮮",en:"North Korea"}, TW:{ja:"台湾",en:"Taiwan"}, MN:{ja:"モンゴル",en:"Mongolia"},
  HK:{ja:"香港",en:"Hong Kong"},
  VN:{ja:"ベトナム",en:"Vietnam"}, PH:{ja:"フィリピン",en:"Philippines"}, ID:{ja:"インドネシア",en:"Indonesia"},
  MY:{ja:"マレーシア",en:"Malaysia"}, SG:{ja:"シンガポール",en:"Singapore"}, TH:{ja:"タイ",en:"Thailand"},
  MM:{ja:"ミャンマー",en:"Myanmar"}, KH:{ja:"カンボジア",en:"Cambodia"}, LA:{ja:"ラオス",en:"Laos"},
  BN:{ja:"ブルネイ",en:"Brunei"}, TL:{ja:"東ティモール",en:"Timor-Leste"},
  IN:{ja:"インド",en:"India"}, PK:{ja:"パキスタン",en:"Pakistan"}, BD:{ja:"バングラデシュ",en:"Bangladesh"},
  LK:{ja:"スリランカ",en:"Sri Lanka"}, NP:{ja:"ネパール",en:"Nepal"}, BT:{ja:"ブータン",en:"Bhutan"},
  MV:{ja:"モルディブ",en:"Maldives"}, AF:{ja:"アフガニスタン",en:"Afghanistan"},
  KZ:{ja:"カザフスタン",en:"Kazakhstan"}, UZ:{ja:"ウズベキスタン",en:"Uzbekistan"},
  TM:{ja:"トルクメニスタン",en:"Turkmenistan"}, KG:{ja:"キルギス",en:"Kyrgyzstan"}, TJ:{ja:"タジキスタン",en:"Tajikistan"},
  AU:{ja:"オーストラリア",en:"Australia"}, NZ:{ja:"ニュージーランド",en:"New Zealand"},
  PG:{ja:"パプアニューギニア",en:"Papua New Guinea"}, FJ:{ja:"フィジー",en:"Fiji"},
  SB:{ja:"ソロモン諸島",en:"Solomon Islands"}, VU:{ja:"バヌアツ",en:"Vanuatu"},
  SA:{ja:"サウジアラビア",en:"Saudi Arabia"}, AE:{ja:"アラブ首長国連邦",en:"United Arab Emirates"},
  QA:{ja:"カタール",en:"Qatar"}, BH:{ja:"バーレーン",en:"Bahrain"}, KW:{ja:"クウェート",en:"Kuwait"},
  OM:{ja:"オマーン",en:"Oman"}, YE:{ja:"イエメン",en:"Yemen"},
  IL:{ja:"イスラエル",en:"Israel"}, PS:{ja:"パレスチナ",en:"Palestine"}, SY:{ja:"シリア",en:"Syria"},
  LB:{ja:"レバノン",en:"Lebanon"}, JO:{ja:"ヨルダン",en:"Jordan"}, IQ:{ja:"イラク",en:"Iraq"},
  TR:{ja:"トルコ",en:"Turkey"}, IR:{ja:"イラン",en:"Iran"},
  EG:{ja:"エジプト",en:"Egypt"}, LY:{ja:"リビア",en:"Libya"}, DZ:{ja:"アルジェリア",en:"Algeria"},
  TN:{ja:"チュニジア",en:"Tunisia"}, MA:{ja:"モロッコ",en:"Morocco"},
  NG:{ja:"ナイジェリア",en:"Nigeria"}, SO:{ja:"ソマリア",en:"Somalia"}, ET:{ja:"エチオピア",en:"Ethiopia"},
  KE:{ja:"ケニア",en:"Kenya"}, UG:{ja:"ウガンダ",en:"Uganda"}, TZ:{ja:"タンザニア",en:"Tanzania"},
  CD:{ja:"コンゴ民主共和国",en:"DR Congo"}, CG:{ja:"コンゴ共和国",en:"Congo"}, ML:{ja:"マリ",en:"Mali"},
  NE:{ja:"ニジェール",en:"Niger"}, TD:{ja:"チャド",en:"Chad"}, SD:{ja:"スーダン",en:"Sudan"},
  SS:{ja:"南スーダン",en:"South Sudan"}, SN:{ja:"セネガル",en:"Senegal"}, GH:{ja:"ガーナ",en:"Ghana"},
  CI:{ja:"コートジボワール",en:"Ivory Coast"}, CM:{ja:"カメルーン",en:"Cameroon"}, ZA:{ja:"南アフリカ",en:"South Africa"},
  ZW:{ja:"ジンバブエ",en:"Zimbabwe"}, MZ:{ja:"モザンビーク",en:"Mozambique"}, AO:{ja:"アンゴラ",en:"Angola"},
  RW:{ja:"ルワンダ",en:"Rwanda"}, ER:{ja:"エリトリア",en:"Eritrea"}, BF:{ja:"ブルキナファソ",en:"Burkina Faso"},
  NO:{ja:"ノルウェー",en:"Norway"}, SE:{ja:"スウェーデン",en:"Sweden"}, FI:{ja:"フィンランド",en:"Finland"},
  DK:{ja:"デンマーク",en:"Denmark"}, IS:{ja:"アイスランド",en:"Iceland"},
  GB:{ja:"イギリス",en:"United Kingdom"}, FR:{ja:"フランス",en:"France"}, DE:{ja:"ドイツ",en:"Germany"},
  ES:{ja:"スペイン",en:"Spain"}, IT:{ja:"イタリア",en:"Italy"}, NL:{ja:"オランダ",en:"Netherlands"},
  BE:{ja:"ベルギー",en:"Belgium"}, AT:{ja:"オーストリア",en:"Austria"}, CH:{ja:"スイス",en:"Switzerland"},
  IE:{ja:"アイルランド",en:"Ireland"}, PT:{ja:"ポルトガル",en:"Portugal"},
  PL:{ja:"ポーランド",en:"Poland"}, CZ:{ja:"チェコ",en:"Czechia"}, SK:{ja:"スロバキア",en:"Slovakia"},
  HU:{ja:"ハンガリー",en:"Hungary"}, RO:{ja:"ルーマニア",en:"Romania"}, BG:{ja:"ブルガリア",en:"Bulgaria"},
  MD:{ja:"モルドバ",en:"Moldova"}, EE:{ja:"エストニア",en:"Estonia"}, LV:{ja:"ラトビア",en:"Latvia"},
  LT:{ja:"リトアニア",en:"Lithuania"}, BY:{ja:"ベラルーシ",en:"Belarus"}, SI:{ja:"スロベニア",en:"Slovenia"},
  HR:{ja:"クロアチア",en:"Croatia"},
  UA:{ja:"ウクライナ",en:"Ukraine"}, RU:{ja:"ロシア",en:"Russia"},
  RS:{ja:"セルビア",en:"Serbia"}, BA:{ja:"ボスニア・ヘルツェゴビナ",en:"Bosnia"}, XK:{ja:"コソボ",en:"Kosovo"},
  MK:{ja:"北マケドニア",en:"North Macedonia"}, ME:{ja:"モンテネグロ",en:"Montenegro"}, AL:{ja:"アルバニア",en:"Albania"},
  US:{ja:"アメリカ合衆国",en:"United States"}, CA:{ja:"カナダ",en:"Canada"},
  MX:{ja:"メキシコ",en:"Mexico"}, GT:{ja:"グアテマラ",en:"Guatemala"}, HN:{ja:"ホンジュラス",en:"Honduras"},
  SV:{ja:"エルサルバドル",en:"El Salvador"}, NI:{ja:"ニカラグア",en:"Nicaragua"}, CR:{ja:"コスタリカ",en:"Costa Rica"},
  PA:{ja:"パナマ",en:"Panama"}, CU:{ja:"キューバ",en:"Cuba"}, HT:{ja:"ハイチ",en:"Haiti"},
  DO:{ja:"ドミニカ共和国",en:"Dominican Republic"}, JM:{ja:"ジャマイカ",en:"Jamaica"},
  BR:{ja:"ブラジル",en:"Brazil"}, AR:{ja:"アルゼンチン",en:"Argentina"}, CL:{ja:"チリ",en:"Chile"},
  PE:{ja:"ペルー",en:"Peru"}, CO:{ja:"コロンビア",en:"Colombia"}, VE:{ja:"ベネズエラ",en:"Venezuela"},
  EC:{ja:"エクアドル",en:"Ecuador"}, BO:{ja:"ボリビア",en:"Bolivia"}, PY:{ja:"パラグアイ",en:"Paraguay"},
  UY:{ja:"ウルグアイ",en:"Uruguay"}, GY:{ja:"ガイアナ",en:"Guyana"}, SR:{ja:"スリナム",en:"Suriname"},
};

function displayName(iso2, fallbackEn) {
  const e = countryNames[iso2];
  if (e) return e.ja + " / " + e.en;
  return (fallbackEn || "Unknown") + " / " + (fallbackEn || "Unknown");
}

// 19地域：英語の正準名（API送信用）→ 日本語表示名
const regionJa = {
  "East Asia": "東アジア", "Southeast Asia": "東南アジア", "South Asia": "南アジア",
  "Central Asia": "中央アジア", "Oceania": "オセアニア", "Gulf": "湾岸地域",
  "Levant": "レバント", "Iran": "イラン", "North Africa": "北アフリカ",
  "Sub-Saharan Africa": "サハラ以南アフリカ", "Northern Europe": "北ヨーロッパ",
  "Western Europe": "西ヨーロッパ", "Eastern Europe": "東ヨーロッパ",
  "Ukraine": "ウクライナ", "Russia": "ロシア", "Balkans": "バルカン半島",
  "North America": "北アメリカ", "Central America": "中央アメリカ", "South America": "南アメリカ",
};

// ===== JST 表示ユーティリティ =====
function formatJST(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = {};
  parts.forEach((p) => (g[p.type] = p.value));
  return `${g.year}/${g.month}/${g.day} ${g.hour}:${g.minute}（JST）`;
}

function tickClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const t = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit",
    second: "2-digit", hour12: false,
  }).format(new Date());
  el.textContent = t + " JST";
}
setInterval(tickClock, 1000);
tickClock();

// ===== Three.js =====
let scene, camera, renderer, controls, raycaster, pointer;
let countryMeshes = [];
let globeSphere = null; // 海（地球本体）。レイの遮蔽体として使う
let hovered = null, selected = null;
let panelBody, panelRegion, panelTitle, newsPanel;
let summaryPanel, summaryBody, summaryRegion;

// 検索・ズーム用
const countryByIso = {}; // ISO2 -> Mesh
let searchIndex = [];     // [{iso2, ja, en, mesh}]
let flyTarget = null;     // カメラのズーム先（Vector3）
const ZOOM_DIST = 1.85;   // ズーム時のカメラ距離

function lonLatToVec3(lon, lat, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// 大きな三角形は球の内側にめり込み海球に隠れて「黒い穴」になるため、
// 経度緯度平面で適応的に細分割し、各頂点を球面に投影して球に沿わせる。
const _MAX_EDGE_DEG = 6;   // この角度を超える辺を持つ三角形は分割
const _MAX_DEPTH = 6;
function _emitTriangle(p0, p1, p2, positions, depth) {
  const e01 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]);
  const e12 = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
  const e20 = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
  if (depth < _MAX_DEPTH && (e01 > _MAX_EDGE_DEG || e12 > _MAX_EDGE_DEG || e20 > _MAX_EDGE_DEG)) {
    const m01 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    const m12 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const m20 = [(p2[0] + p0[0]) / 2, (p2[1] + p0[1]) / 2];
    _emitTriangle(p0, m01, m20, positions, depth + 1);
    _emitTriangle(m01, p1, m12, positions, depth + 1);
    _emitTriangle(m20, m12, p2, positions, depth + 1);
    _emitTriangle(m01, m12, m20, positions, depth + 1);
  } else {
    for (const p of [p0, p1, p2]) {
      const v = lonLatToVec3(p[0], p[1], GLOBE_R);
      positions.push(v.x, v.y, v.z);
    }
  }
}

function unwrapRing(ring) {
  const out = [];
  let prevLon = ring[0][0];
  for (let i = 0; i < ring.length; i++) {
    let lon = ring[i][0];
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    out.push([lon, ring[i][1]]);
    prevLon = lon;
  }
  return out;
}

function getISO2(props) {
  const eh = props.ISO_A2_EH;
  if (eh && eh !== "-99") return eh;
  const a2 = props.ISO_A2;
  if (a2 && a2 !== "-99") return a2;
  return null;
}

// 閉じたリング（先頭==末尾）の重複末尾を除去する
function openRing(ring) {
  if (ring.length > 1) {
    const a = ring[0], b = ring[ring.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) return ring.slice(0, -1);
  }
  return ring;
}

function buildCountry(feature, bordersPositions) {
  const props = feature.properties || {};
  const geom = feature.geometry;
  if (!geom) return null;
  const polygons =
    geom.type === "Polygon" ? [geom.coordinates]
    : geom.type === "MultiPolygon" ? geom.coordinates : [];

  const positions = [];
  for (const polygon of polygons) {
    if (!polygon.length) continue;

    // 各リングをアンチメリディアン連続化 → 末尾重複を除去
    const rings = polygon.map((r) => openRing(unwrapRing(r)));
    const outer = rings[0];
    if (!outer || outer.length < 3) continue;

    // earcut 用に [x,y, x,y, ...] へ平坦化し、holes の開始インデックスを記録
    const flat = [];
    const holeIndices = [];
    for (const [lon, lat] of outer) flat.push(lon, lat);
    for (let h = 1; h < rings.length; h++) {
      const hole = rings[h];
      if (!hole || hole.length < 3) continue;
      holeIndices.push(flat.length / 2);
      for (const [lon, lat] of hole) flat.push(lon, lat);
    }

    // 三角形分割（holes 対応）。earcut は例外を投げず欠損を防ぐ。
    const tris = earcut(flat, holeIndices, 2);
    if (!tris.length) continue;

    // 各三角形を適応的に細分割して球面に投影（黒い穴対策）
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t] * 2, b = tris[t + 1] * 2, c = tris[t + 2] * 2;
      _emitTriangle(
        [flat[a], flat[a + 1]],
        [flat[b], flat[b + 1]],
        [flat[c], flat[c + 1]],
        positions, 0
      );
    }

    // 国境線（元の閉リングをそのまま線分化、半径を僅かに上げる）
    for (const ring of rings) {
      const closed = ring.concat([ring[0]]); // 線を閉じる
      for (let i = 0; i < closed.length - 1; i++) {
        const a = lonLatToVec3(closed[i][0], closed[i][1], GLOBE_R * 1.001);
        const b = lonLatToVec3(closed[i + 1][0], closed[i + 1][1], GLOBE_R * 1.001);
        bordersPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
  }
  if (!positions.length) return null;

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mesh = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ color: COLOR_LAND, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
  );
  // 重心（球面上の方向）を計算 → 検索ズームのカメラ向きに使う
  let cx = 0, cy = 0, cz = 0;
  const vn = positions.length / 3;
  for (let i = 0; i < positions.length; i += 3) {
    cx += positions[i]; cy += positions[i + 1]; cz += positions[i + 2];
  }
  const center3 = new THREE.Vector3(cx / vn, cy / vn, cz / vn);
  if (center3.lengthSq() > 0) center3.normalize();

  mesh.userData = {
    iso2: getISO2(props),
    name: props.ADMIN || props.NAME || "Unknown",
    continent: props.CONTINENT || "",
    baseColor: COLOR_LAND,
    center3,
  };
  return mesh;
}

function initScene() {
  const canvas = document.getElementById("globe");
  const W = window.innerWidth, H = window.innerHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR_BG);

  camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  camera.position.set(0, 0.5, 3.2);

  // 既存の <canvas id="globe"> にアタッチし、ウィンドウサイズに合わせる
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);

  // 海（地球本体）。国Meshよりわずかに小さく、レイ遮蔽体として参照を保持。
  globeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R * 0.99, 64, 64),
    new THREE.MeshBasicMaterial({ color: COLOR_OCEAN })
  );
  scene.add(globeSphere);
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R * 1.002, 36, 18),
    new THREE.MeshBasicMaterial({ color: 0x0e2b38, wireframe: true, transparent: true, opacity: 0.22 })
  ));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.enablePan = true;
  controls.minDistance = 1.3;
  controls.maxDistance = 8;

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  window.addEventListener("resize", onResize);
}

function onResize() {
  const W = window.innerWidth, H = window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H, false);
}

async function loadGeoJSON() {
  const res = await fetch("assets/world.geojson", { cache: "force-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();

  const group = new THREE.Group();
  const bordersPositions = [];
  for (const feature of data.features) {
    const mesh = buildCountry(feature, bordersPositions);
    if (mesh) {
      group.add(mesh);
      countryMeshes.push(mesh);
      if (mesh.userData.iso2) countryByIso[mesh.userData.iso2] = mesh;
    }
  }
  scene.add(group);

  // 検索インデックス（ISO2 / 日本語名 / 英語名）を構築
  searchIndex = Object.keys(countryByIso).map((iso2) => {
    const mesh = countryByIso[iso2];
    const en = mesh.userData.name || iso2;
    const ja = (countryNames[iso2] && countryNames[iso2].ja) || en;
    return { iso2, ja, en, mesh };
  });

  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute(bordersPositions, 3));
  scene.add(new THREE.LineSegments(
    bg,
    new THREE.LineBasicMaterial({ color: COLOR_BORDER, transparent: true, opacity: 0.55 })
  ));

  const loading = document.getElementById("globe-loading");
  if (loading) loading.style.display = "none";
}

// ポインタ位置から最前面の国を判定する。
// 海（globeSphere）も対象に含め、最前面が海/無なら null（＝海クリック）を返す。
// これにより、地球を貫通して裏側の国を誤選択する問題を防ぐ。
function pickCountry(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = globeSphere ? [globeSphere, ...countryMeshes] : countryMeshes;
  const hits = raycaster.intersectObjects(targets, false); // 距離昇順
  if (!hits.length) return null;
  const first = hits[0].object;
  return first === globeSphere ? null : first; // 最前面が海なら選択なし
}

// ===== ホバー =====
function onPointerMove(e) {
  const top = pickCountry(e);
  if (hovered && hovered !== top && hovered !== selected) {
    hovered.material.color.setHex(hovered.userData.baseColor);
  }
  if (top && top !== selected) {
    top.material.color.setHex(COLOR_LAND_HOVER);
    renderer.domElement.style.cursor = "pointer";
  } else if (!top) {
    renderer.domElement.style.cursor = "grab";
  }
  hovered = top;
}

// ===== クリック（ドラッグ除外） =====
let downPos = null;
function onPointerDown(e) { downPos = { x: e.clientX, y: e.clientY }; }
function onPointerUp(e) {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return;
  const target = pickCountry(e);
  if (target) {
    selectCountry(target);
  } else {
    deselect(); // 海をクリック → 選択なし
  }
}

function deselect() {
  if (selected) {
    selected.material.color.setHex(selected.userData.baseColor);
    selected = null;
  }
  panelTitle.textContent = "REGIONAL FEED";
  panelRegion.textContent = "—";
  panelBody.innerHTML =
    '<p class="panel-hint">地球儀上の国にカーソルを合わせるとハイライトされます。国をクリック、または下部の地域タブを選ぶと、ここにニュースが表示されます。</p>';
  hideSummary();
  closePanel(); // 海クリックでパネルをスライドアウト
}

// ===== ニュースパネルの開閉（スライド） =====
function openPanel() {
  if (newsPanel) newsPanel.classList.remove("panel-hidden");
}
function closePanel() {
  if (newsPanel) newsPanel.classList.add("panel-hidden");
}

function selectCountry(mesh) {
  if (selected && selected !== mesh) selected.material.color.setHex(selected.userData.baseColor);
  selected = mesh;
  mesh.material.color.setHex(COLOR_LAND_ACTIVE);
  clearActiveTab();
  const { iso2, name, continent } = mesh.userData;
  showCountry(iso2, name, continent);
}

// ===== API ヘルパー =====
async function apiPost(path, body) {
  const r = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// ===== パネル：国別（取得 → /classify で軍事のみ抽出 → /summarize） =====
async function showCountry(iso2, name, continent) {
  openPanel(); // 国選択時は自動でスライドイン
  hideSummary(); // 国選択時は要約パネルを非表示にする
  const label = displayName(iso2, name);
  panelTitle.textContent = label;
  panelRegion.textContent = iso2 || continent || "—";
  panelBody.innerHTML =
    '<div class="panel-placeholder">' + esc(label) +
    (iso2 ? " / " + iso2 : "") + " のニュースを取得中…</div>";
  if (!iso2) {
    panelBody.innerHTML += '<p class="panel-hint" style="color:var(--muted)">（この地域は国コード未割当のため取得をスキップ）</p>';
    return;
  }
  await loadFeed("/news?country=" + encodeURIComponent(iso2), label, {
    region: name, classify: true,
  });
}

// ===== パネル：地域別（取得 → /summarize） =====
async function showRegion(region) {
  openPanel();
  // 「日本」タブは国コードJPでニュース取得し、ラベルも日本語にする
  const isJapan = region === "Japan";
  const ja = isJapan ? "日本" : (regionJa[region] || region);
  panelTitle.textContent = ja;
  panelRegion.textContent = "地域";
  panelBody.innerHTML =
    '<div class="panel-placeholder">' +
    (isJapan ? "日本の今日のまとめを取得中…" : "地域「" + esc(ja) + "」のニュースを取得中…") +
    "</div>";
  const path = isJapan
    ? "/news?country=JP"
    : "/news?region=" + encodeURIComponent(region);
  // 表示は日本語、要約APIへは英語の正準地域名（日本は "日本"）を送る
  await loadFeed(path, ja, { region: isJapan ? "日本" : region, classify: false });
}

// ニュース取得 →（分類）→ 要約 → 右パネルに記事一覧、下部に地域要約
async function loadFeed(path, label, opts) {
  const region = opts.region || label;
  let articles = [];
  try {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    articles = data.articles || [];
  } catch (err) {
    renderPanel(label, [], "ニュース取得に失敗: " + err.message);
    showSummaryStatus(label, "ニュース取得に失敗しました");
    return;
  }
  if (!articles.length) {
    renderPanel(label, [], "該当ニュースなし。");
    showSummaryStatus(label, "該当ニュースなし");
    return;
  }

  // まず記事一覧を右パネルに即時表示
  let used = articles.slice(0, 8);
  renderPanel(label, used, "");

  // 国クリック時のみ：/classify で軍事・安全保障ニュースだけ抽出
  if (opts.classify) {
    const flags = await Promise.all(used.map(classifyArticle));
    const filtered = used.filter((_, i) => flags[i]);
    used = filtered.length ? filtered : used; // 全滅時は元のまま
    if (!used.length) {
      renderPanel(label, [], "軍事・安全保障ニュースは見つかりませんでした。");
      return;
    }
    renderPanel(label, used, "");
  }

  // /summarize で地域要約を生成（地域タブのみ、国クリック時はスキップ）
  if (!opts.classify) {
    showSummaryStatus(label, "要約を生成中…");
    try {
      const sum = await apiPost("/summarize", {
        region,
        articles: used.map((a) => ({
          title: a.title || "",
          content: a.summary || a.content || "",
        })),
      });
      showSummary(label, sum.summary || "（要約が空でした）");
    } catch (err) {
      showSummaryStatus(label, "要約APIに接続できません: " + err.message);
    }
  }
}

// 1記事を分類し is_military を返す（失敗時は true=残す）
async function classifyArticle(a) {
  try {
    const res = await apiPost("/classify", {
      title: a.title || "",
      content: a.summary || a.content || "",
    });
    return !!res.is_military;
  } catch (e) {
    return true;
  }
}

// 右パネル：記事カード（リンク付き）
function renderPanel(label, articles, note) {
  let html = '<div class="panel-placeholder">' + esc(label) + " — " + articles.length + " 件</div>";
  if (note) {
    html += '<p class="panel-hint" style="color:var(--muted)">' + esc(note) + "</p>";
  }
  for (const a of articles) {
    const url = a.url || a.link || "#";
    const when = formatJST(a.published);
    html +=
      '<div class="news-item"><a class="ni-link" href="' + esc(url) +
      '" target="_blank" rel="noopener noreferrer">' + esc(a.title) + "</a>" +
      '<div class="ni-meta">' + esc(a.source || "") +
      (a.region ? " · " + esc(a.region) : "") +
      (when ? " · " + esc(when) : "") + "</div></div>";
  }
  panelBody.innerHTML = html;
}

// ===== 下部：地域要約パネル =====
function showSummary(label, text) {
  if (!summaryPanel) return;
  summaryRegion.textContent = label;
  summaryBody.innerHTML = esc(text).replace(/\n/g, "<br>");
  summaryPanel.hidden = false;
}
function showSummaryStatus(label, note) {
  if (!summaryPanel) return;
  summaryRegion.textContent = label;
  summaryBody.innerHTML = '<span class="summary-status">' + esc(note) + "</span>";
  summaryPanel.hidden = false;
}
function hideSummary() {
  if (summaryPanel) summaryPanel.hidden = true;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

// ===== 地域タブ =====
function clearActiveTab() {
  document.querySelectorAll(".region-tab.active").forEach((b) => b.classList.remove("active"));
}
function bindRegionTabs() {
  document.querySelectorAll(".region-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearActiveTab();
      btn.classList.add("active");
      if (selected) { selected.material.color.setHex(selected.userData.baseColor); selected = null; }
      showRegion(btn.dataset.region);
    });
  });
}

function animate() {
  requestAnimationFrame(animate);
  // 検索ズーム：カメラを対象国の方向へ滑らかに移動
  if (flyTarget) {
    camera.position.lerp(flyTarget, 0.12);
    if (camera.position.distanceTo(flyTarget) < 0.02) flyTarget = null;
  }
  controls.update();
  renderer.render(scene, camera);
}

// 対象国の中心へカメラをズーム（描画ループで補間）
function flyToCountry(mesh) {
  const c = mesh.userData.center3;
  if (c && c.lengthSq() > 0) flyTarget = c.clone().multiplyScalar(ZOOM_DIST);
}

// ===== 国名検索バー（日本語/英語、サジェスト付き） =====
function bindSearch() {
  const input = document.getElementById("country-search");
  const box = document.getElementById("search-suggestions");
  if (!input || !box) return;

  let matches = [];
  let activeIdx = -1;

  function render() {
    if (!matches.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.innerHTML = matches.map((m, i) =>
      '<div class="search-item' + (i === activeIdx ? " active" : "") +
      '" data-iso="' + m.iso2 + '"><span>' + esc(m.ja) +
      (m.ja !== m.en ? " / " + esc(m.en) : "") +
      '</span><span class="si-code">' + esc(m.iso2) + "</span></div>"
    ).join("");
    box.hidden = false;
  }

  function search(q) {
    const s = q.trim().toLowerCase();
    if (!s) { matches = []; activeIdx = -1; render(); return; }
    matches = searchIndex.filter((m) =>
      m.ja.toLowerCase().includes(s) ||
      m.en.toLowerCase().includes(s) ||
      m.iso2.toLowerCase().includes(s)
    ).slice(0, 8);
    activeIdx = matches.length ? 0 : -1;
    render();
  }

  function choose(iso2) {
    const mesh = countryByIso[iso2];
    box.hidden = true;
    if (!mesh) return;
    input.value = "";
    selectCountry(mesh); // クリックと同じ処理（ハイライト＋ニュース取得）
    flyToCountry(mesh);  // 国の中心へズーム
  }

  input.addEventListener("input", () => search(input.value));
  input.addEventListener("focus", () => { if (input.value) search(input.value); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { activeIdx = Math.min(activeIdx + 1, matches.length - 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { activeIdx = Math.max(activeIdx - 1, 0); render(); e.preventDefault(); }
    else if (e.key === "Enter") { if (activeIdx >= 0 && matches[activeIdx]) choose(matches[activeIdx].iso2); }
    else if (e.key === "Escape") { box.hidden = true; }
  });
  box.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (item) choose(item.dataset.iso);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) box.hidden = true;
  });
}

// ===== 起動（DOM 読み込み後） =====
async function main() {
  panelBody = document.getElementById("panel-body");
  panelRegion = document.getElementById("panel-region");
  panelTitle = document.getElementById("panel-title");
  newsPanel = document.getElementById("news-panel");
  summaryPanel = document.getElementById("summary-panel");
  summaryBody = document.getElementById("summary-body");
  summaryRegion = document.getElementById("summary-region");
  const summaryClose = document.getElementById("summary-close");
  if (summaryClose) summaryClose.addEventListener("click", hideSummary);
  const panelClose = document.getElementById("panel-close");
  if (panelClose) panelClose.addEventListener("click", closePanel);
  closePanel(); // 起動時はパネルを隠した状態にする
  bindRegionTabs();
  bindSearch();
  try {
    initScene();
    await loadGeoJSON();
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    animate();
  } catch (err) {
    console.error(err);
    const loading = document.getElementById("globe-loading");
    if (loading) loading.textContent = "GLOBE INIT FAILED: " + err.message;
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
