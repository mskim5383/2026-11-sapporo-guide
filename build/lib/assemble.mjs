// 원고 조립: book.json 순서대로 src/front + src/parts 조각을 template 에 끼워 한 장의 HTML 을 만든다.
// 같은 HTML 이 웹(dist/index.html)이자 인쇄 원본이다. 인쇄 패스마다 state(목차 쪽번호, 메모 페이지 수,
// 쪽 찾기용 앵커)를 바꿔 다시 조립한다.
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { parseHTML } from 'linkedom';
import { readText, exists, stripComments, escapeHtml, cssString, imageSize, outputNames } from './util.mjs';

// 장소 카드 「지도」 QR·링크. 공식 Maps URL(…/maps/search/?api=1&query=)보다 21자 짧은 q= 형식을 쓴다.
// 일본어 검색어는 글자마다 %XX 9바이트가 되어 QR 버전이 커지므로(인쇄 감리 r1: v7 이상 판독 실패), 공백도 + 로.
const MAPS = 'https://maps.google.com/?q=';
const mapsUrl = (q) => MAPS + encodeURIComponent(q.trim()).replace(/%20/g, '+');

// BRIEF 4장 컴포넌트 규약에 있는 클래스. 이 밖의 클래스는 경고만 한다.
// 삿포로판(04) 갱신: 리뷰·바·생산자·병 카드·확률·좌표 배지·시킬 것·전화 카드를 더하고,
// 나고야판 전용(가금류 알러지 eat·fowl-*, 잘라 쓰는 카드 cut-*·cc-*)은 뺐다(BRIEF 3-8 A-1, 4-17).
const KNOWN_CLASSES = new Set([
  'part', 'part-head', 'kicker', 'part-title', 'dek', 'lede', 'byline', 'pull', 'box', 'tip', 'warn', 'star', 'alt',
  'note', 'sidenote', 'timeline', 't', 'what', 'sub', 'fixed', 'dish', 'place',
  'place-name', 'reading', 'facts', 'tags', 'tag', 'open', 'closed', 'cash', 'card', 'rsv', 'queue', 'taxfree',
  'qr', 'photo',
  'wide', 'half', 'full', 'map', 'chart', 'data', 'o', 'x', 'q', 'na', 'hl', 'phrases', 'ja', 'pron', 'check', 'verify', 'memo-lines',
  'web-only', 'print-only',
  // 잡지형 머리: 오프너(사진 + 「한눈에」), 숫자 강조, 하우투 단계(리뷰 카드 안은 compact)
  'opener', 'glance', 'stats', 'stat', 'stat-n', 'stat-l', 'steps', 'compact',
  // 리뷰 카드(가게), 바 카드와 밤 표시, 좌표 배지
  'review', 'rv-why', 'menu', 'price', 'bar', 'nights', 'grid',
  // 생산자 프로필, 병 카드, 만날 확률
  'producer', 'pr-meta', 'bottle', 'b-no', 'b-name', 'b-maker', 'b-spec', 'b-note', 'odds',
  // 손으로 적는 칸
  'fill', 'blank',
  // 독음(발행인 지시 2026-11-08): 의도적으로 원문만 두는 곳(독음 검사 제외)
  'no-reading',
  // 보여 주는 카드, 전화 카드(줄마다 일본어·발음·뜻)
  'show-card', 'dest', 'sc-when', 'sc-ja', 'sc-pron', 'sc-ko', 'dest-list', 'call', 'call-lines',
  // 조판 힌트(아트 디렉터): 지도 높이 상한 낮추기, 쪽 사이에서 가르지 않기, 이 앞에서 쪽 나누기
  'short', 'shorter', 'keep', 'break-before',
  // 쪽 참조 괄호: 쪽번호가 비면 빌드가 통째로 지우고, 웹에서는 숨긴다
  'pageref-wrap',
]);

// 전화번호(0859-44-5489, +81-82-505-2100 …)는 하이픈 뒤에서 줄이 갈리지 않게 감싼다.
const PHONE = /(?:\+\d{1,3}-)?\d{2,5}-\d{1,4}-\d{3,4}(?![\d-])/g;
function wrapPhones(html) {
  return html.replace(/>([^<]+)</g, (m, text) => '>' + text.replace(PHONE, (x) => `<span class="nobr">${x}</span>`) + '<');
}

// 짧은 표는 쪽 사이에서 가르지 않는다(본문 행 수가 이 값 이하일 때 .table-wrap.keep).
const KEEP_TABLE_ROWS = 8;

// 오른쪽 쪽 러닝헤드: data-toc 가 이 글자 수 이하면 부제까지, 넘으면 제목만
const RUN_MAX = 34;

// 차례·러닝헤드·웹 목차에 쓰는 원고 제목(data-toc·data-run·book.json 묶음 이름)의 일본어 옆에 한글 소리를 붙인다
// (발행인 지시 2026-11-08: 한자·일본어 옆에는 매번 한글 소리). 원어 바로 뒤에 이미 괄호 한글이 있으면 그대로 둔다.
// 표기는 BRIEF 2-14 독음 통일표를 따른다(삿포로판). 원고는 data-toc·data-run 에 괄호 독음을 직접 붙이므로
// 이 표는 안전망이다. 여기에 없는 일본어가 제목에 나오면 빌드가 경고한다(여기에 더하거나 원고 data-toc 에 괄호 독음).
// 키는 가나·한자가 이어진 한 덩어리(JA_WORD) 그대로다(예: 「木多郎 澄川本店」은 木多郎 / 澄川本店 두 덩어리).
const READINGS = {
  // 지명·역·노선
  '札幌': '삿포로', '北海道': '홋카이도', '新千歳': '신치토세', '新千歳空港': '신치토세 공항', '大通': '오도리',
  '大通公園': '오도리 공원', 'すすきの': '스스키노', '狸小路': '다누키코지', '中島公園': '나카지마 공원',
  '澄川': '스미카와', '苗穂': '나에보', '赤れんが庁舎': '아카렌가 청사', '登別': '노보리베쓰', '市電': '시전',
  '勤労感謝の日': '근로감사의 날',
  // 숙소·식당·바
  '由縁': '유엔', '夏下冬上': '가카토조', 'さえら': '사에라', '木多郎': '기타로', '鍾馗': '쇼키', '麺': '멘', '本店': '본점',
  'すしどんぶり': '스시돈부리', '餃子製造所': '교자 세이조쇼', '魚菜': '교사이', '鷄灯': '게이토',
  'もろはく': '모로하쿠', 'ばんなちゅ': '반나추', 'かま田': '가마타', '吉翔': '깃쇼', 'まる田': '마루타',
  // 술 가게·볼거리
  '丸市桜本商店': '마루이치 사쿠라모토 상점', '桜本': '사쿠라모토', 'いとう': '이토', 'フジヰ': '후지이',
  '千歳鶴': '지토세쓰루', 'ミュンヘン': '뮌헨', 'クリスマス市': '크리스마스 이치', 'アカチャンホンポ': '아카찬혼포',
  'ロイヤルラウンジ': '로열 라운지', 'そらくうはん': '소라쿠한',
  // 와인
  '余市': '요이치', '余市町': '요이치초', '登': '노보리', '仁木': '니키', '空知': '소라치', '岩見沢': '이와미자와', '三笠': '미카사',
  '函館': '하코다테', '十勝': '도카치', '富良野': '후라노', '曽我貴彦': '소가 다카히코', '登醸造': '노보리 양조',
  // 사케
  '酒米': '주미', '精米歩合': '정미보합', '新酒': '신주', '生酒': '생주', '原酒': '원주', '純米': '순미',
  '吟醸': '음양', '大吟醸': '대음양', '純米吟醸': '순미음양', '純米大吟醸': '순미대음양', 'ひやおろし': '히야오로시',
  'しぼりたて': '시보리타테', '杉玉': '스기다마', '吟風': '긴푸', '彗星': '스이세이', 'きたしずく': '기타시즈쿠',
  // 메뉴
  'スープカレー': '수프카레', '海鮮丼': '가이센동', '餃子': '교자',
};
const JA_WORD = /[\u3005\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g;
function withReadings(text, missing) {
  if (!text) return text;
  return text.replace(JA_WORD, (m, i, str) => {
    if (/^\s*[(（][^)）]*[\uac00-\ud7a3]/.test(str.slice(i + m.length))) return m;
    const r = READINGS[m];
    if (!r) { missing?.add(m); return m; }
    return `${m}(${r})`;
  });
}

// 쪽 바깥 여백 탭의 세로 위치(위 여백 16mm 아래에서부터, mm): Day 1~5 는 22mm 간격, 카드 묶음은 아래쪽
const TAB_Y0 = 8;
const TAB_STEP = 22;
const TAB_Y_LOW = 128;

const DEFAULT_SERIF_KINDS = ['letter', 'feature', 'review'];

// 특집 오프너 대체 띠의 큰 숫자(사진이 없을 때만). 원고 id → [숫자, 한 줄 설명]. 값은 BRIEF 1장·2-11 그대로.
const OPENER_FIGURES = {
  'feat-wine': ['1991', 'Bruce Gutlove 가 야생효모 발효를 들여온 해'],
  'feat-sake': ['17', '홋카이도 주조 조합의 니혼슈 양조장 수'],
};

// 쪽 바깥 여백 탭 색(인쇄): Day(D1~D4)는 style.css 기본(청회색), 「가게」는 포도색, 「카드」는 먹.
const TAB_BG = { cards: '#16191d' };
const TAB_BG_OTHER = '#6b1d33';

/** assets/img/manifest.json 을 id → entry 맵으로. 여러 모양을 받아 준다. */
export function loadManifest(assetsDir, log) {
  const file = path.join(assetsDir, 'img', 'manifest.json');
  const map = new Map();
  if (!exists(file)) return map;
  let data;
  try { data = JSON.parse(readText(file)); } catch (e) { log.warn(`manifest.json 파싱 실패: ${e.message}`); return map; }
  const list = Array.isArray(data) ? data
    : Array.isArray(data.images) ? data.images
      : data.images && typeof data.images === 'object' ? Object.entries(data.images).map(([id, v]) => ({ id, ...v }))
        : Object.entries(data).filter(([, v]) => v && typeof v === 'object').map(([id, v]) => ({ id, ...v }));
  for (const e of list) if (e && e.id) map.set(e.id, e);
  return map;
}

// 한글 문맥 안의 일본어(가나·한자) 덩어리를 lang="ja" 로 감싼다(크레디트 작가명, QR 라벨 등 빌드가 만드는 글자)
const JA_RUN = /[\u3005\u3006\u303b\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+(?:[\s・·ー]*[\u3005\u3006\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+)*/g;
function langJa(text) {
  return escapeHtml(text).replace(JA_RUN, (m) => `<span lang="ja">${m}</span>`);
}

function creditLine(e) {
  if (typeof e.credit === 'string' && e.credit.trim()) return e.credit.trim();
  const who = e.author || e.artist || e.by || e.creator || e.photographer;
  const lic = e.license || e.licence;
  const parts = [who, lic].filter(Boolean);
  return parts.length ? `사진 ${parts.join(' · ')}` : '';
}

/** 인라인 SVG 준비: 선언 제거, id 접두어, 내부 <style> 범위 한정, 루트 속성 정리 */
export function prepareSvg(raw, prefix, { label = '', cls = '' } = {}) {
  let s = raw
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();
  const ids = new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const pre = (id) => (ids.has(id) ? `${prefix}-${id}` : id);
  s = s.replace(/(\sid=")([^"]+)(")/g, (_, a, id, b) => a + pre(id) + b);
  s = s.replace(/url\(\s*#([^)\s]+)\s*\)/g, (_, id) => `url(#${pre(id)})`);
  s = s.replace(/((?:xlink:)?href=")#([^"]+)"/g, (_, a, id) => `${a}#${pre(id)}"`);
  const rootId = `${prefix}-root`;
  // 내부 스타일시트는 문서 전체에 새므로 루트 id 아래로 가둔다.
  s = s.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, css, close) => {
    const scoped = css.replace(/(^|})(\s*)([^{}@][^{}]*?)(\s*){/g, (m, brace, ws, sel, ws2) => {
      const fixed = sel.split(',').map((x) => {
        const t = x.trim().replace(/#([A-Za-z_][\w-]*)/g, (mm, id) => `#${pre(id)}`);
        if (!t || /^(from|to|\d+%)$/.test(t)) return t;
        return `#${rootId} ${t}`;
      }).join(', ');
      return `${brace}${ws}${fixed}${ws2}{`;
    });
    return open + scoped + close;
  });
  // 루트 <svg ...> 속성 정리
  s = s.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    let a = attrs;
    const w = a.match(/\swidth="([\d.]+)(?:px)?"/)?.[1];
    const h = a.match(/\sheight="([\d.]+)(?:px)?"/)?.[1];
    if (!/viewBox=/.test(a) && w && h) a += ` viewBox="0 0 ${w} ${h}"`;
    a = a.replace(/\s(width|height)="[^"]*"/g, '').replace(/\sid="[^"]*"/, '').replace(/\sclass="[^"]*"/, '');
    const aria = label ? ` role="img" aria-label="${escapeHtml(label)}"` : ' aria-hidden="true"';
    return `<svg id="${rootId}" class="${cls}"${a}${aria}>`;
  });
  return s;
}

// QR: 모듈을 칸 채우기(fill) 경로로 그린다. qrcode 라이브러리의 SVG 는 행마다 stroke 선이라
// Chrome PDF 에서 버전 7 이상이 가는 빗금으로 나와 판독되지 않았다(인쇄 감리 r1).
// 오류 정정은 M 을 쓰되, 버전이 6을 넘으면 L 로 낮춰 버전(=모듈 수)을 줄인다.
const QR_MAX_V = 6;
const QR_MARGIN = 1;
const QR_INK = '#1e2a33';
function qrModel(text) {
  let qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  if (qr.version > QR_MAX_V) {
    const low = QRCode.create(text, { errorCorrectionLevel: 'L' });
    if (low.version < qr.version) qr = low;
  }
  return qr;
}
function qrSvg(text) {
  const qr = qrModel(text);
  const n = qr.modules.size;
  const N = n + QR_MARGIN * 2;
  let d = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n;) {
      if (!qr.modules.get(y, x)) { x++; continue; }
      let x2 = x + 1;
      while (x2 < n && qr.modules.get(y, x2)) x2++;
      const w = x2 - x;
      d += `M${x + QR_MARGIN} ${y + QR_MARGIN}h${w}v1h-${w}z`;
      x = x2;
    }
  }
  const ec = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }[qr.errorCorrectionLevel?.bit] || '?';
  const svg = `<svg class="qr-svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">` +
    `<rect width="${N}" height="${N}" fill="#fff"/><path fill="${QR_INK}" d="${d}"/></svg>`;
  return { svg, version: qr.version, ec, mods: N };
}
/** QR 칸 수를 CSS 변수로: 인쇄에서 버전이 큰 QR 은 모듈이 0.38mm 아래로 작아지지 않게 타일을 키운다 */
function qrAttrs(el, q) {
  el.setAttribute('data-qr-v', String(q.version));
  el.setAttribute('style', `--qr-mods:${q.mods}`);
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    // 48자 이하면 줄이지 않는다(뒤표지·판권 웹판 주소가 「…」로 잘렸다, 나고야판 r3 n22)
    const full = (x.host.replace(/^www\./, '') + x.pathname + x.search).replace(/\/$/, '/');
    if (full.length <= 48) return full;
    const p = x.pathname.length > 18 ? x.pathname.slice(0, 16) + '…' : x.pathname;
    return x.host.replace(/^www\./, '') + (p === '/' ? '' : p);
  } catch { return u; }
}

function splitToc(s) {
  const i = s.indexOf(' · ');
  return i < 0 ? [s.trim(), ''] : [s.slice(0, i).trim(), s.slice(i + 3).trim()];
}

function textOf(el) { return (el?.textContent || '').replace(/\s+/g, ' ').trim(); }

// 요소 안 첫 글자(공백 아닌 글자)가 든 텍스트 노드. QR 타일·지도 SVG·앵커·확률 막대 안 글자는 건너뛴다.
const SKIP_TEXT = '.place-qr, a.qr, .pdf-anchor, .pdf-anchor-ref, .odds-bar, .leader, svg, svg-slot, script, style';
function firstTextNode(el) {
  for (const n of el.childNodes) {
    if (n.nodeType === 3) { if (n.textContent.trim()) return n; continue; }
    if (n.nodeType !== 1 || n.matches(SKIP_TEXT)) continue;
    const r = firstTextNode(n);
    if (r) return r;
  }
  return null;
}
/** 쪽 참조 검사용: 요소의 앞 글자 몇 개(공백 없이). 최종 PDF 의 그 쪽 글자에 들어 있어야 한다 */
function leadText(el, n = 10) {
  let out = '';
  const walk = (node) => {
    for (const c of node.childNodes) {
      if (out.length >= n) return;
      if (c.nodeType === 3) out += c.textContent.replace(/\s+/g, '');
      else if (c.nodeType === 1 && !c.matches(SKIP_TEXT)) walk(c);
    }
  };
  walk(el);
  return out.slice(0, n);
}

function applyVars(html, vars) {
  return html.replace(/{{\s*([\w.]+)\s*}}/g, (m, k) => (k in vars ? escapeHtml(vars[k]) : m));
}

/** 조각(HTML 문자열)을 파싱해 검사·표시한 뒤 다시 문자열로 */
function prepareFragment(html, { file, isPart, group, serifKinds, log }) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const body = document.body;
  if (isPart) {
    for (const el of body.querySelectorAll('style, script')) {
      log.warn(`${file}: <${el.tagName.toLowerCase()}> 는 원고에 쓸 수 없어 뺐습니다`);
      el.remove();
    }
    const styled = body.querySelectorAll('[style]');
    if (styled.length) {
      log.warn(`${file}: 인라인 style 속성 ${styled.length}곳을 뺐습니다`);
      for (const el of styled) el.removeAttribute('style');
    }
    const unknown = new Map();
    for (const el of body.querySelectorAll('[class]')) {
      for (const c of el.classList) if (!KNOWN_CLASSES.has(c)) unknown.set(c, (unknown.get(c) || 0) + 1);
    }
    if (unknown.size) log.warn(`${file}: 규약 밖 클래스 ${[...unknown].map(([c, n]) => `${c}(${n})`).join(', ')}`);
    const dash = (body.textContent.match(/—/g) || []).length;
    if (dash) log.warn(`${file}: em dash(—) ${dash}개`);
  }
  const sections = body.querySelectorAll('section.part');
  if (isPart && sections.length === 0) log.warn(`${file}: <section class="part"> 가 없습니다`);
  if (isPart && sections.length > 1) log.warn(`${file}: section.part 가 ${sections.length}개입니다(1개 권장)`);
  for (const sec of sections) {
    if (!sec.id) {
      const id = 'p-' + path.basename(file, '.html').replace(/[^\w-]/g, '-');
      sec.id = id;
      log.warn(`${file}: section.part 에 id 가 없어 "${id}" 로 붙였습니다`);
    }
    if (!sec.getAttribute('data-toc')) log.warn(`${file}: data-toc 가 없어 목차에 안 나옵니다`);
    sec.setAttribute('data-file', file);
    if (group) sec.setAttribute('data-group', group);
    const kind = sec.getAttribute('data-kind') || '';
    sec.classList.add(serifKinds.includes(kind) ? 'k-serif' : 'k-sans');
  }
  return isPart ? wrapPhones(body.innerHTML) : body.innerHTML;
}

/**
 * @param {object} cfg  { book, bookDir, partsDir, frontDir, assetsDir, templatePath, styleHref }
 * @param {object} state { markers, fillers: {id:n}, endFillers, pages: {id:n}|null }
 */
export async function assemble(cfg, state, log) {
  const { book } = cfg;
  const vars = {
    title: book.title, subtitle: book.subtitle, series: book.series, kicker: book.kicker,
    webUrl: book.webUrl, published: book.published,
    pdf: outputNames(book).pdf,
    booklet: outputNames(book).booklet,
    ...(book.vars || {}),
  };
  const serifKinds = book.serifKinds || DEFAULT_SERIF_KINDS;
  const groups = new Map(); // key → group config
  const chunks = [];
  const rectoFiles = new Set();
  const read = (dir, file, isPart, group) => {
    const p = path.join(dir, file);
    if (!exists(p)) { log.warn(`${isPart ? '원고' : '앞뒤 페이지'} 없음: ${path.relative(cfg.bookDir, p)}`); return null; }
    let html = stripComments(readText(p));
    if (!isPart) html = applyVars(html, vars);
    return prepareFragment(html, { file, isPart, group, serifKinds, log });
  };

  for (const entry of book.sequence) {
    if (entry.filler === 'end') { chunks.push('<div data-filler-slot="end"></div>'); continue; }
    if (entry.group) groups.set(entry.group, entry);
    const list = [];
    if (entry.front) for (const f of [].concat(entry.front)) list.push([cfg.frontDir, f, false]);
    if (entry.parts) for (const f of entry.parts) list.push([cfg.partsDir, f, true]);
    let first = true;
    for (const [dir, f, isPart] of list) {
      const html = read(dir, f, isPart, entry.group);
      if (html == null) continue;
      if (first && entry.start === 'recto') rectoFiles.add(f);
      first = false;
      chunks.push(html);
    }
  }

  let template = stripComments(readText(cfg.templatePath));
  template = applyVars(template, vars);
  const { document } = parseHTML(template.replace('{{content}}', chunks.join('\n')));
  const slots = [];
  const slot = (svg) => { slots.push(svg); return `<svg-slot data-k="${slots.length - 1}"></svg-slot>`; };

  // --- 앞뒤 메모 페이지(쪽수 맞춤) -------------------------------------------------
  const memoTpl = exists(path.join(cfg.frontDir, 'memo-page.html'))
    ? applyVars(stripComments(readText(path.join(cfg.frontDir, 'memo-page.html'))), vars) : null;
  const makeFiller = (id, why) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = memoTpl || '<section class="front memo-page print-only"><div class="memo-fill"></div></section>';
    const sec = wrap.querySelector('section');
    sec.id = id; sec.setAttribute('data-filler', why);
    return sec;
  };
  for (const [id, n] of Object.entries(state.fillers || {})) {
    const target = document.getElementById(id);
    if (!target || !n) continue;
    for (let i = 0; i < n; i++) target.parentNode.insertBefore(makeFiller(`memo-before-${id}-${i + 1}`, 'recto'), target);
  }
  const endSlot = document.querySelector('[data-filler-slot="end"]');
  if (endSlot) {
    for (let i = 0; i < (state.endFillers || 0); i++) endSlot.parentNode.insertBefore(makeFiller(`memo-end-${i + 1}`, 'end'), endSlot);
    endSlot.remove();
  }

  // --- 사진 -------------------------------------------------------------------
  const manifest = loadManifest(cfg.assetsDir, log);
  const imgUsed = [];
  for (const fig of document.querySelectorAll('figure[data-img]')) {
    const id = fig.getAttribute('data-img');
    const e = manifest.get(id);
    const file = e && (e.file || e.src || e.path || `${id}.jpg`).replace(/^assets\/img\//, '');
    const abs = file && path.join(cfg.assetsDir, 'img', file);
    if (!e || !exists(abs)) {
      log.warn(`사진 없음 → figure 제외: ${id}${e ? ` (파일 ${file} 없음)` : ' (manifest 에 없음)'}`);
      fig.remove();
      continue;
    }
    const size = (e.width && e.height) ? { width: e.width, height: e.height } : imageSize(abs);
    const img = document.createElement('img');
    img.setAttribute('src', `assets/img/${file}`);
    const cap0 = fig.querySelector('figcaption');
    img.setAttribute('alt', e.alt || textOf(cap0) || '');
    if (size) { img.setAttribute('width', String(size.width)); img.setAttribute('height', String(size.height)); }
    img.setAttribute('loading', fig.closest('.cover') ? 'eager' : 'lazy');
    img.setAttribute('decoding', 'async');
    fig.insertBefore(img, fig.firstChild);
    const credit = creditLine(e);
    if (!credit) log.warn(`사진 크레디트 없음: ${id}`);
    let cap = cap0;
    if (!cap) { cap = document.createElement('figcaption'); fig.appendChild(cap); }
    if (credit) {
      const span = document.createElement('span');
      span.className = 'credit';
      span.innerHTML = langJa(credit);
      cap.appendChild(span);
    }
    fig.classList.add('has-img');
    imgUsed.push(id);
  }

  // 크레디트 표: 책에 실리지 않은 사진의 행(tr[data-img])은 뺀다
  const usedSet = new Set(imgUsed);
  let creditsDropped = 0;
  for (const tr of document.querySelectorAll('tr[data-img]')) {
    if (!usedSet.has(tr.getAttribute('data-img'))) { tr.remove(); creditsDropped++; }
  }
  // 크레디트 표의 라이선스 칸: manifest 의 licenseUrl 로 링크를 걸고(웹), 표 아래에 라이선스 원문 주소를
  // 모아 적는다(인쇄). CC BY-SA 2.0·3.0 은 라이선스 URI 표기를 요구한다(인쇄 감리 r2).
  const licTables = new Map(); // table → Map(license → url)
  for (const tr of document.querySelectorAll('tr[data-img]')) {
    const e = manifest.get(tr.getAttribute('data-img'));
    const url = e && (e.licenseUrl || e.license_url);
    const cell = tr.lastElementChild;
    if (!url || !cell) continue;
    const name = textOf(cell);
    if (!name || name !== String(e.license || '').trim()) continue;
    // CC 가 아닌 것(Public domain 등)도 목록에 이름과 근거 주소를 올린다(나고야판 r3 n22)
    if (!/creativecommons\.org/.test(url) && !/public\s*domain|^PD\b/i.test(name)) continue;
    if (!cell.querySelector('a')) cell.innerHTML = `<a href="${escapeHtml(url)}" rel="license noopener" target="_blank">${escapeHtml(name)}</a>`;
    const table = tr.closest('table');
    if (!licTables.has(table)) licTables.set(table, new Map());
    licTables.get(table).set(name, url);
  }
  const licShort = (u) => u.replace(/^https?:\/\//, '').replace(/\/?(deed\.[\w-]+)?$/, '/');
  // 표가 웹 전용(web-only)이어도 라이선스 원문 목록은 인쇄에 남긴다(R1 판정: 인쇄 크레디트는 표 없이 1쪽, A-05).
  for (const [table, lics] of licTables) {
    const items = [...lics].sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([name, url]) => `<span class="lic-item"><b>${escapeHtml(name)}</b> <a href="${escapeHtml(url)}" rel="license noopener" target="_blank">${escapeHtml(licShort(url))}</a></span>`);
    const p = document.createElement('p');
    p.className = 'lic-legend';
    p.innerHTML = `<span class="lic-head">라이선스 원문</span> ${items.join(' ')}`;
    // 표 자신이나 감싼 블록이 web-only 면 그 블록 뒤에 둔다(안에 두면 같이 숨는다)
    let after = table;
    for (let a = table; a && !a.matches('section.part'); a = a.parentElement) if (a.classList.contains('web-only')) after = a;
    after.parentNode.insertBefore(p, after.nextSibling);
  }

  // --- 지도·도판(SVG) -----------------------------------------------------------
  let svgN = 0;
  for (const fig of document.querySelectorAll('figure[data-svg]')) {
    const id = fig.getAttribute('data-svg');
    const abs = path.join(cfg.assetsDir, 'svg', `${id}.svg`);
    if (!exists(abs)) { log.warn(`도판 없음 → figure 제외: ${id}`); fig.remove(); continue; }
    const label = textOf(fig.querySelector('figcaption')) || id;
    const html = prepareSvg(readText(abs), `s${++svgN}-${id}`, { label, cls: 'fig-svg' });
    const holder = document.createElement('div');
    holder.className = 'fig-svg-wrap';
    holder.innerHTML = slot(html);
    fig.insertBefore(holder, fig.querySelector('figcaption') || null);
    fig.classList.add('has-svg');
    // 웹: 좁은 화면에서는 지도를 옆으로 밀어 보게 하고(style.css), 원본 SVG 를 새 탭으로 여는 링크를 단다
    if ((fig.classList.contains('map') || fig.classList.contains('chart')) && !fig.closest('.cover')) {
      let cap = fig.querySelector('figcaption');
      if (!cap) { cap = document.createElement('figcaption'); fig.appendChild(cap); }
      const a = document.createElement('a');
      a.className = 'fig-open web-only';
      a.setAttribute('href', `assets/svg/${id}.svg`);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.textContent = '크게 보기';
      cap.appendChild(document.createTextNode(' '));
      cap.appendChild(a);
    }
  }

  // --- 오프너(Day·특집 머리) --------------------------------------------------------------
  // 사진이 빠졌으면(manifest 에 없음) 타이포그래피 대체 띠를 넣는다: 가는 바둑판 격자 + 큰 키커(style.css).
  // 키커 「DAY 2 · 11.24 TUE」 → DAY / 2 / 11.24 TUE, 「특집 · HOKKAIDO WINE」 → 특집 / HOKKAIDO WINE.
  // 특집은 숫자 하나를 크게 둔다(BRIEF 7장 「산지 좌표나 연도 같은 숫자 하나」, 값은 BRIEF 1장·2-11).
  for (const head of document.querySelectorAll('header.part-head.opener')) {
    if (head.querySelector('figure.photo')) continue;
    const [k0, k1] = splitToc(textOf(head.querySelector('.kicker')));
    const m = k0.match(/^DAY\s*(\d+)$/i);
    const fig = OPENER_FIGURES[head.closest('section.part')?.id || ''];
    const art = document.createElement('div');
    art.className = 'opener-art' + (m ? ' oa-day' : ' oa-feature');
    art.setAttribute('aria-hidden', 'true');
    art.innerHTML = '<div class="oa-plate">' + (m
      ? `<span class="oa-label">DAY</span><span class="oa-num">${escapeHtml(m[1])}</span>` + (k1 ? `<span class="oa-sub">${escapeHtml(k1)}</span>` : '')
      : `<span class="oa-label">${escapeHtml(k0)}</span><span class="oa-word">${escapeHtml(k1 || k0)}</span>`) + '</div>' +
      (!m && fig ? `<div class="oa-fig"><b>${escapeHtml(fig[0])}</b><small>${escapeHtml(fig[1])}</small></div>` : '');
    head.insertBefore(art, head.firstChild);
    head.classList.add('no-photo');
  }

  // --- QR: 장소 카드, 단독 QR -------------------------------------------------------
  const qrList = [];
  for (const pl of document.querySelectorAll('.place')) {
    const tiles = [];
    const q = pl.getAttribute('data-maps');
    if (q) tiles.push({ url: mapsUrl(q), label: '지도' });
    const u = pl.getAttribute('data-url');
    if (u) tiles.push({ url: u, label: pl.getAttribute('data-url-label') || '웹' });
    if (!tiles.length) continue;
    const box = document.createElement('div');
    box.className = 'place-qr';
    let boxMods = 0;
    for (const t of tiles) {
      const a = document.createElement('a');
      a.className = 'qr-tile';
      a.setAttribute('href', t.url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      const qq = qrSvg(t.url);
      qrAttrs(a, qq);
      boxMods = Math.max(boxMods, qq.mods);
      a.innerHTML = slot(qq.svg) + `<span class="qr-label">${langJa(t.label)}</span>`;
      box.appendChild(a);
      qrList.push({ url: t.url, v: qq.version, ec: qq.ec, where: pl.closest('section')?.id || '' });
    }
    // 한 카드의 QR 타일은 같은 크기로(인쇄): 큰 QR 하나 때문에 「지도」·「Tabelog」 라벨 높이가 어긋났다(인쇄 감리 r2)
    box.setAttribute('style', `--qr-box-mods:${boxMods}`);
    pl.insertBefore(box, pl.firstChild);
  }
  for (const a of document.querySelectorAll('a.qr[data-qr]')) {
    const url = a.getAttribute('data-qr');
    const label = a.getAttribute('data-label') || textOf(a) || shortUrl(url);
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    const qq = qrSvg(url);
    qrAttrs(a, qq);
    a.innerHTML = slot(qq.svg) +
      `<span class="qr-text"><span class="qr-label">${langJa(label)}</span><span class="qr-url">${escapeHtml(shortUrl(url))}</span></span>`;
    qrList.push({ url, v: qq.version, ec: qq.ec, where: a.closest('section')?.id || '' });
    // 상자 맨 끝의 단독 QR 은 상자 맨 앞으로 옮겨 오른쪽 위에 띄운다(style.css .qr-float). 상자 머리 줄과
    // 나란히 서서 상자 높이가 QR 한 줄만큼 줄어든다. 상자 끝에 QR 줄이 따로 생기면 상자가 쪽 사이에서
    // 갈리기 쉬웠다(인쇄 감리 r1, 사흘 한눈에 「결정 규칙」).
    const box = a.parentNode;
    if (box?.matches?.('aside.box') && !a.nextElementSibling) {
      a.classList.add('qr-float');
      box.classList.add('has-qr-float');
      box.insertBefore(a, box.firstChild);
    }
  }

  // --- 원고 끝 메모(조판): book.json "tailMemo" 의 원고 끝에 인쇄 전용 필기선을 붙여 마지막 쪽의 빈자리를 채운다.
  // 남은 자리만큼만 남기고(아래 필기선 덜어 내기), 첫 줄부터 다음 쪽으로 밀리거나 min 줄도 안 들어가면 뺀다.
  const tm = book.tailMemo || {};
  for (const f of tm.parts || []) {
    const sec = [...document.querySelectorAll('section.part')].find((x) => x.getAttribute('data-file') === f);
    if (!sec) continue;
    const el = document.createElement('div');
    el.className = 'memo-lines tail-memo print-only';
    el.setAttribute('data-lines', String(tm.lines || 24));
    el.setAttribute('aria-hidden', 'true');
    sec.appendChild(el);
  }

  // --- 필기선, 표 래퍼 ----------------------------------------------------------------
  // 필기선은 줄마다 .ml 하나. 인쇄 패스에서는 줄마다 앵커(ZZL[k.i]ZZ)를 심어 몇 줄이 다음 쪽으로
  // 넘쳤는지 센다. state.memoTrim[k] 만큼 줄을 덜어 낸다(최소 1줄). state.memoDrop[k] 면 원고 끝 메모를 뺀다.
  const memoInfo = [];
  [...document.querySelectorAll('.memo-lines')].forEach((el, k) => {
    const trailing = el.classList.contains('tail-memo');
    if (trailing && state.memoDrop?.[k]) {
      // 번호(k)가 패스마다 같아야 하므로 요소는 남기고 줄만 비운다
      el.className = 'tail-memo-dropped';
      el.innerHTML = '';
      const asked = parseInt(el.getAttribute('data-lines') || '0', 10) || 0;
      memoInfo.push({ k, part: el.closest('section.part')?.id || '', file: el.closest('section.part')?.getAttribute('data-file') || '', lines: 0, asked, trailing, dropped: true });
      return;
    }
    const raw = parseInt(el.getAttribute('data-lines') || '8', 10);
    const n = Number.isFinite(raw) && raw > 0 ? raw : 8;
    const trim = Math.min(state.memoTrim?.[k] || 0, n - 1);
    const lines = n - trim;
    el.setAttribute('style', `--lines:${lines}`);
    el.setAttribute('data-memo', String(k));
    if (trailing && state.markers) {
      const mark = document.createElement('span');
      mark.className = 'pdf-anchor';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = `ZZM[${k}]ZZ`;
      // 표식은 앞 내용의 바닥에 붙인다(절대 위치). 필기선 앞에 따로 두면, 앞 상자가 쪽 끝에 딱 맞을 때
      // 표식까지 다음 쪽으로 밀려 「남은 자리 있음」으로 보고 필기선만 든 쪽이 생겼다(R1 시험 빌드 28·35·42쪽).
      let prev = el.previousElementSibling;
      while (prev && prev.classList.contains('pdf-anchor')) prev = prev.previousElementSibling;
      const host = !prev ? null : prev.matches('ul, ol') ? prev.lastElementChild : prev.matches('dl, table') ? null : prev;
      if (host && !host.matches('table, tbody, thead, tr, dt, dd')) {
        mark.classList.add('pdf-anchor-floor');
        host.classList.add('has-memo-mark');
        host.appendChild(mark);
      } else el.parentNode.insertBefore(mark, el);
    }
    let rows = '';
    for (let i = 0; i < lines; i++) {
      rows += state.markers
        ? `<span class="ml"><span class="pdf-anchor" aria-hidden="true">ZZL[${k}.${i}]ZZ</span></span>`
        : '<span class="ml"></span>';
    }
    el.innerHTML = rows;
    const sec = el.closest('section.part');
    const box = el.closest('aside.box');
    // 원고 맨 끝 상자 안의 필기선: 상자 아래 여백만 다음 쪽으로 넘어가도 빈 쪽이 생긴다
    const tail = !!(sec && box && box.parentNode === sec && !box.nextElementSibling);
    memoInfo.push({ k, part: sec?.id || '', file: sec?.getAttribute('data-file') || '', lines, asked: n, tail, trailing, min: trailing ? (tm.min || 4) : 1 });
  });
  for (const t of document.querySelectorAll('table.data')) {
    if (t.parentNode?.classList?.contains('table-wrap')) continue;
    const w = document.createElement('div');
    w.className = 'table-wrap' + (t.classList.contains('web-only') ? ' web-only' : '') + (t.classList.contains('print-only') ? ' print-only' : '');
    const rows = t.querySelectorAll('tbody tr').length || t.querySelectorAll('tr').length;
    if (t.classList.contains('keep') || rows <= KEEP_TABLE_ROWS) w.classList.add('keep');
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
    // 묶음 행: 한 칸이 모든 열을 차지하는 행(예: 영업 캘린더의 「사카이미나토」). 인쇄에서 다음 행과 붙여 둔다.
    const cols = Math.max(0, ...[...t.querySelectorAll('tr')].map((tr) => [...tr.children].reduce((n, c) => n + (parseInt(c.getAttribute('colspan') || '1', 10) || 1), 0)));
    for (const tr of t.querySelectorAll('tbody tr')) {
      const cells = [...tr.children];
      if (cols > 1 && cells.length === 1 && (parseInt(cells[0].getAttribute('colspan') || '1', 10) || 1) >= cols) tr.classList.add('group');
    }
    // 묶음 행이 있으면 묶음마다 tbody 를 나눈다(tbody.grp). 인쇄에서 묶음을 쪽 사이에서 가르지 않는다.
    // 묶음 이름 없이 다음 쪽으로 넘어간 행이 어느 지역인지 안 보였다(인쇄 감리 r1, 영업 캘린더).
    for (const tb of [...t.querySelectorAll(':scope > tbody')]) {
      const rows = [...tb.children];
      if (!rows.some((r) => r.classList?.contains('group'))) continue;
      let cur = null;
      for (const r of rows) {
        if (r.classList?.contains('group') || !cur) {
          cur = document.createElement('tbody');
          cur.className = 'grp';
          tb.parentNode.insertBefore(cur, tb);
        }
        cur.appendChild(r);
      }
      tb.remove();
    }
    // 「米子空港 16:15 → 境港 16:30」 같은 짧은 구간 칸은 인쇄에서 한 줄로(역 이름과 시각이 갈리지 않게)
    for (const td of t.querySelectorAll('td')) {
      const tx = textOf(td);
      if (tx.includes('→') && tx.length <= 28 && !td.querySelector('br')) td.classList.add('nw');
    }
  }

  // 보여 주는 카드: 목적지·날짜 목록(dl.dest-list)이 없는 카드가 잇달아 오면 묶어 2단으로 놓는다(인쇄·넓은 화면).
  // 한 장씩 쌓으면 쪽 끝마다 빈자리가 남는다(나고야판 실용 데스크 요청 5). 전화 카드(show-card.call)는 줄이 많아 1단.
  for (const sec of document.querySelectorAll('section.part')) {
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const wrap = document.createElement('div');
        wrap.className = 'sc-grid';
        run[0].parentNode.insertBefore(wrap, run[0]);
        for (const c of run) wrap.appendChild(c);
      }
      run = [];
    };
    for (const el of [...sec.children]) {
      if (el.matches('div.show-card') && !el.querySelector('dl.dest-list') && !el.classList.contains('call')) run.push(el);
      else flush();
    }
    flush();
  }
  // 알러지 카드의 「피할 글자」 목록(・ 로 나열한 일본어): 낱말 가운데서 줄이 갈리지 않게 ・ 뒤에서만 바꾼다(실용 데스크 요청 2)
  for (const p of document.querySelectorAll('.cut-card .cc-ja, .show-card .sc-ja')) {
    const t = p.textContent;
    if ((t.match(/[・·]/g) || []).length >= 3 && !/[。？]/.test(t)) p.classList.add('ja-list');
  }

  // 병 카드(div.bottle)가 잇달아 오면 묶어 2단 격자로(인쇄·넓은 화면, BRIEF 7장). 쪽 사이에서는 카드 단위로 넘어간다.
  for (const sec of document.querySelectorAll('section.part')) {
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const wrap = document.createElement('div');
        wrap.className = 'bottle-grid';
        run[0].parentNode.insertBefore(wrap, run[0]);
        for (const c of run) wrap.appendChild(c);
      }
      run = [];
    };
    for (const el of [...sec.children]) {
      if (el.matches('div.bottle')) run.push(el);
      else flush();
    }
    flush();
  }

  // 만날 확률(p.odds[data-odds] 0~4): 네 칸 막대를 글자 앞에 붙인다. 뜻은 <b> 글자가 전하고 막대는 보조다.
  for (const p of document.querySelectorAll('p.odds')) {
    const raw = p.getAttribute('data-odds');
    const n = /^[0-4]$/.test(String(raw).trim()) ? Number(raw) : NaN;
    if (!Number.isFinite(n)) { log.warn(`${p.closest('section.part')?.getAttribute('data-file') || '?'}: p.odds 의 data-odds 가 0~4 가 아닙니다("${raw ?? ''}")`); continue; }
    p.setAttribute('data-odds', String(n));
    const bar = document.createElement('span');
    bar.className = 'odds-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = [0, 1, 2, 3].map((i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('');
    p.insertBefore(bar, p.firstChild);
  }

  // 리뷰 카드 메뉴(dl.menu): 와인 리스트처럼 「이름 ……… 가격」 한 줄로. dd 안의 span.price 를 dt 끝으로 옮기고
  // 사이에 점선 리더를 둔다(웹·인쇄 공통). 가격이 없는 메뉴는 이름만.
  for (const dl of document.querySelectorAll('dl.menu')) {
    for (const dt of [...dl.children].filter((c) => c.tagName === 'DT')) {
      const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD' ? dt.nextElementSibling : null;
      const price = dd ? dd.querySelector('.price') : null;
      const name = document.createElement('span');
      name.className = 'mn';
      while (dt.firstChild) name.appendChild(dt.firstChild);
      dt.appendChild(name);
      if (!price) continue;
      const lead = document.createElement('span');
      lead.className = 'leader';
      lead.setAttribute('aria-hidden', 'true');
      dt.appendChild(lead);
      dt.appendChild(price);
      dt.classList.add('has-price');
      if (dd.firstChild && dd.firstChild.nodeType === 3) dd.firstChild.textContent = dd.firstChild.textContent.replace(/^\s+/, '');
      if (!textOf(dd)) dd.classList.add('empty');
    }
  }

  // 바 카드의 밤 표시(ul.nights): 「· 확정」이 붙은 밤은 테두리를 굵게(글자 「확정」이 뜻을 전한다)
  for (const li of document.querySelectorAll('ul.nights > li')) {
    if (/확정/.test(li.textContent)) li.classList.add('confirmed');
  }

  // 긴 장소 카드(글 240자 이상이거나 안에 상자·목록·표. 나고야판 r3 n21 로 300 → 240): 인쇄에서 카드 머리 + dl.facts 뒤로는 쪽 사이에서
  // 나뉠 수 있게 place-long 을 붙인다. 짧은 카드는 통째로 넘긴다(A-02: 반쪽 넘는 카드가 통째로 밀려 빈자리가 남았다).
  for (const pl of document.querySelectorAll('div.place')) {
    const n = textOf(pl).length;
    // 바 카드의 밤 표시(ul.nights)는 짧은 한 줄이라 긴 카드로 치지 않는다(시험 빌드: 짧은 바 카드가 쪽 사이에서 갈렸다)
    const inner = [...pl.querySelectorAll('aside, ul, ol, table, dl.menu')].filter((x) => !x.classList.contains('nights'));
    // 리뷰 카드(가게)는 길이와 상관없이 머리 + WHY 뒤에서 쪽을 넘길 수 있다(와인·사케 기자 요청 2: 24 카드가 통째로 넘어가 0.4쪽이 비었다)
    if (n >= 240 || inner.length || pl.classList.contains('review')) pl.classList.add('place-long');
  }

  // 시간표 시각 「08:40~09:10」: 좁은 시각 칸에서 물결 뒤에서만 줄을 바꾼다
  for (const t of document.querySelectorAll('ol.timeline .t')) {
    if (t.children.length || !t.textContent.includes('~')) continue;
    t.innerHTML = escapeHtml(t.textContent.trim()).replace(/~\s*/g, '~<wbr>');
  }

  // --- 목차·내비게이션 ----------------------------------------------------------------
  const parts = [...document.querySelectorAll('section.part')];
  const ids = new Map();
  for (const s of parts) {
    if (ids.has(s.id)) log.warn(`id 중복: ${s.id} (${ids.get(s.id)} / ${s.getAttribute('data-file')})`);
    ids.set(s.id, s.getAttribute('data-file'));
  }
  const tocModel = []; // [{group, cfg, items:[{id, t, s, printOnly}]}]
  const noReading = new Set();   // 차례·러닝헤드에서 독음을 못 붙인 일본어
  for (const s of parts) {
    const toc = s.getAttribute('data-toc');
    if (!toc) continue;
    const g = s.getAttribute('data-group') || '';
    let last = tocModel[tocModel.length - 1];
    if (!last || last.group !== g) { last = { group: g, cfg: groups.get(g) || {}, items: [] }; tocModel.push(last); }
    let [t, sub] = splitToc(toc);
    // 묶음 이름과 겹치는 머리말은 뺀다: DAY 2 묶음 안의 "Day 2 일정" → "일정", 읽을거리 묶음 안의 "읽을거리 · X" → "X"
    const label = (groups.get(g) || {}).label;
    if (label) {
      const norm = (x) => x.replace(/\s+/g, '').toLowerCase();
      if (norm(t).startsWith(norm(label))) {
        let rest = t, i = 0;
        for (const ch of label.replace(/\s+/g, '')) { // 공백을 무시하고 label 글자 수만큼 앞을 잘라낸다
          while (i < rest.length && /\s/.test(rest[i])) i++;
          if (rest[i] && rest[i].toLowerCase() === ch.toLowerCase()) i++;
        }
        rest = rest.slice(i).trim();
        if (rest) t = rest; else if (sub) { t = sub; sub = ''; }
      }
    }
    last.items.push({ id: s.id, t: withReadings(t, noReading), s: withReadings(sub, noReading), printOnly: s.classList.contains('print-only') });
  }
  const pg = (id) => {
    const v = state.pages?.[id];
    return v ? String(v) : '';
  };
  const printToc = tocModel.map((g) => {
    const items = g.items.map((it) => `<li class="toc-entry"><a href="#${it.id}"><span class="toc-pg" data-pg-for="${it.id}">${pg(it.id)}</span>` +
      `<span class="toc-txt"><span class="toc-t">${langJa(it.t)}</span>` +
      (it.s ? ` <span class="toc-s">${langJa(it.s)}</span>` : '') + '</span></a></li>').join('');
    // 묶음(읽을거리·먹고 마시기·실용·보여 주는 일본어): 묶음 머리에 첫 쪽번호를 크게, 원고는 아래에 「제목 쪽」으로 잇는다
    if (g.cfg.label && g.items.length > 1) {
      const first = g.items[0].id;
      return `<li class="toc-group"><a class="toc-group-head" href="#${first}"><span class="toc-pg">${pg(first)}</span>` +
        `<span class="toc-txt"><span class="toc-group-label">${langJa(withReadings(g.cfg.label, noReading))}</span>` +
        (g.cfg.title ? `<span class="toc-group-title">${langJa(withReadings(g.cfg.title, noReading))}</span>` : '') +
        `</span></a><ol class="toc-sub">${items}</ol></li>`;
    }
    return items;
  }).join('');
  for (const root of document.querySelectorAll('[data-toc-root]')) root.innerHTML = `<ol class="toc-list">${printToc}</ol>`;

  const webToc = tocModel.map((g) => {
    const items = g.items.filter((it) => !it.printOnly);
    if (!items.length) return '';
    const lis = items.map((it) => `<li><a href="#${it.id}">${langJa(it.t)}${it.s ? `<small>${langJa(it.s)}</small>` : ''}</a></li>`).join('');
    if (g.cfg.label && items.length > 1) {
      return `<li class="wtoc-group"><span class="wtoc-label">${langJa(withReadings(g.cfg.label, noReading))}${g.cfg.title ? ` <small>${langJa(withReadings(g.cfg.title, noReading))}</small>` : ''}</span><ol>${lis}</ol></li>`;
    }
    return lis;
  }).join('');
  for (const root of document.querySelectorAll('[data-web-toc]')) root.innerHTML = `<ol class="wtoc">${webToc}</ol>`;

  const chips = [];
  for (const g of tocModel) {
    const nav = g.cfg.nav;
    // book.json "navTo": 칩이 가리킬 원고 파일(예: 일정). 없으면 묶음의 첫 원고
    const want = g.cfg.navTo ? parts.find((s) => s.getAttribute('data-file') === g.cfg.navTo)?.id : null;
    const first = g.items.find((it) => !it.printOnly && (!want || it.id === want)) || g.items.find((it) => !it.printOnly);
    if (nav && first && !chips.some((c) => c.nav === nav)) chips.push({ nav, id: first.id, title: g.cfg.label, cards: g.group === 'cards' });
  }
  for (const root of document.querySelectorAll('[data-day-nav]')) {
    root.innerHTML = chips.map((c) => `<a class="chip${c.cards ? ' chip-cards' : ''}" href="#${c.id}" title="${escapeHtml(c.title || '')}">${escapeHtml(c.nav)}</a>`).join('');
  }

  // 쪽 참조: <span data-pageref="id"> 또는 data-pageref-file="90-credits.html"
  // data-pageref 의 id 는 원고(section.part)뿐 아니라 원고 안 아무 요소(상자, 소제목 등)여도 된다.
  // 원고 안 요소면 인쇄 패스가 그 요소에도 앵커를 심어 그 요소가 놓인 쪽을 찾는다(인쇄 감리 r2:
  // 「사흘 한눈에」의 결정 규칙·예약 표, 「줄 너머로」의 확인 목록이 원고 첫 쪽이 아닌 데 있었다).
  const partIds = new Set(parts.map((s) => s.id));
  const refTargets = new Set();
  for (const el of document.querySelectorAll('[data-pageref], [data-pageref-file]')) {
    let id = el.getAttribute('data-pageref');
    const f = el.getAttribute('data-pageref-file');
    if (!id && f) id = parts.find((s) => s.getAttribute('data-file') === f)?.id;
    if (id && !partIds.has(id)) {
      const target = document.getElementById(id);
      if (!target) log.warn(`쪽 참조 대상 없음: #${id} (${el.closest('section.part')?.getAttribute('data-file') || '?'})`);
      else if (!target.closest('section.part')) log.warn(`쪽 참조 대상 #${id} 가 원고 밖에 있습니다`);
      else refTargets.add(id);
    }
    const v = id ? pg(id) : '';
    if (v) el.textContent = v;
    else el.closest('.pageref-wrap')?.remove();
  }

  // 쪽 참조 대상의 앞 글자(빌드 끝에 최종 PDF 의 그 쪽과 대조한다)
  const refLead = {};
  for (const id of refTargets) refLead[id] = leadText(document.getElementById(id));

  // --- 러닝헤드: 원고마다 이름 붙은 페이지(@page) ------------------------------------------
  const rules = [];
  const runOf = (s) => {
    const own = s.getAttribute('data-run');
    if (own) return own;
    const toc = s.getAttribute('data-toc') || textOf(s.querySelector('.part-title'));
    // 34자까지는 부제까지 단다(「Day 3 일정 · 항구의 아침, 기타로 열차로 공항까지」 31자. 인쇄 감리 r2)
    return toc.length > RUN_MAX ? splitToc(toc)[0] : toc;
  };
  // 쪽 바깥 여백 탭(인쇄): Day 묶음(nav 가 D1~D5)과 보여 주는 일본어 묶음(group "cards")에 단다.
  // book.json 묶음에 "tab": "글자" 를 주면 그 묶음에도 단다. 탭 모양은 style.css 의 @page :left/:right
  // @left-top/@right-top 에 있고, 여기서는 글자와 세로 위치(margin-top)만 정한다. 엄지로 찾게 묶음마다
  // 아래로 22mm 씩 내려가고, 카드 묶음은 Day 와 떨어진 아래쪽에 둔다.
  const tabs = new Map();
  for (const entry of book.sequence) {
    if (!entry.group) continue;
    const label = entry.tab ?? (/^D\d+$/.test(entry.nav || '') ? entry.nav : entry.group === 'cards' ? (entry.nav || '카드') : null);
    if (!label) continue;
    const i = tabs.size;
    const day = /^D\d+$/.test(label);
    tabs.set(entry.group, { label, y: i < 5 ? TAB_Y0 + i * TAB_STEP : TAB_Y_LOW + (i - 5) * TAB_STEP, day, bg: day ? null : (TAB_BG[entry.group] || TAB_BG_OTHER) });
  }
  // 탭 글자: 두 글자 한글(「카드」)은 세로로 쌓는다(탭 폭 6mm)
  const tabContent = (t) => (/^[\uac00-\ud7a3]{2,3}$/.test(t.label) ? `"${[...t.label].join('\\A ')}"` : cssString(t.label));
  const tabRule = (t, side) => {
    if (!t) return '';
    const box = side === 'left' ? '@left-top' : '@right-top';
    return `${box}{content:${tabContent(t)};margin-top:${t.y}mm${t.bg ? `;background:${t.bg};color:#fff` : ''}}`;
  };
  parts.forEach((s, i) => {
    const g = groups.get(s.getAttribute('data-group')) || {};
    const verso = withReadings(g.run || g.label || book.title, noReading);
    const recto = withReadings(runOf(s) || book.title, noReading);
    const name = `pt${i}`;
    const tab = tabs.get(s.getAttribute('data-group'));
    rules.push(`section[id=${cssString(s.id)}]{page:${name}}`);
    rules.push(`@page ${name}:left{@top-left{content:${cssString(verso)}}${tabRule(tab, 'left')}}`);
    rules.push(`@page ${name}:right{@top-right{content:${cssString(recto)}}${tabRule(tab, 'right')}}`);
    // 오프너(R1 갱신): 1쪽 고정을 풀었다. 오프너는 원고의 첫 블록일 뿐이고 같은 이름 붙은 페이지에서
    // 본문이 이어진다. 그래서 오프너 쪽에도 러닝헤드와 여백 탭이 그대로 나온다(편집장 판정: 허용).
  });
  const style = document.getElementById('page-rules');
  if (style) style.textContent = rules.join('\n');
  if (noReading.size) log.warn(`차례·러닝헤드의 일본어에 한글 소리를 못 붙였습니다: ${[...noReading].join(', ')} (build/lib/assemble.mjs READINGS 에 더하거나 원고 data-toc·data-run 에 괄호 독음)`);

  // --- 쪽 찾기 앵커(인쇄 패스에서만) -------------------------------------------------------
  const clipChecks = [];
  if (state.markers) {
    for (const s of parts) {
      const span = document.createElement('span');
      span.className = 'pdf-anchor';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = `ZZA[${s.id}]ZZ`;
      // 오프너로 시작하는 원고는 앵커를 오프너 안에 넣는다. 밖(원고 이름 페이지)에 두면 앵커만 든 쪽이 하나 더 생긴다.
      const op = s.firstElementChild?.matches?.('header.part-head.opener') ? s.firstElementChild : null;
      if (op) op.insertBefore(span, op.firstChild);
      else s.insertBefore(span, s.firstChild);
      // 원고 끝 앵커: 원고 상자 바닥에 절대 위치로 붙인다(흐름 밖이라 쪽을 새로 만들지 않는다)
      const end = document.createElement('span');
      end.className = 'pdf-anchor pdf-anchor-end';
      end.setAttribute('aria-hidden', 'true');
      end.textContent = `ZZE[${s.id}]ZZ`;
      s.appendChild(end);
    }
    // 높이가 고정돼 넘치면 잘리는 상자(잘라 쓰는 카드): 내용 끝(흐름 안)과 상자 바닥(절대 위치)에 앵커를
    // 하나씩 심는다. 「바닥보다 위인가」로 보고, 상자 밖으로 완전히 나간 글자는 PDF 에 없으므로 「없음」도 잘림이다.
    // (R1 갱신: 오프너는 높이 고정이 아니게 되어 검사에서 뺐다)
    let ck = 0;
    for (const el of document.querySelectorAll('.cut-card')) {
      for (const [cls, tag] of [['pdf-anchor pdf-anchor-clip', 'ZZK'], ['pdf-anchor pdf-anchor-floor', 'ZZB']]) {
        const span = document.createElement('span');
        span.className = cls;
        span.setAttribute('aria-hidden', 'true');
        span.textContent = `${tag}[${ck}]ZZ`;
        el.appendChild(span);
      }
      const sec = el.closest('section.part');
      clipChecks.push({ k: ck++, file: sec?.getAttribute('data-file') || '', what: `잘라 쓰는 카드 ${[...sec.querySelectorAll('.cut-card')].indexOf(el) + 1}번째` });
    }
    // 쪽 참조 대상 요소: 대상의 첫 글자 바로 앞에 폭·높이 0 인 인라인 앵커를 심는다(첫 줄과 같이 움직인다).
    // 나고야판 r3 수정: 예전에는 대상 맨 앞에 블록 앵커(높이 3pt)를 넣었는데, 제목·긴 장소 카드는 그 앵커와 첫 줄 사이에서
    // 쪽이 나뉠 수 있어 앵커만 앞 쪽 끝에 남았다(1쪽 앞으로 찍힘).
    for (const id of refTargets) {
      const t = document.getElementById(id);
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.textContent = `ZZA[${id}]ZZ`;
      const tn = firstTextNode(t);
      if (tn) { span.className = 'pdf-anchor-ref'; tn.parentNode.insertBefore(span, tn); }
      else { span.className = 'pdf-anchor'; t.insertBefore(span, t.firstChild); }
    }
  }
  // 앵커 순서(문서 순서): 원고와 쪽 참조 대상. 인쇄 패스가 이 순서로 장 시작 메모의 밀림을 더한다.
  const anchorOrder = [...document.querySelectorAll('section.part, [id]')]
    .filter((el) => partIds.has(el.id) ? el.matches('section.part') : refTargets.has(el.id))
    .map((el) => el.id);

  // --- 직렬화 -------------------------------------------------------------------------
  let html = '<!doctype html>\n' + document.documentElement.outerHTML;
  html = html.replace(/<svg-slot data-k="(\d+)"><\/svg-slot>/g, (_, k) => slots[Number(k)]);

  const info = {
    partOrder: parts.map((s) => s.id),
    anchorOrder,
    refTargets: [...refTargets],
    recto: new Set(parts.filter((s) => rectoFiles.has(s.getAttribute('data-file'))).map((s) => s.id)),
    titles: Object.fromEntries(parts.map((s) => [s.id, textOf(s.querySelector('.part-title')) || ''])),
    files: Object.fromEntries(parts.map((s) => [s.id, s.getAttribute('data-file')])),
    images: imgUsed,
    creditsDropped,
    memo: memoInfo,
    svgCount: svgN,
    refLead,
    qr: qrList,
    clipChecks,
    pageRules: rules.join('\n'),
  };
  return { html, info };
}
