// 독음 검사: 원고의 일본어(한자·가나)마다 바로 옆에 한글 독음(또는 한국식 한자음)이 붙었는지 본다.
// 발행인 지시(2026-11-08): 한자·일본어 이름 옆에는 항상 한글 소리를 같이 쓴다.
//
// 짝으로 인정하는 모양
//   1) 原語(한글…)        일본어 바로 뒤 괄호 안에 한글이 있다
//   2) 한글(原語…)        한글 뒤 괄호 안에 일본어가 있다(괄호 안 다른 일본어도 같은 괄호면 인정)
//   3) 原語 한글 이 같은 줄에 바로 붙어 있고 사이가 공백·가운뎃점뿐 (예: 표 칸 "大須 오스")
//   4) 원어 옆에 독음 전용 요소가 있다: .reading .pron .sc-pron .cc-pron (카드·회화·가게 이름)
// 검사 제외: <script> <style>, 주석, .no-reading(의도적으로 원문만 보여 줄 곳, 예: 알러지 카드의 피할 글자 목록)
//
// 사용: node build/check-readings.mjs [--parts src/parts] [--front src/front] [--out qa/reading-check.json]
//       종료 코드는 항상 0 (보고만 한다)
import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const partsDir = opt('--parts', 'src/parts');
const frontDir = opt('--front', 'src/front');
const outFile = opt('--out', 'qa/reading-check.json');

const JA = /[぀-ヿ㐀-䶿一-鿿豈-﫿々〆ヶヵ]+(?:[぀-ヿ㐀-䶿一-鿿豈-﫿々〆ヶヵー・0-9０-９\-]*[぀-ヿ㐀-䶿一-鿿豈-﫿々〆ヶヵー])?[0-9０-９\-]*/g;
const HANGUL = /[가-힣]/;
const BLOCK = 'p,li,td,th,dd,dt,h1,h2,h3,h4,h5,h6,figcaption,blockquote,caption,summary,.what b,.what .sub,.sc-ja,.sc-ko,.cc-ja,.cc-ko,.kicker,.dek,.byline,span.sub,b,strong,a';
const READING_CLS = ['reading', 'pron', 'sc-pron', 'cc-pron'];

function hasReadingNear(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.classList && n.classList.contains('no-reading')) return 'skip';
    const sel = READING_CLS.map(c => '.' + c).join(',');
    if (n.querySelector && n.querySelector(sel)) {
      // 카드·회화·가게 이름 단위(가장 가까운 묶음)까지만 올라간다
      if (n.matches && n.matches('.show-card,.cut-card,dl.phrases,dl.phrases dd,dl.phrases dt,.place-name,.dest,li,dd,dt,tr')) return true;
    }
    if (n.matches && n.matches('section.part,body')) break;
  }
  return false;
}

function paired(s, i, j) {
  const after = s.slice(j);
  // 1) 바로 뒤 괄호 안 한글
  const m1 = after.match(/^[\s]*[(（]([^)）]*)[)）]/);
  if (m1 && HANGUL.test(m1[1])) return true;
  // 1b) 원어 여러 개가 띄어쓰기로 이어진 뒤 한 괄호로 함께 읽은 경우(例: 岐阜県 羽島市(기후현 하시마시))
  const m1b = after.match(/^[\s·・0-9０-９A-Za-z\-\u3040-\u30ff\u3400-\u9fff々ー]*[(（]([^)）]*)[)）]/);
  if (m1b && HANGUL.test(m1b[1])) return true;
  // 같은 괄호 묶음 안에서 다음 일본어 뒤에 한글 괄호가 오는 경우(例: 名鉄名古屋駅 (메이테쓰나고야역)) 는 1)로 처리됨
  // 2) 한글( … 原語 … )
  const before = s.slice(0, i);
  const open = Math.max(before.lastIndexOf('('), before.lastIndexOf('（'));
  const close = Math.max(before.lastIndexOf(')'), before.lastIndexOf('）'));
  if (open > close) {
    const pre = before.slice(0, open);
    if (HANGUL.test(pre.slice(-12))) return true;
  }
  // 3) 바로 뒤에 공백·가운뎃점 뒤 한글 단어(괄호 없이 병기)
  if (/^[\s·・]{1,2}[가-힣]/.test(after) && !/^[\s·・]{1,2}[가-힣][^\s]*[(（]/.test(after.slice(0, 20)) ) {
    // "大須 오스" 처럼 짧게 붙는 병기만. 문장 계속(조사 등)과 구분이 어려워 3자 이상 한글 단어+공백/끝 일 때만
    const w = after.replace(/^[\s·・]+/, '').match(/^[가-힣]+/);
    if (w && w[0].length >= 2) return 'weak';
  }
  return false;
}

function leafBlocks(root) {
  const all = [...root.querySelectorAll(BLOCK)];
  return all.filter(el => !el.querySelector(BLOCK));
}

function checkFile(file) {
  const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  document.querySelectorAll('script,style').forEach(n => n.remove());
  const misses = [];
  let total = 0, weak = 0;
  const seen = new Set();
  for (const el of leafBlocks(document.body)) {
    const s = el.textContent.replace(/\s+/g, ' ');
    if (!JA.test(s)) { JA.lastIndex = 0; continue; }
    JA.lastIndex = 0;
    const near = hasReadingNear(el);
    if (near === 'skip') continue;
    let m;
    while ((m = JA.exec(s))) {
      total++;
      if (near === true) continue;
      const p = paired(s, m.index, m.index + m[0].length);
      if (p === true) continue;
      if (p === 'weak') {
        // 「원어 + 공백 + 한글 낱말」은 조사·문장 이어짐과 구분이 안 돼 독음으로 치지 않는다(--loose 로만 허용)
        weak++;
        if (args.includes('--loose')) continue;
      }
      const ctx = s.slice(Math.max(0, m.index - 12), Math.min(s.length, m.index + m[0].length + 14));
      const key = m[0] + '|' + ctx;
      if (seen.has(key)) continue;
      seen.add(key);
      misses.push({ ja: m[0], ctx: ctx.trim() });
    }
  }
  return { total, weak, missing: misses.length, misses };
}

const files = [];
for (const d of [partsDir, frontDir]) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).sort()) if (f.endsWith('.html')) files.push(path.join(d, f));
}
const report = { checkedAt: new Date().toISOString(), rule: '한자·일본어 옆에는 항상 한글 독음(또는 한국식 한자음)', files: {} };
let sumMissing = 0, sumTotal = 0;
for (const f of files) {
  const r = checkFile(f);
  report.files[f] = r;
  sumMissing += r.missing; sumTotal += r.total;
}
report.summary = { files: files.length, japaneseRuns: sumTotal, missing: sumMissing };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`독음 검사: 일본어 ${sumTotal}곳 중 독음 없음 ${sumMissing}곳 → ${outFile}`);
for (const [f, r] of Object.entries(report.files)) if (r.missing) console.log(`  ${path.basename(f)}: ${r.missing}`);
