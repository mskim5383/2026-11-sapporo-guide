# 북쪽의 잔 · 삿포로 푸드·드링크 가이드북

여행 가이드북 04 (2026.11.23–11.26). 미식·술 애호가를 위한 푸드·드링크 매거진. 원고 하나로 웹판과 인쇄판을 같이 만든다.

| 산출물 | 파일 | 용도 |
|---|---|---|
| 웹 | `dist/index.html` + `dist/assets/` | GitHub Pages. 모바일 우선(390px), 라이트 테마 |
| A5 낱장 PDF | `dist/sapporo-guide-a5.pdf` | 인쇄소에 맡기거나 화면으로 보기. 1쪽 = 표지, 마지막 쪽 = 뒤표지 |
| A4 중철 PDF | `dist/sapporo-guide-booklet-a4.pdf` | 집 프린터로 소책자 만들기. A4 가로 한 면에 A5 두 쪽 |

편집 기준은 `BRIEF.md`, 사실 근거는 `research/` 에 있다. 출력 파일 이름은 `src/book.json` 의 `output` 이 정한다.
직전 호(나고야판) 설명은 `README.nagoya-ref.md` 에 남겨 두었다.

---

## 1. 준비

- Node.js 20 이상, `npm install`
- Google Chrome: 기본 경로 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
  다른 곳에 있으면 `CHROME_PATH=/path/to/chrome` 을 붙여 실행한다. 쪽 여백 탭·러닝헤드(@page 여백 상자)를 쓰므로 Chrome 131 이상.
- 미리보기 PNG: macOS 는 기본 `swift`(PDFKit)를 쓰고, 없으면 pdf.js 로 그린다.
- 서체는 `@fontsource` 패키지(Noto Serif/Sans KR·JP, SIL OFL 1.1)에서 빌드가 직접 복사한다.
  책에 실제로 쓰인 글자가 든 조각만 `dist/assets/fonts/` 로 들어간다.

## 2. 빌드

```bash
node build/build.mjs              # 웹 + A5 PDF + A4 중철 PDF + 쪽 참조 대조 + 접는 순서 검증 (30~60초)
node build/build.mjs --html-only  # 웹 HTML 만 (차례 쪽번호 없음, 몇 초)
node build/render-pages.mjs       # PDF 를 PNG 로: qa/pages/p-001.png …, qa/booklet/b-001.png …
node build/web-shots.mjs          # 웹 스크린샷 390×844·1280×900: qa/web/, 가로 넘침 검사 qa/web/overflow.json
node build/test-imposition.mjs    # 중철 순서 테스트 (합성 4~72쪽 + dist 의 실물)
node build/check-readings.mjs     # 독음 검사: src/parts + src/front 의 일본어 옆 한글 소리 → qa/reading-check.json
node build/check-qr.mjs           # QR 판독 검사(macOS): A5 PDF 300dpi → Vision 디코드 → qa/qr-check.json
node build/check-web.mjs          # 배포 게이트: webUrl·PDF 공개 주소가 200 인지 → qa/web-url-check.json
```

`npm run build`, `npm run pages`, `npm run shots`, `npm test`, `npm run qr`, `npm run all`, `npm run web-check` 도 같다.

**정식 빌드(`dist/`, `qa/build-report.json`, `qa/pages/`, `qa/web/`)는 아트 디렉터만 만든다.** 다른 역할은 자기 tmp 로:

```bash
node build/build.mjs --html-only --out tmp/<slug>/dist --report tmp/<slug>/report.json    # 경고 확인(몇 초)
node build/build.mjs --out tmp/<slug>/dist --report tmp/<slug>/report.json                # 쪽수까지
node build/check-readings.mjs --parts src/parts --out tmp/<slug>/reading-check.json      # 독음
```

| 옵션 | 기본값 | |
|---|---|---|
| `--parts` | `src/parts` | 원고 조각 폴더 |
| `--front` | `src/front` | 표지·판권·차례·메모 쪽·뒤표지 |
| `--assets` | `assets` | `img/`(사진 + `manifest.json`), `svg/`(지도·도해) |
| `--style` / `--template` | `src/style.css` / `src/template.html` | 다른 CSS 로 견줘 볼 때 |
| `--out` | `dist` | 출력 폴더. 빌드 시작 때 비운다(숨김 파일 제외) |
| `--report` | `qa/build-report.json` | 원고별 시작 쪽, 쪽 참조와 그 대조, 메모 쪽 수, 경고 목록 |
| `--no-booklet` / `--keep-pass` | | 중철 PDF 생략 / 인쇄 패스용 `_pass.html` 남기기 |

빌드가 끝나면 경고를 모아 보여 준다. 자주 나오는 것:

- `사진 없음 → figure 제외: <id>` / `도판 없음 → figure 제외: <id>`: manifest·파일이 없다. 그 figure 는 빠진다(오프너는 대체 띠가 들어간다).
- `규약 밖 클래스`, `인라인 style 속성`, `em dash`: BRIEF 4·6장 위반. style 속성과 `<style>`·`<script>` 는 빌드가 지운다.
- `p.odds 의 data-odds 가 0~4 가 아닙니다`: 확률 막대를 그릴 수 없다(BRIEF 4-8).
- `쪽 참조 대상 없음: #<id>`: `data-pageref` 가 가리키는 요소가 없다(도판이 빠져 figure 째 없어진 경우 포함).
- `쪽 참조 #<id>: n쪽으로 찍혔는데 그 쪽에 「…」가 없습니다`: 찍힌 쪽번호와 대상이 실제로 놓인 쪽이 다르다. 빌드 도중 원고가 바뀌면 나기도 한다(다시 빌드).
- `총 N쪽이 최대 64쪽을 넘습니다`: 원고를 줄이거나 `src/book.json` 의 구성을 바꿔야 한다(편집장).

**인쇄 전 게이트**: 판권의 웹판 QR·주소와 뒤표지 QR 은 `book.json` 의 `webUrl` 을 가리킨다. `dist/` 를 공개 배포한 뒤
`node build/check-web.mjs` 가 PASS 일 때만 인쇄한다. 배포는 `npm run publish:docs`(`dist/` → `docs/` 복사 + `.nojekyll`) 후 commit·push.
공개 주소: https://mskim5383.github.io/2026-11-sapporo-guide/ (배포는 사용자 승인 뒤)

## 3. 디자인 시스템 (요약, 자세한 값은 `src/style.css` 1장)

톤은 「북쪽 도시의 겨울 와인 리스트」. 사진에 기대지 않는 타이포그래피·여백·가는 괘선. 라이트 테마만.

- **팔레트**(흰 바탕 대비): 먹 `--ink #16191d`(17.6:1) · `--ink-2 #2b3036`(13.3) · `--mut #4a5058`(8.1, 가장 옅은 글자) /
  포도 `--wine #6b1d33`(11.4, 와인·가게·강조) / 가문비 `--spruce #1f4a3f`(9.9, 사케) / 얼음 `--ice #2f5470`(8.0, 일정·시각·Day) /
  술쌀 `--rice #c9a227`(2.4, **장식만**: 괘선·숫자 밑줄·확률 막대 테두리) · 글자용 `--rice-deep #6b4a00`(8.1) /
  朱 `--shu #a3221b`(7.5, 경고·X·고정 시각) / O `--ok #185c31`(8.0). 바탕 `--paper #fff` · 웹 `--paper-web #fafbfc` · 틴트 `#f4f6f8`.
  BRIEF 제안값 중 `--rice-deep #7a5300`(6.9)·`--shu #b3261e`(6.5)·`--ok #1d6b3a`(6.5)는 「글자는 7:1」로 쓰려고 한 단계 짙게 잡았다.
  틴트 바탕 위 글자는 6.4:1 이상. 대비 계산: `tmp/ad/contrast.mjs`(임시).
- **원고 종류별 강조색**(`--acc`): 특집·리스트·가게·편집장의 말 = 포도, 사케 특집(`#feat-sake`) = 가문비, 한눈에·Day·실용 = 얼음, 카드 = 먹.
- **서체**: 읽을거리(`data-kind` letter·feature·review, `book.json` `serifKinds`)는 Noto Serif KR/JP, 일정·실용·표·카드·병 사양은 Noto Sans KR/JP.
  제호·장 제목·풀쿼트·가게 이름·병 이름은 세리프(가게 이름 일본어 Serif JP 600), 큰 숫자(시각·stats·`b-no`·쪽번호)는 고정폭 숫자, 카드 일본어는 Sans JP 700.
  키커는 라틴 대문자 + 자간. 괄호 속 한글 소리는 본문과 같은 크기·같은 색.
- **크기(인쇄)**: 읽을거리 본문 **9.5pt**(줄 간격 1.65, 낱말 사이 양끝 맞춤) · 개조식·표·시간표·`dl.facts`·`b-spec` 9pt(시간표 설명·시킬 것·병 사양 8.5pt) ·
  시각 9.5pt 굵게 · 캡션·크레디트·QR 라벨·러닝헤드·태그 7.5pt · 쪽번호 8.5pt 굵게 · 장 제목 20pt · 오프너 제목 28pt · 「한눈에」 8.5pt ·
  보여 주는 카드 일본어 **15pt**(목적지 15pt) · 카드 발음 10pt / 뜻 9pt · 병 이름 12.5pt / 번호 24pt · 회화 일본어 11.5pt.
  **웹**: 본문 16px(읽을거리 17px) · 표·시간표 15px · 캡션 13px · 카드 일본어 24px(확대 화면 최대 64px) · 칩·단추·체크 행 44px 이상.
- **모티프**: ① 바둑판 격자와 좌표: 장 머리 눈금자 띠, 좌표 배지 `span.grid`(칸 기호 + `南3西5`(미나미 3 니시 5)), 오프너 대체 띠·표지·메모 쪽의 격자,
  표지 대체 그래픽(숙소 `北1西7`(기타 1 니시 7) 칸). ② 스기다마의 동심원: 사케 특집 대체 띠, 사케 병 카드 귀퉁이. ③ 와인 리스트: 메뉴 「이름 ……… 가격」 점선 리더,
  생산자 프로필의 겹괘선, 표의 가는 괘선. 쓰지 않는 것: 붉은 오각별, 눈 결정, 와인잔·포도 아이콘, 로고, 사진 위 그러데이션 글자.
- **판면(A5 148×210)**: 위 15mm(러닝헤드) · 아래 14mm(쪽번호) · 안쪽 15mm · 바깥 12mm → 판면 121 × 181mm. 본문 1단(특집은 바깥쪽 곁글 float).
  병 카드·보여 주는 카드는 2단 격자, 생산자 프로필·전화 카드·목적지 카드는 1단. 한 쪽 분량 기준(9.5pt 문단만): 약 900자.

### 쪽 장치

| 장치 | 동작 |
|---|---|
| 러닝헤드 | 왼쪽 쪽 위 = 묶음 `run`(7.5pt 굵게), 오른쪽 쪽 위 = 원고 `data-run`(없으면 `data-toc`, 34자 넘으면 제목만). 쪽번호는 아래 바깥쪽 8.5pt |
| 쪽 바깥 여백 탭 | 「가게」(포도색) → 「D1」~「D4」(얼음색) → 「카드」(먹, 아래쪽). 가장자리 4mm 안쪽, 폭 6mm·높이 19mm, 22mm 간격. 두 글자 한글은 세로로 쌓는다. 묶음에 `"tab": "글자"` 로 더할 수 있다(색은 `build/lib/assemble.mjs` `TAB_BG`) |
| 오프너 | `header.part-head.opener` = 사진(인쇄 높이 Day 62mm·특집 78mm, 판면 폭) + 키커·제목·dek + 「한눈에」(Day, 쪽 사이에서 가르지 않음) / 바이라인(특집). 본문이 같은 쪽에서 이어진다. 사진이 없으면 빌드가 대체 띠: Day 26mm(격자 + 흰 판의 「DAY 2 · 11.24 TUE」), 특집 40mm(「특집 HOKKAIDO WINE」 + 큰 숫자 하나: 와인 1991, 사케 17, 값은 BRIEF 1장·2-11) |
| 장 시작 | 원고마다 새 쪽. 오른쪽 쪽 시작 규칙은 이번 호엔 없다 |
| 메모 쪽 | 총 쪽수를 4의 배수로 맞출 때만 뒤표지 앞에(5mm 점 격자). Day 원고 끝 빈자리는 `tailMemo` 필기선 「그날 메모 · NOTES」 |

## 4. 빌드가 하는 일

1. `src/book.json` 의 `sequence` 순서대로 `src/front/` 와 `src/parts/` 조각을 `src/template.html` 의 `{{content}}` 자리에 넣는다. HTML 주석은 지운다. 없는 원고는 경고만 하고 건너뛴다.
   앞뒤 페이지와 템플릿의 `{{title}}`·`{{webUrl}}`·`{{masthead}}`·`{{mastheadJa}}`·`{{mastheadKo}}` 등은 `book.json` 값(`vars` 포함)으로 바뀐다.
2. `figure[data-img]` → `assets/img/manifest.json` 으로 `<img>` 와 크레디트 한 줄(`figcaption .credit`). 없으면 figure 를 뺀다.
3. `figure[data-svg]` → `assets/svg/<id>.svg` 를 인라인으로 넣는다(id·내부 style 은 그림 안으로 가둔다). 지도·도해 캡션 끝에 웹 전용 「크게 보기」.
4. `div.place` 의 `data-maps`·`data-url` 로 QR 타일, `a.qr[data-qr]` 단독 QR. 인쇄에서 코드 15mm 이상, 버전이 크면 모듈 0.384mm 를 지키게 키운다. 좁은 화면에서는 「지도 열기」 단추.
5. 이번 호 컴포넌트 변환
   - `dl.menu`: dd 안 `span.price` 를 dt 끝으로 옮기고 사이에 점선 리더(「이름 ……… 가격」).
   - `p.odds[data-odds]`: 네 칸 확률 막대(`span.odds-bar`)를 글자 앞에(0 거의 없음 ~ 4 확실, 뜻은 `<b>` 글자).
   - `div.bottle` 이 잇달아 오면 `div.bottle-grid` 로 묶어 2단. `ul.nights` 의 「확정」 밤은 굵은 테두리(`li.confirmed`).
   - 보여 주는 카드: `dl.dest-list` 가 없는 카드가 잇달아 오면 `div.sc-grid` 로 묶어 2단. 전화 카드(`show-card.call`)와 목적지 카드는 1단.
     인쇄에서 2단 카드의 일본어는 글자 단위로 꺾는다(금칙 유지). 전화·목적지 카드는 줄·칸 단위로만 쪽을 넘긴다.
6. 장소 카드는 글 240자 이상이거나 안에 상자·목록·표·메뉴가 있으면 `place-long`(머리 + 「WHY」 + `dl.facts` 뒤로는 쪽 사이에서 나뉜다. 바 카드의 `ul.nights` 는 셈하지 않는다). 짧은 카드는 통째로 넘긴다.
   카드 안 `dl.facts` 는 머리말을 왼쪽에 띄운 블록이라 오른쪽 QR 아래로 글이 돌아 들어간다.
7. 시간표 시각의 물결(`08:40~09:10`) 뒤에 줄바꿈 기회. 전화번호 `nobr`. 짧은 표(8행 이하)는 쪽 사이에서 가르지 않는다. 표 칸 `☐` 는 웹에서 체크 칸.
8. 차례: `data-toc`(`제목 · 부제`)로 인쇄 「이번 호」(두 단, 쪽번호를 크게 앞에, 묶음은 머리 + 원고 목록)와 웹 목차·상단 칩(`nav`). 일본어는 `lang="ja"` 로 감싼다.
   차례·러닝헤드의 일본어 옆 독음은 원고 `data-toc`·`data-run` 의 괄호를 쓰고, 없으면 `READINGS`(BRIEF 2-14)로 붙인다.
9. 러닝헤드·탭: 원고마다 이름 붙은 `@page` 규칙을 `<style id="page-rules">` 에 쓴다.
10. 인쇄 2-pass(최대 6회): 원고 시작·쪽 참조 대상·필기선에 보이지 않는 앵커를 심어 PDF 를 만들고 pdfjs 로 쪽을 찾는다.
    - 쪽 참조 대상 앵커는 대상의 첫 글자 바로 앞에 폭·높이 0 인라인으로 심는다(제목·긴 카드가 앵커와 첫 줄 사이에서 쪽이 갈려 1쪽 앞으로 찍히던 문제, 나고야판 r3).
    - 4의 배수 끝 메모, 차례·쪽 참조 쪽번호를 넣어 다시 출력하고 예측과 같아지면 앵커 없는 최종본을 `dist/index.html` 로 쓰고 그대로 인쇄한다.
    - 필기선은 쪽 끝에서 넘친 줄만큼 덜어 낸다. 원고 끝 메모는 앞 내용과 다른 쪽이거나 `min` 줄도 안 남으면 뺀다.
    - **쪽 참조 대조**: 최종 PDF 에서 찍힌 쪽마다 대상의 앞 글자 10자가 실제로 있는지 본다(`qa/build-report.json` `refCheck`).
11. A5 쪽 크기를 정확한 A5(419.53×595.28pt)로 맞추고, `build/impose.mjs` 로 A4 중철 PDF 를 만든 뒤 접는 순서를 쪽번호·내용으로 대조한다.

그 밖에: 크레디트 표의 안 실린 사진 행 제거와 라이선스 원문 목록(CC 와 Public domain), 표 묶음 행(`tr.group`·`tbody.grp`), 안 쓰는 사진은 배포하지 않음.

### 조판 힌트 (원고에 붙여도 되는 클래스)

원고 문장은 그대로 두고 쪽 나눔만 고칠 때 쓴다.

| 클래스 | 붙이는 곳 | 효과(인쇄) |
|---|---|---|
| `short` / `shorter` | `figure.map`·`figure.chart` | 높이 상한 125mm → 100mm / 85mm. **지도·도해에는 쓰지 않는다**(글자가 7pt 아래로). 높이가 문제면 지도 작가가 다시 그린다 |
| `keep` | 아무 블록, `table.data` | 쪽 사이에서 가르지 않는다 |
| `break-before` | 아무 블록 | 이 앞에서 쪽을 나눈다 |
| `pageref-wrap` | 쪽 참조 괄호 `span` | 쪽번호가 비면 통째로 지우고, 웹에서는 숨긴다 |
| `hl` | 표의 `th`·`td` | 열 강조(얼음색 머리칸 + 세로 테두리) |
| `id` + `data-pageref` | 대상 요소 `id`, 참조 `span[data-pageref]` | 그 요소가 놓인 쪽 번호를 넣는다 |

### 웹

- 상단 고정 바: 제호 SAPPORO + 제목, 칩 「술·가게·D1~D4·실용·카드」(지금 읽는 묶음은 포도색, 「카드」는 먹 바탕. 520px 이하에서는 「카드」를 맨 앞에, 나머지는 옆으로 밀어 본다), 목차 팝오버, PDF.
- 보여 주는 카드·전화 카드·목적지 카드는 누르면 화면 가득(흰 바탕, 일본어 `clamp(30px, 8.4vw, 64px)`, 전화 카드 줄은 52px 까지). 다시 누르거나, 「닫기」, Esc, 휴대폰 뒤로 가기로 닫힌다.
- 체크리스트(`ul.check`)·표 `☐` 칸은 누르면 체크되고 이 브라우저에만 기억한다(localStorage `sapporo-guide-2026-11:checks`).
- 720px 이하에서 지도·도해는 620px 폭으로 그려 옆으로 밀어 본다(원본은 「크게 보기」). 병 카드·보여 주는 카드는 721px 이상에서 2단.

### 사진 목록 `assets/img/manifest.json`

id 를 키로 하는 객체(또는 `{id, …}` 배열, `{"images": …}`):

```json
{ "cover-sapporo": { "file": "cover-sapporo.jpg", "alt": "…", "width": 1600, "height": 2133,
    "author": "작가 이름", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "source": "https://commons.wikimedia.org/wiki/File:…" } }
```

크레디트 줄은 `credit` 문자열이 있으면 그대로, 없으면 `사진 <author> · <license>`.

### 원고 순서 `src/book.json` (편집장 파일)

```jsonc
{ "group": "day2", "nav": "D2", "run": "DAY 2 · 11.24 화", "parts": ["32-day2.html"] }
```

- `label`·`title`: 차례의 묶음 머리(원고가 둘 이상일 때). `nav`: 웹 칩 이름(D1~D4 는 인쇄 탭도). `run`: 왼쪽 쪽 러닝헤드.
- `start: "recto"`: 오른쪽(홀수) 쪽 시작(이번 호는 안 씀). `navTo`: 칩이 가리킬 원고. `tab`: 쪽 여백 탭 글자(「가게」).
- `{ "filler": "end" }`: 4의 배수 맞춤 메모 쪽 자리(뒤표지 바로 앞).
- `tailMemo`: `{ "parts": [...], "lines": 8, "min": 4 }`. Day 원고 끝 인쇄 전용 필기선 「그날 메모」.
- `serifKinds`: 세리프로 짤 `data-kind`(letter·feature·review).
- `vars`: 앞뒤 페이지에 쓰는 값(`masthead` SAPPORO, `mastheadJa` 札幌, `mastheadKo` 삿포로, `dates`, `surveyed`).

## 5. 인쇄

### A. 집에서 A4 양면 → 중철 소책자 (`sapporo-guide-booklet-a4.pdf`)

1. **먼저 한 장만 시험한다.** 인쇄 범위를 1–2쪽(첫 번째 종이의 앞뒤)으로 두고 아래 설정으로 뽑는다.
   종이를 반으로 접었을 때 표지(1쪽)를 넘기면 2쪽(이 책의 표시), 반대편 바깥이 뒤표지면 맞다.
2. 프린터 설정
   - 용지 **A4**, 방향은 자동
   - 배율 **실제 크기(100%)**. "용지에 맞춤", "축소", "여러 쪽 모아 찍기"는 끈다
   - **양면 인쇄: 짧은 쪽으로 넘기기**(Flip on short edge). 긴 쪽으로 넘기면 뒷면이 거꾸로 나온다
   - 컬러, 보통 이상 품질
3. 다 뽑히면 **순서를 바꾸지 말고** 그대로 겹친다. 첫 장(표지·뒤표지가 찍힌 장)이 맨 바깥이 되게 놓고, 묶음 전체를 가운데에서 한 번에 반으로 접는다.
4. 접힌 선을 따라 스테이플러 2곳(위·아래 1/4 지점).
5. 양면 기능이 없는 프린터: 홀수 면만 먼저 뽑고, 뭉치를 다시 넣어 짝수 면을 뽑는다. 다시 넣는 방향은 1번 시험 인쇄로 맞춘다.

참고: 쪽수가 N이면 종이는 N/4장(64쪽 = 16장). 가정용 프린터는 가장자리 3~5mm 를 못 찍는다. 표지 그림은 종이 끝 5mm 안쪽에,
쪽 여백 탭은 가장자리 4mm 안쪽에 있어 찍힌다. 본문 여백은 바깥 12mm, 접는 쪽 15mm.

### B. 인쇄소에 맡기기 (`sapporo-guide-a5.pdf`)

- 파일: A5(148×210mm) 낱장 PDF. 1쪽이 표지, 마지막 쪽이 뒤표지, 총 쪽수는 4의 배수.
- 주문: "A5 중철 제본, 본문·표지 양면 컬러, 총 N쪽"(N 은 PDF 쪽수).
- 도련(재단 여분 3mm)이 없는 PDF 다. "재단 없이" 또는 "가장자리 흰 여백 1~2mm 허용"으로 요청한다.
- 서체는 PDF 에 들어 있다(부분 포함). 색은 RGB.

## 6. 파일 구조

```
BRIEF.md                 편집 기획서 (사실 기준표, 원고 배정, 컴포넌트 규약, 디자인 방향)
research/                취재 자료 (읽기 전용)
src/book.json            원고 순서·묶음·러닝헤드·탭·출력 파일 이름 (편집장)
src/template.html        웹 껍데기(상단 바, 목차 팝오버, 옆 차례, 카드 크게 보기, 체크 저장 스크립트)
src/style.css            웹 + 인쇄 공용 스타일 (토큰, 컴포넌트, @page·러닝헤드·탭·오프너)
src/front/               표지(SAPPORO + 커버 라인), 판권(+이 책의 표시), 차례 틀, 메모 쪽 틀, 뒤표지(웹판 QR)
src/parts/               원고 조각 (기자·데스크·에디터), _sources/ 새로 확인한 사실의 원문
assets/img, assets/svg   사진(+manifest.json)·지도·도해
build/build.mjs          조립 + 2-pass 인쇄 + 쪽 참조 대조 + 임포지션 + 검증
build/lib/assemble.mjs   조립(규약 클래스 KNOWN_CLASSES, 독음 READINGS, QR, 오프너, 컴포넌트 변환, 탭, 차례, 쪽 참조)
build/print.mjs          Chrome(puppeteer-core) 인쇄, A5 쪽 크기 정규화
build/impose.mjs         A4 중철 임포지션 (단독 실행 가능)
build/test-imposition.mjs  접는 순서 테스트
build/render-pages.mjs   PDF → PNG
build/web-shots.mjs      웹 스크린샷·가로 넘침 검사
build/check-readings.mjs 독음 검사(원고·앞뒤 페이지)
build/check-qr.mjs       QR 판독 검사(macOS)
build/check-web.mjs      공개 주소 검사(배포 게이트)
qa/                      검수 기록(편집장 보고서, 조판 로그, build-report.json). PNG 렌더(pages/, booklet/, web/)는 commit 하지 않는다
```

인쇄 출력은 Chrome 이 `print` 미디어로 그린다. 웹폰트가 `file://` 에서 막히므로 빌드는 잠깐 로컬 http 서버를 띄워 출력한다.
