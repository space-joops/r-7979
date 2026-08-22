# 오늘의 경마 — 현황과 다음 작업

> 마지막 갱신: 2026-08-22. 세부 API 규칙은 `kra-openapi-reference.md`, 예측 모델 개선은 `../notes/README.md` 참조.

## 서비스 현황 (프로덕션 가동 중)

https://r-7979.vercel.app · GitHub `space-joops/r-7979` (main 푸시 = 자동 배포)

| 영역 | 상태 |
|---|---|
| 출마표 `/racecard` | ✅ API78, 트랙별 에버그린 + 날짜 페이지, ISR |
| 경주결과 `/results` | ✅ API299 + 단승/연승 배당 조인, 주로 상태 표시 |
| 확정 배당률 `/odds` | ✅ API301, 승식별 섹션 + 상위10/접기 |
| 예측 `/predict` | ✅ 모델 v1 (z-score 가중합+softmax), 근거 공개, 과거 날짜 적중 성적 자동 표시. 백테스트(서울 4개 개최일 40경주): top1 22.5% / top3 40% |
| 말/기수 전적 `/horses` `/jockeys` | ✅ 이름 기반, 출마표·결과에서 전부 링크 |
| SEO | ✅ sitemap/robots/JSON-LD/OG, 네이버·구글 소유확인 파일 배포됨. 구글 서치콘솔 사이트맵 제출 완료 |
| PWA 퍼널 | ✅ manifest/아이콘/설치 유도(인앱 탈출 포함), GA4 이벤트 계측 |
| 푸시 | ✅ 서버 Web Push — Upstash Redis(`r-7979-push`) + Vercel Cron(`0 22 * * *` UTC = KST 07시, 월~목 스킵). Android PBS 폴백 병행 |
| 연구 환경 | ✅ `notes/` Jupyter+Deno — 프로덕션 모델 직접 import, 백테스트/튜닝 (전 셀 검증됨) |

## ⏳ 미완 — 바로 이어서 할 것

1. **폰 실기기 푸시 테스트 (구독 0건 상태)**
   - 폰 브라우저로 사이트 접속 → 홈 화면에 추가 → 설치된 앱 실행 → "알림 받기" 허용
   - 구독 확인: `node --env-file=.env.local -e "...hlen('push:subs')..."` (또는 Upstash 대시보드)
   - 테스트 발송: `curl -H "Authorization: Bearer $CRON_SECRET" "https://r-7979.vercel.app/api/push/send?force=1"`
   - 일요일 아침 7시(KST) 크론 실발송도 확인할 것
2. **실기기 퍼널 E2E**: 카톡 공유 → 인앱 탈출 버튼 → 설치 → GA4 실시간에서 `inapp_escape_landed`/`app_installed`/`push_subscribed` 확인 (iOS/Android 각 1회)
3. **네이버 서치어드바이저**: 사이트맵 제출 여부 확인 + 주요 허브 수집 요청 (구글은 완료됨)
4. **GA4 콘솔 설정(수동)**: 맞춤 측정기준 등록 — `method`, `ui`, `inapp_name`, `app_mode`, `platform`, `tag`, `browser` (이벤트 범위) + 퍼널 탐색 리포트 구성

## 다음 개발 후보 (우선순위 제안 순)

1. **모델 v2 — 말 자체 성적 피처** (`notes/01-model-v1.ipynb` §7 로드맵 참조)
   - 현재 모델 최대 공백: 신마전에서 레이팅 전원 결측 → 사실상 기수 성적만으로 판단
   - API15_2를 마명당 1회 호출(1일 캐시 필수) 또는 API214_1 월 단위 수집으로 승률/연대율 확보
   - 절차: 노트북 백테스트 → `lib/predict/model-v2.ts` 새 파일 → `PredictView` import 교체
2. **적중 성적 아카이브 페이지**: 날짜별 적중률 히스토리 누적 표시 (모델 신뢰도 = 재방문 동력)
3. **동적 OG 이미지**: 날짜별 출마표/예측 공유 카드 (`ImageResponse`)
4. **경주 상세에 날씨/주로 예보**: API311/313 — `lib/kra/client.ts`에 XML 폴백 파서 필요 (§4 참조)
5. **커스텀 도메인**: 구매 시 `lib/site.ts`의 SITE_URL만 변경 + Vercel 도메인 연결
6. 설/추석 대체 개최일 대응: `lib/kra/schedule.ts` + `race-days.ts`에 예외 날짜 상수 도입

## 운영 메모

- KRA 키/VAPID/CRON_SECRET: `.env.local` + Vercel 3개 환경 등록 완료. `.env.example` 참조
- 배포 파이프라인: main 푸시 → 자동 프로덕션. 수동 배포 불필요
- 캐시 원칙: 과거 데이터 30일(불변), 당일 출마표 30분/배당 5분/결과 10분 — 비용 최소화 구조 유지할 것
- API78의 `raceNo`는 `"제1경주"` 문자열, API299는 숫자 — 신규 페처 작성 시 주의
