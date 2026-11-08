# 사진 노트 · 북쪽의 잔 (사진 에디터)

작성 2026-11-08 · 사진 에디터(slug `photo`). 원고 담당은 캡션을 쓰기 전에 이 파일의 「찍힌 것」과 「주의」를 본다.

## TL;DR

- BRIEF 5-1 사진 26개 중 **24개**를 채웠다. 못 구한 ID: `sorachi`, `chitosetsuru`(아래 「못 구한 ID」).
- 출처는 모두 Wikimedia Commons 파일 페이지. 작가·라이선스·촬영일은 Commons API(imageinfo extmetadata)와 파일 분류로 확인했다. NC·ND·스톡·SNS·가게 공식 사진 없음. Flickr·Panoramio 에서 옮겨 온 파일은 모두 Commons 의 라이선스 검토(FlickreviewR, Panoramio trusted users)를 거친 것만 골랐다.
- 라이선스: CC BY-SA 4.0 7장, CC BY-SA 3.0 5장, CC BY-SA 2.0 3장, CC BY 2.0 3장, CC BY 4.0 2장, CC0 1.0 2장, CC BY 3.0 1장, CC BY 2.5 1장.
- 여행 시기(11월 말)와 가까운 사진: `akarenga`(2025-11-23), `ramen`(2025-11-23), `tv-tower`(2008-11-26), `yoichi-vineyard`(2018-11-05), `snow-street`(2014-11-15, 첫눈), `cover-sapporo`(2012-12-11), `odori-xmas`(2013-12-14). 나머지는 계절이 다르니 캡션에 「이번 여행 때 모습」처럼 쓰지 않는다.
- **캡션을 고쳐야 할 것 둘**: `yoichi-vineyard` 는 余市(요이치)가 아니라 바로 옆 仁木(니키)에서 찍은 사진이다. `pinot-noir` 는 프랑스 사진이다. 자세한 것은 각 ID 절과 `qa/asset-requests.md`.
- 2026-11-08 20:40 기준 원고에 안 쓰인 ID: `ramen`, `gyoza`, `tanukikoji`, `akarenga`, `tv-tower`, `ario-sapporo`. manifest 에는 넣어 두었다(빌드는 실린 사진만 복사한다).

## 처리 방식

- 받은 곳: 원본 긴 변이 2400px 이하면 `upload.wikimedia.org` 원본, 더 크면 Wikimedia 서버가 만든 축소본(`thumb.wikimedia.org` / `upload.wikimedia.org/.../thumb/`). 받은 파일은 `file` 로 JPEG 인지 확인한 뒤 `sips` 로만 다뤘다. 자르기·색 보정 없음.
- 크기: 긴 변 2000px 에서 시작해 600KB 를 넘으면 1800, 1600 으로 줄였다. 원본이 더 작은 것은 늘리지 않았다(`odori-xmas` 1600px).
- 화질: `sips` JPEG 품질 82 또는 80. 다만 아래 여섯 장은 긴 변 1600px·품질 80 에서도 600KB(BRIEF 3-6)를 넘어 품질을 낮췄다: `cover-sapporo` 75, `susukino-night` 70, `pinot-noir`·`akarenga`·`tv-tower`·`icn-t2` 65. sips 의 품질 눈금은 Apple 인코더 기준이라 같은 숫자에서도 파일이 크게 나온다(나고야판 노트와 같은 판단). 모두 600KB 이하.
- `width`·`height` 는 줄인 뒤의 실제 크기, `original` 은 Commons 원본 크기, `taken` 은 파일 기록의 촬영일(시각은 있으면).
- 라이선스 표기: Commons 의 `{{cc-zero}}` 는 「CC0 1.0」. `cts-terminal`·`ario-sapporo`·`kaisendon` 은 GFDL 과 CC 의 다중 라이선스라 CC 쪽을 적었다.
- 일본어 작가명은 manifest `author` 에 괄호 한글 소리를 붙였다(빌드가 캡션 끝 크레디트에 그대로 쓴다): `欅`(게야키, Keyaki), `さかおり`(사카오리), `ノボホショコロトソ`(노보호쇼코로토소), `モンモン`(몬몬). 2-14 표에 없는 소리라 `qa/fact-conflicts.md` 「독음」에 적었다.
- Flickr 계정명 뒤의 「from 도시」는 뺐다(Ray Swi-hymn, Luca Sartoni, Melvin Loi, Jun Seita).

## 표지·커버 스토리 사진 선택

- **표지 `cover-sapporo`**: 눈 오는 밤의 大通公園(오도리 공원)과 さっぽろテレビ塔(삿포로 테레비토), 일루미네이션. BRIEF 의 「저녁·겨울·일루미네이션·세로 구도」를 한 장에 다 가진 후보는 이것뿐이었다. 2012-12-11 17:11 촬영이라 이번 여행보다 2주 반 늦고 눈이 더 깊다.
- **커버 스토리 오프너 `yoichi-vineyard`**: 余市(요이치)의 포도밭 사진은 Commons 에서 찾지 못했다(검색어·분류·좌표 검색 모두). 대신 余市(요이치)와 맞닿은 仁木(니키)에서 2018-11-05 에 찍은 늦가을 밭 사진을 넣었다. BRIEF 5-2 산지 지도도 「余市·仁木(요이치·니키)」를 한 산지로 묶는다. 계절(11월 초)은 이번 여행과 가깝다. 대신 화질이 표지만 못하다(흐린 날, 달리는 차에서 찍어 앞쪽이 약간 흐림). 특집 오프너로 약하다고 보면 타이포그래피 오프너(BRIEF 7장)로 바꿔도 된다.

## ID별

### `cover-sapporo` · 눈 오는 밤의 오도리 공원과 테레비토

- 쓰는 곳: src/front/cover.html
- 출처: [File:Sapporo 20121211171104 (8678508024).jpg](https://commons.wikimedia.org/wiki/File:Sapporo_20121211171104_(8678508024).jpg) · inunami · CC BY 2.0 (Flickr, FlickreviewR 검토)
- 크기: 원본 1536x2048 → 1200x1600 (세로 3:4)
- 촬영: 2012-12-11 17:11 (Commons 분류 「Sapporo White illumination」)
- 찍힌 것: 눈이 쌓인 大通公園(오도리 공원) 산책로. 왼쪽 위로 눈 얹힌 나뭇가지가 화면을 덮고, 가운데에 분홍빛 전구를 켠 테레비토와 디지털 시계(5:11). 오른쪽 뒤에 나무 모양 일루미네이션 구조물, 왼쪽 앞에 빛나는 공·빛 상자 장식. 사람 셋쯤이 뒷모습이나 작은 크기로 걷는다(얼굴 안 보임).
- 고른 이유: 저녁·겨울·일루미네이션·세로 구도를 모두 갖췄다. 눈이 내리는 공기감이 「북쪽의 잔」 제목과 맞는다.
- 주의: 12월 중순 사진이라 눈이 이번 여행 평년값(최심적설 3~4cm)보다 훨씬 깊다. 표지 사진은 캡션이 없지만, 다른 곳에 「11월 말의 오도리 공원」이라고 쓰지 않는다. 시계 아래 작은 회사 로고(Panasonic)가 있다. 탑 조명 색은 날과 행사마다 다르다.
- 판 짜기: 테레비토는 가로 약 50%, 꼭대기가 위에서 약 18%, 시계가 약 37% 높이. 위 왼쪽은 나뭇가지로 복잡하고 위 오른쪽은 갈색빛 어두운 하늘이라 비어 있다. A5(148:210) 비율로 쓰면 좌우가 조금 잘린다. 원본은 1536x2048 이라 인쇄 해상도를 더 원하면 Commons 원본에서 다시 뽑을 수 있다(600KB 규칙 예외가 필요).
- 다른 후보: TV Tower of Sapporo／札幌テレビ塔（夜）(2008-11-26, 날짜는 맞지만 눈이 거의 없고 평범해 `tv-tower` 로 씀), View of Sapporo TV Tower from Odori Park(2011-01, 퍼블릭 도메인, 가로 사진), Sapporo TV Tower in November 2025 01(2025-11-22, 세로, 안개 속 파란 탑).

### `odori-xmas` · 크리스마스 시장과 테레비토

- 쓰는 곳: 31-day1.html 오프너
- 출처: [File:ミュンヘン・クリスマス市 in Sapporo（Munich Christmas in Sapporo City） - panoramio (1).jpg](https://commons.wikimedia.org/wiki/File:%E3%83%9F%E3%83%A5%E3%83%B3%E3%83%98%E3%83%B3%E3%83%BB%E3%82%AF%E3%83%AA%E3%82%B9%E3%83%9E%E3%82%B9%E5%B8%82_in_Sapporo%EF%BC%88Munich_Christmas_in_Sapporo_City%EF%BC%89_-_panoramio_(1).jpg) · t-konno · CC BY-SA 3.0
- 크기: 원본 1600x1067 → 그대로 1600x1067 (원본이 1600px 라 늘리지 않음)
- 촬영: 2013-12-14 밤(파일 좌표 43.0608, 141.3543 = 大通公園(오도리 공원) 2丁目(초메) 부근)
- 찍힌 것: ミュンヘン・クリスマス市(뮌헨 크리스마스 이치). 지붕에 눈이 조금 얹힌 목조 노점이 양쪽으로 줄지어 있고, 길 끝 정면에 파란 조명의 테레비토(시계 6:09). 오른쪽 위에 흰 전구 나무 모양 조형물, 하늘에 달. 노점 사이에 사람이 많다.
- 고른 이유: 시장과 테레비토가 한 화면에 들어온 유일한 자유 라이선스 사진. 31 캡션(「이 공원 1·2丁目(초메)에서 크리스마스 시장」)과 맞는다.
- 주의: 2013년 시장이라 노점 배치·장식은 올해와 다를 수 있다. 아래쪽 군중 가운데 얼굴이 작게 보이는 사람이 몇 있다(인쇄 폭 121mm 에서 3~5mm). 오프너로 가로를 자를 때 세로 위치 45% 안팎이면 탑과 노점 지붕이 남는다.
- 다른 후보: 같은 작가의 panoramio.jpg(노점과 군중을 가까이, 얼굴이 더 크게 보임), 大通公園イルミネーション（Odori Park at night）(popsaurus, 12월 23일, 화이트 일루미네이션과 탑, CC BY 3.0).

### `tv-tower` · 해 질 녘의 테레비토

- 쓰는 곳: 31 (원고에는 아직 없음)
- 출처: [File:TV Tower of Sapporo／札幌テレビ塔（夜） - panoramio.jpg](https://commons.wikimedia.org/wiki/File:TV_Tower_of_Sapporo%EF%BC%8F%E6%9C%AD%E5%B9%8C%E3%83%86%E3%83%AC%E3%83%93%E5%A1%94%EF%BC%88%E5%A4%9C%EF%BC%89_-_panoramio.jpg) · T DMY · CC BY 3.0
- 크기: 원본 2304x3072 → 1200x1600 (세로)
- 촬영: 2008-11-26 (이번 여행 마지막 날과 같은 날짜). 좌표 43.0611, 141.3565
- 찍힌 것: 해 진 직후 짙푸른 하늘, 금빛 조명을 켠 테레비토. 왼쪽 앞에 파란 전구를 감은 나무, 넓은 보도, 길가의 택시. 오른쪽 화단에 눈이 조금 남아 있다.
- 주의: 표지와 다른 장면(BRIEF 5-1)이다. 일몰 16:04 무렵의 하늘색과 비슷하다는 것은 기자 판단으로 쓰지 말고 「11월 말의 해 질 녘」 정도로.

### `nakajima-park` · 나카지마 공원 연못의 단풍

- 쓰는 곳: 32-day2.html 오프너
- 출처: [File:Nakajima Park (15982587898).jpg](https://commons.wikimedia.org/wiki/File:Nakajima_Park_(15982587898).jpg) · redlegsfan21 · CC BY-SA 2.0 (Flickr, FlickreviewR 검토)
- 크기: 원본 4000x3000 → 1600x1200
- 촬영: 2012-10-31 16:02
- 찍힌 것: 中島公園(나카지마 공원) 연못. 붉고 주황빛 단풍나무, 수양버들, 작은 다리, 물에 비친 단풍. 흐린 흰 하늘, 뒤로 아파트. 왼쪽 앞에 초록 덤불. 사람 거의 없음.
- 주의: 10월 말 단풍 절정 무렵이다. 11월 24일에는 잎이 대부분 졌을 것이라는 점은 추정이니, 캡션에 계절을 쓰려면 「10월 말」로. 연못 이름은 파일에 없어 쓰지 않는다.
- 다른 후보: 같은 작가 같은 날의 단풍 길(15982595828), 663highland 2009-10-12 연작(보트·연못), Hoheikan in snow(2011-01).

### `akarenga` · 아카렌가 청사

- 쓰는 곳: 32 (원고에는 아직 없음)
- 출처: [File:Former Hokkaidō Government Office 02.jpg](https://commons.wikimedia.org/wiki/File:Former_Hokkaid%C5%8D_Government_Office_02.jpg) · ノボホショコロトソ(노보호쇼코로토소) · CC BY 4.0
- 크기: 원본 4032x3024 → 1600x1200
- 촬영: 2025-11-23 10:03 (2025년 재개관 뒤, 이번 여행 1년 전 같은 날)
- 찍힌 것: 赤れんが庁舎(아카렌가 청사) 정면으로 곧게 난 벽돌 길, 둥글게 다듬은 관목, 오른쪽에 노랗게 물든 은행나무, 구름 낀 파란 하늘. 뒤로 고층 빌딩. 사람 둘이 작게.
- 주의: 「11월 말 이 모습」이라고 단정하지 않는다(해마다 단풍 시기가 다르다). 「2025년 11월 23일」처럼 날짜로.

### `beer-museum` · 삿포로 비루 박물관 정면

- 쓰는 곳: 33-day3.html 오프너
- 출처: [File:Sapporo beer museum-20091012-RM-211854.jpg](https://commons.wikimedia.org/wiki/File:Sapporo_beer_museum-20091012-RM-211854.jpg) · Ermell · CC BY-SA 4.0 (Commons 「Quality images」)
- 크기: 원본 3099x2823 → 1600x1457 (거의 정사각)
- 촬영: 2009-10-12 밤
- 찍힌 것: サッポロビール博物館(삿포로 비루 박물관) 붉은 벽돌 건물 정면. 박공 꼭대기와 둥근 창에 붉은 별, 아치형 출입문 둘에 불이 켜져 있다. 앞은 잔디(눈 없음). 오른쪽 끝에 상점 간판 일부(SAPPORO BE...)가 작게.
- 고른 이유: BRIEF 「붉은 벽돌 외관」. 굴뚝의 「サッポロビール」 큰 글씨가 없는 사진이라 오프너 상표 규칙(5-1)에 덜 걸린다.
- 주의: 붉은 별은 건물의 일부지만 맥주 상표와 겹친다(BRIEF 7장). 오프너로 가로를 자르면 세로 위치 55~60% 에 맞추면 둥근 창부터 문까지 남고 꼭대기 별은 잘린다.
- 다른 후보: サッポロガーデンパーク（Sapporo Garden Park） - panoramio (8)(t-konno, 2015-12-05, 눈 덮인 밤과 크리스마스트리, 분위기는 가장 좋지만 굴뚝의 「サッポロビール」 글씨와 별이 크게 보여 오프너에서 뺐다), Sapporo, Hokkaido (50762129131)(Kzaral, 2020-11-21 밤, 굴뚝 글씨 큼).

### `ario-sapporo` · 아리오 삿포로 외관

- 쓰는 곳: 33 (원고에는 아직 없음)
- 출처: [File:Ario Sapporo.jpg](https://commons.wikimedia.org/wiki/File:Ario_Sapporo.jpg) · モンモン(몬몬) · CC BY-SA 3.0 (GFDL 과 다중)
- 크기: 원본 3072x1728 → 1800x1012
- 촬영: 2009-06-27 낮
- 찍힌 것: アリオ札幌(아리오 삿포로) 건물 정면 위에 「Ario」 간판, 앞에 택시 승강장, 나무, 안내 표지. 여름.
- 주의: 2009년 모습이다. 입점 매장(アカチャンホンポ(아카찬혼포) 포함)은 사진에 보이지 않는다. 상표가 크게 보이니 오프너에는 쓰지 않는다(본문 half 는 가능).

### `cts-terminal` · 신치토세 공항 국제선 터미널

- 쓰는 곳: 34-day4.html 오프너
- 출처: [File:New Chitose Airport outside (International).jpg](https://commons.wikimedia.org/wiki/File:New_Chitose_Airport_outside_(International).jpg) · 欅(게야키, Keyaki) · CC BY-SA 3.0 (GFDL 과 다중)
- 크기: 원본 3648x2736 → 1800x1350
- 촬영: 2010-04-11 (파일 설명 「新千歳空港国際線ターミナルビル」(신치토세 공항 국제선 터미널 빌딩))
- 찍힌 것: 흐린 날의 유리벽 터미널 외관. 2층 높이에 「国際線 INTERNATIONAL」 글자. 앞에 넓은 차도와 어린 가로수.
- 주의: 2010년 사진이다. 그 뒤 국제선 터미널이 증축됐다는 것은 이 사진 노트에서 확인하지 않았으니, 캡션에 「지금 모습」이라고 쓰지 않는다. 34 하우투의 2층 연결시설·3층 출발 로비 위치를 이 사진이 보여 주는 것은 아니다.
- 다른 후보: EC733 B3105(2016-03, 눈이 남은 선로의 733계 쾌속 에어포트 차량, CC BY-SA 4.0), JRH Series733 B3109(CC0, 여름), 20181104 CTS 4355(2018-11-04 해 질 녘, 건물 실루엣).

### `yoichi-vineyard` · 仁木(니키) 일대의 늦가을 밭 (커버 스토리 오프너)

- 쓰는 곳: 11-feature-wine.html 오프너
- 출처: [File:20181105 NisekoHwy 4937 (48429301571).jpg](https://commons.wikimedia.org/wiki/File:20181105_NisekoHwy_4937_(48429301571).jpg) · Ray Swi-hymn · CC BY-SA 2.0 (Flickr, FlickreviewR 검토)
- 크기: 원본 7952x5304 → 2000x1334
- 촬영: 2018-11-05 15:30. 파일 좌표 43.1414, 140.7543. Commons 분류 「Niki, Hokkaido」. 같은 날 같은 사람이 余市(요이치)·仁木(니키)를 지나며 찍은 연작 가운데 하나다.
- 찍힌 것: 흐린 늦가을 오후. 왼쪽에 붉은 지붕 집, 앞쪽에 잎이 진 과수(사과·벚나무 같은 과수원으로 보임), 가운데에 노랗게 물든 덩굴이 낮은 덕에 줄지어 선 밭, 뒤로 단풍 든 낮은 산과 마을.
- **주의(캡션)**: 찍은 곳은 余市(요이치)가 아니라 仁木(니키)다. 가운데 노란 덩굴 줄은 모양으로 보아 포도밭으로 보이지만 파일 설명에는 「포도」라는 말이 없다(설명은 파일 번호뿐). 캡션 제안: 「余市(요이치)와 맞닿은 仁木(니키)의 늦가을 밭, 2018년 11월 5일.」 「余市(요이치)의 포도밭」, 생산자 이름은 쓰지 않는다.
- 화질: 달리는 차 안에서 찍어 앞쪽 과수가 조금 흐리다. 가운데 밭과 산은 선명하다. 오프너로 가로를 자를 때 세로 위치 60% 안팎.
- 다른 후보: 같은 연작 4938(같은 밭을 더 넓게, 위에 전깃줄), 4941(밭 앞 비닐하우스와 지지대), Furano Vineyard(MaedaAkihiko, 2024-08-29, CC0, 富良野(후라노)의 초록 포도밭, 화질은 가장 좋지만 산지와 계절이 다름).

### `pinot-noir` · 피노 누아 송이 (프랑스)

- 쓰는 곳: 11-feature-wine.html (web-only)
- 출처: [File:Grappe de pinot noir, Cher, France.jpg](https://commons.wikimedia.org/wiki/File:Grappe_de_pinot_noir,_Cher,_France.jpg) · Cjp24 · CC BY-SA 4.0
- 크기: 원본 2048x1536 → 1600x1200
- 촬영: 2007-10-14. 파일 설명: 프랑스 셰르(Cher) 주 Bué 마을 근처의 피노 누아(Sancerre AOC 분류)
- 찍힌 것: 누렇게 물든 포도잎 사이의 검푸른 피노 누아 송이 하나.
- **주의(캡션)**: 홋카이도 사진이 아니다. 캡션 제안: 「Pinot Noir 송이. 프랑스 셰르(Cher), 10월.」

### `sugidama` · 양조장 처마의 스기다마

- 쓰는 곳: 12-feature-sake.html 오프너
- 출처: [File:Senjo Japanese Sake Breweries Sugidama.jpg](https://commons.wikimedia.org/wiki/File:Senjo_Japanese_Sake_Breweries_Sugidama.jpg) · さかおり(사카오리) · CC BY-SA 4.0
- 크기: 원본 6000x4000 → 1800x1200
- 촬영: 2017-01-28 12:21. 파일 설명 「Senjo Japanese Sake Breweries」, 좌표는 長野県(나가노현). 홋카이도 양조장이 아니다.
- 찍힌 것: 나무 처마 밑에 줄로 매단 갈색 杉玉(스기다마) 하나. 왼쪽 파란 하늘, 오른쪽 흰 회벽, 아래로 낙수관.
- 주의: 마른 갈색 스기다마다(새로 건 초록색이 아니다). 「새 술이 나왔다는 표시」 같은 뜻풀이는 사진이 보여 주지 않으니 캡션에 넣지 않는다. 12 캡션 「양조장 처마의 杉玉(스기다마).」는 그대로 맞다.
- 다른 후보: **Takasago Sake Brewery, Asahikawa - Feb 5, 2010**(Jennifer Feuchter, CC BY 2.0): 旭川(아사히카와) 高砂酒造(다카사고 주조)가 눈에 묻힌 겨울 모습, 처마에 스기다마가 작게 보인다. 홋카이도 양조장이라 12 의 「따뜻해진 겨울과 양조장」 상자에 잘 맞지만 「国士無双」(고쿠시무소) 상표 깃발이 보이고 스기다마가 작아 오프너로는 뺐다. 쓰고 싶으면 새 ID 로 `qa/asset-requests.md` 에. 그 밖에 Sakabayashi at Chiyonosono(2025-03, 초록 스기다마, 일본어 안내판이 큼), Sugitama Chizu(2023-12, 초록이지만 양조장이 아닌 민가).

### `hokkaido-rice` · 이시카리의 논

- 쓰는 곳: 12-feature-sake.html (web-only)
- 출처: [File:稲畑（rice field） - panoramio - t-konno (1).jpg](https://commons.wikimedia.org/wiki/File:%E7%A8%B2%E7%95%91%EF%BC%88rice_field%EF%BC%89_-_panoramio_-_t-konno_(1).jpg) · t-konno · CC BY-SA 3.0
- 크기: 원본 3024x2016 → 1800x1200
- 촬영: 2016-09-16. 좌표 43.2605, 141.4275, Commons 분류 「Ishikari, Hokkaido」
- 찍힌 것: 수확 전 누렇게 익은 논 사이로 풀 난 둑길이 곧게 뻗었다. 파란 하늘, 흰 구름, 멀리 숲.
- 주의: 벼 품종은 알 수 없다(酒米(주미)라고 쓰지 않는다). 石狩(이시카리)는 空知(소라치)가 아니다.

### `sake-glass` · 술병과 마스 잔

- 쓰는 곳: 13-drink-ten.html (web-only)
- 출처: [File:Japanese sake glass and flask.jpg](https://commons.wikimedia.org/wiki/File:Japanese_sake_glass_and_flask.jpg) · Culture Japon · CC BY-SA 4.0
- 크기: 원본 5184x3888 → 2000x1500
- 촬영: 2022-10-10. 장소 기록 없음
- 찍힌 것: 나무 카운터 위의 짙은 남색 도기 술병(徳利(도쿠리)), 네모난 나무 잔(枡(마스)) 안에 놓인 유리잔. 상표 없음.

### `soup-curry` · 스프카레

- 쓰는 곳: 21-table-lunch.html
- 출처: [File:Curry dish at Rojiura Curry SAMURAI in Sapporo, Japan (242).jpg](https://commons.wikimedia.org/wiki/File:Curry_dish_at_Rojiura_Curry_SAMURAI_in_Sapporo,_Japan_(242).jpg) · Savannah Rivka · CC BY-SA 4.0 (Wiki Loves Folklore 2020)
- 크기: 원본 4160x3120 → 2000x1500
- 촬영: 2019-07-17 13:00. 삿포로의 스프카레 가게(Rojiura Curry SAMURAI, 이 책의 가게 아님)
- 찍힌 것: 흰 그릇의 채소 스프카레(연근, 단호박, 당근, 가지, 껍질콩, 양배추 등)와 흰밥 한 접시.
- 주의: 21 캡션 「삿포로 스프카레의 한 예.」와 맞는다. 木多郎(기타로)·스아게의 사진이 아니다.

### `ramen` · 미소 라멘

- 쓰는 곳: 21 (원고에는 아직 없음)
- 출처: [File:Miso ramen of Sapporo 01.jpg](https://commons.wikimedia.org/wiki/File:Miso_ramen_of_Sapporo_01.jpg) · ノボホショコロトソ(노보호쇼코로토소) · CC BY 4.0
- 크기: 원본 4032x3024 → 1600x1200
- 촬영: 2025-11-23 18:10. 파일 설명 「ラーメン大将の味噌ラーメン」(라멘 다이쇼의 미소 라멘). 촬영 장소는 파일에 없다
- 찍힌 것: 물결무늬 그릇의 미소 라멘. 차슈, 김, 반숙 달걀, 미역, 죽순(멘마), 깨.
- 주의: 鍾馗(쇼키)의 背脂煮干(세아부라 니보시) 라멘과는 종류가 다르다. 「삿포로 라멘의 한 예」 이상은 쓰지 않는다.

### `kaisendon` · 해산물 덮밥

- 쓰는 곳: 22-table-dinner.html
- 출처: [File:Hakodate Asaichi Hokkaido Japan10bs.jpg](https://commons.wikimedia.org/wiki/File:Hakodate_Asaichi_Hokkaido_Japan10bs.jpg) · 663highland · CC BY 2.5 (GFDL 과 다중)
- 크기: 원본 4500x3000 → 2000x1333
- 촬영: 2012-07-27, 函館(하코다테) 아침시장
- 찍힌 것: 검은 그릇에 성게알·가리비 관자·연어알을 세 칸으로 올린 덮밥, 와사비. 뒤에 메뉴판 일부.
- 주의: 삿포로·すしどんぶり(스시돈부리)의 사진이 아니다. 22 캡션 「해산물 덮밥의 한 예.」 그대로 맞다.

### `yakitori` · 닭고기와 대파 꼬치

- 쓰는 곳: 22-table-dinner.html (web-only)
- 출처: [File:Yakitori 001.jpg](https://commons.wikimedia.org/wiki/File:Yakitori_001.jpg) · Ocdp · CC0 1.0
- 크기: 원본 4288x2848 → 1800x1195
- 촬영: 2015-04-10. 장소 기록 없음
- 찍힌 것: 흰 접시에 양념(타레)을 발라 구운 ねぎま(네기마, 닭고기와 대파) 꼬치 두 개.
- 주의: 鷄灯(게이토)의 사진인지 알 수 없다(아니라고 보는 것이 자연스럽다). 처음 고른 Schellack 의 사진은 Commons 에서 「en.wikipedia 에서 옮겨 와 검토가 필요한 파일」로 분류돼 있어 뺐다.

### `gyoza` · 군만두

- 쓰는 곳: 22 (원고에는 아직 없음)
- 출처: [File:Gyoza (15794493706).jpg](https://commons.wikimedia.org/wiki/File:Gyoza_(15794493706).jpg) · Jun Seita · CC BY 2.0
- 크기: 원본 4896x3264 → 2000x1333
- 촬영: 2014-11-17. 파일 설명: 도쿄 銀座(긴자)의 중국요리점
- 찍힌 것: 흰 접시에 겹쳐 놓인 큼직한 군만두. 밑면이 노릇하다.
- 주의: SAPPORO餃子製造所(삿포로 교자 세이조쇼)의 사진이 아니다.

### `tanukikoji` · 다누키코지 상점가 입구

- 쓰는 곳: 22 (원고에는 아직 없음)
- 출처: [File:Tanukikoji Shopping Arcade - Jul 21, 2023.jpg](https://commons.wikimedia.org/wiki/File:Tanukikoji_Shopping_Arcade_-_Jul_21,_2023.jpg) · MIKI Yoshihito · CC BY 2.0
- 크기: 원본 6000x4000 → 1800x1200
- 촬영: 2023-07-21 21:27 (여름 밤)
- 찍힌 것: 狸小路(다누키코지) 1丁目(초메) 쪽 입구. 불 켜진 반원형 아치 간판(「狸小路1」), 안쪽으로 길게 이어진 아케이드와 걸린 장식. 사람 몇 명이 작게.
- 주의: 교자 가게(다누키코지점)가 몇 丁目(초메)인지와 이 사진의 입구는 관계없다. 캡션에 가게 위치를 이 사진으로 보여 주지 않는다.

### `susukino-night` · 눈 오는 스스키노 교차로

- 쓰는 곳: 23-bars.html 머리(wide)
- 출처: [File:Sapporo 札幌 (55160247697).jpg](https://commons.wikimedia.org/wiki/File:Sapporo_%E6%9C%AD%E5%B9%8C_(55160247697).jpg) · Melvin Loi · CC BY-SA 4.0 (Flickr, FlickreviewR 검토)
- 크기: 원본 11565x7710 → 1600x1066
- 촬영: 2026-03-20 22:00, 눈 내리는 밤
- 찍힌 것: すすきの(스스키노) 교차로를 높은 곳에서 본 장면. 눈발, 젖은 도로에 비친 불빛, 택시, 우산 든 사람들(작게). 왼쪽에 맥주 광고판, 오른쪽에 위스키 회사의 큰 인물 광고판(ニッカ(닛카)).
- 주의: 광고판(맥주·위스키 상표)이 크게 보인다. BRIEF 5-1 은 상표가 큰 사진을 표지·오프너에 쓰지 말라고 했다. 23 은 낮은 머리라 오프너는 아니지만, 조판에서 거슬리면 알려 달라(아래 다른 후보로 바꿀 수 있다). 3월 사진이라 캡션은 「눈 오는 밤」까지만, 계절을 11월로 쓰지 않는다.
- 다른 후보: Night view Sapporo Susukino(Purity Standard, 2015-04, 텅 빈 교차로와 넓은 하늘, 광고판은 조금 작음, CC BY 2.0).

### `wine-shelf` · 와인 선반

- 쓰는 곳: 24-bottles.html (web-only)
- 출처: [File:Sapporo (30438606327).jpg](https://commons.wikimedia.org/wiki/File:Sapporo_(30438606327).jpg) · Luca Sartoni · CC BY-SA 2.0 (Flickr, FlickreviewR 검토)
- 크기: 원본 6240x4160 → 1600x1066
- 촬영: 2018-10-16 16:59. 파일 설명은 「Sapporo」뿐(Commons 분류 「Food in Sapporo」)
- 찍힌 것: 노란 선반 여러 단에 와인병이 빼곡하고, 병목마다 손글씨 엔화 가격표. 보이는 라벨은 대부분 이탈리아 와인이다.
- 주의: 어느 가게인지 모른다(가게·바·주류점 단정 금지). 홋카이도·일본 와인 진열이 아니다. 24 캡션 「일본 와인숍의 진열.」은 「와인 선반의 한 예(삿포로, 2018년 10월).」 쯤으로 고치기를 권한다.
- 다른 후보: ワインショップfuji 0001(宮城県(미야기현)의 자동차용품 회사 와인숍, 이름이 フジヰ(후지이)와 헷갈려 뺐다), Furano Wine Bottles(富良野(후라노) 와인 세 병, 진열은 아님).

### `ke-b777` · 대한항공 B777-300

- 쓰는 곳: 41-prestige.html
- 출처: [File:HL7533@PEK (20171108130125).jpg](https://commons.wikimedia.org/wiki/File:HL7533@PEK_(20171108130125).jpg) · N509FZ · CC BY-SA 4.0
- 크기: 원본 6179x3920 → 2000x1268
- 촬영: 2017-11-08, 베이징 서우두 공항 착륙 직전(인천발 KE855). 기체 HL7533(Commons 분류 「Current Boeing 777-300 of Korean Air」)
- 찍힌 것: 착륙 장치를 내린 대한항공 보잉 777-300, 옛 도장, 흐린 하늘.
- 주의: 이번 KE765 의 기체라고 쓰지 않는다. 41 캡션 「대한항공 B777-300의 한 예.」 그대로 맞다.

### `icn-t2` · 인천공항 제2여객터미널 출국장

- 쓰는 곳: 41-prestige.html (web-only)
- 출처: [File:2025-10-14 17.17.07 Incheon International Airport.jpg](https://commons.wikimedia.org/wiki/File:2025-10-14_17.17.07_Incheon_International_Airport.jpg) · Choikwangmo25 · CC0 1.0
- 크기: 원본 5712x4284 → 1600x1200
- 촬영: 2025년 10월(파일 이름과 기록 시각이 13시간 어긋나 아침인지 저녁인지 단정하지 않는다). Commons 분류 「Incheon International Airport Terminal 2」
- 찍힌 것: 위층에서 내려다본 출국장. 높은 천장, 둥근 조명, 체크인 카운터와 의자, 화분. 사람이 적다.

### `snow-street` · 첫눈 온 거리

- 쓰는 곳: 43-transport.html (web-only)
- 출처: [File:Morning of snow in sapporo - panoramio (1).jpg](https://commons.wikimedia.org/wiki/File:Morning_of_snow_in_sapporo_-_panoramio_(1).jpg) · t-konno · CC BY-SA 3.0
- 크기: 원본 2298x1535 → 1600x1068
- 촬영: 2014-11-15 아침. 좌표 43.0548, 141.3462(中島公園(나카지마 공원) 북쪽, すすきの(스스키노) 남쪽 부근)
- 찍힌 것: 밤사이 내린 눈이 단풍이 남은 가로수에 소복이 얹혔다. 차도는 녹은 눈으로 젖었고 보도와 화단은 하얗다. 뒤로 고층 아파트.
- 주의: 11월 중순 첫눈 아침이다. 「이번 여행 때 이렇다」고 쓰지 않는다. 언 보도(BRIEF 2-1)를 보여 주는 사진은 아니다.

## 못 구한 ID

### `sorachi` (11, 우선 3)

- 찾은 곳: Commons 검색(Sorachi, Iwamizawa, 岩見沢, Mikasa, 三笠 ワイン, Kurisawa, Tappu, Yamazaki winery, 10R 등), 분류(Iwamizawa, Mikasa, Parks in Iwamizawa, Vineyards in Japan), 좌표 검색(山崎ワイナリー(야마자키 와이너리) 주변 5km, 栗沢(구리사와) 주변 8km).
- 결과: 空知(소라치)의 포도밭 사진이 없다. 보이는 후보는 셋인데 모두 뺐다.
  - 山崎ワイナリー エントランス(三笠(미카사), 2015-10, CC BY-SA 3.0): 와이너리 입구 구조물뿐이고, 2015년 영업시간 안내판이 크게 찍혀 있어 지금 정보로 읽힐 수 있다.
  - 道道38号(岩見沢(이와미자와) 上志文町(가미시분초) 논과 헛간, 2012-08, CC BY-SA 3.0): 空知(소라치) 풍경이지만 사진 구석에 웹 주소 워터마크(gpscycling.net)가 박혀 있다.
  - マオイワイナリー(長沼(나가누마), 2016-07): 와이너리 테라스와 들판, 포도밭 아님.
- 원고: 11 의 `figure.photo.half.web-only` 는 빌드가 뺀다(「사진 없음」 경고 1건). 편집장 승인 목록에 올려 달라.

### `chitosetsuru` (24, 우선 2)

- 찾은 곳: Commons 검색(千歳鶴, Chitosetsuru, Chitose-tsuru, 日本清酒, Nippon Seishu, 酒ミュージアム), 분류(Sake breweries in Hokkaido, Liquor stores in Hokkaido), 南3条東5丁目(미나미 3조 히가시 5초메) 좌표 주변 검색.
- 결과: 日本清酒(닛폰세이슈) 양조장·지토세쓰루 사케 뮤지엄 사진이 Commons 에 없다. ja.wikipedia 「日本清酒」 문서에도 사진이 없다.
- 원고: 24 의 `figure.photo.half.web-only` 는 빌드가 뺀다(「사진 없음」 경고 1건).
