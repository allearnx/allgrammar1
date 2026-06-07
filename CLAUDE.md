# Problem Sheet Validation Gate — 검증 게이트 구현 시 참고

7단계(저장 시점 검증 게이트)에서 막아야 할 패턴 목록.
문제 시트 생성/수정 API(`POST/PATCH /api/naesin/problems`)에서 저장 전 검증.

## 검증 규칙

### 1. 원형숫자 자동 변환
- ①②③④⑤⑥⑦⑧⑨⑩ → 1,2,3,...10 자동 변환
- ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙ → 옵션 번호로 자동 변환 (옵션이 ⓐ로 시작하면 해당 인덱스)
- `questions[].answer` + `answer_key[]` 모두 대상
- 이미 수정 완료: B(198건) + C패턴1(13건)

### 2. 빈 정답 저장 거부
- `questions[].answer`가 빈 문자열이면 저장 거부 (외부지문 category 제외)
- `subParts[].answer`도 동일 적용
- 발견: E 카테고리 35건 (의문사의문문Step2, 조동사Step1, 과거완료step2, 부사절접속사Step3 등)

### 3. 객관식 정답 범위 검증
- options가 있으면 answer는 1~options.length 범위의 숫자여야 함
- 복수정답("1, 3")인 경우 각 숫자 모두 범위 내
- 범위 밖이면 저장 거부 + 에러 메시지

### 4. 텍스트 정답 + 선택지 불일치 검증
- options가 있는데 answer가 텍스트(숫자가 아닌)인 경우:
  - answer가 options 중 하나와 일치하면 → 자동으로 옵션 번호로 변환 (저장 시 자동 정규화)
  - 일치하지 않으면 → **저장 차단** + 에러: "정답이 선택지와 일치하지 않습니다. 서술형이면 선택지를 비워주세요."
- 근본 원인: 보기(word bank)를 options에 넣으면 라디오 버튼 UI가 되어 텍스트 입력 불가
- 구현 위치: 문제 시트 저장 API + 관리자 UI에서 저장 버튼 클릭 시 프론트엔드 검증도 추가
- 발견: C패턴3 (26건) — 보기 단어를 options에 넣고 정답은 조합 텍스트

### 5. "번호+텍스트" 정답 자동 정규화
- answer가 "2 She goes to the gym." 형태(숫자+공백+대문자)면 → 앞의 숫자만 자동 추출
- 저장 시 자동 변환 (에러가 아닌 자동 수정)
- 발견: C패턴2 (6건) — 의문사의문문Step1, 부사절접속사Step3

### 8. 서술형 전환 시 답안 형식 안내 필수
- options를 비워서 서술형으로 만드는 경우:
  - 문제 텍스트에 답안 형식 안내(※)가 없으면 경고 표시
  - 예: "※ 두 단어를 띄어쓰기로 구분 (예: enjoy swimming)"
  - 예: "※ 빈칸 순서대로 쉼표로 구분 (예: went, Did, enjoy)"
  - 예: "※ 슬래시(/)로 구분 (예: had left / arrived)"
- 근본 원인: 안내 없이 서술형이면 학생이 형식을 몰라 오답 처리됨
- 구현: 경고만 (강제 차단은 아님, 단순 서술형은 안내 불필요할 수 있음)

### 6. 설명-정답 일치 검증 (선택)
- explanation에서 "따라서 N번", "정답은 N번" 패턴 추출
- 추출된 N이 answer와 불일치하면 경고
- 패턴 매칭 기반이라 false positive 주의 ("N번째" 등 제외)

### 7. 선택지 최소 개수
- options가 1개 이하면 경고 (객관식인데 선택지가 부족)

## 진행 상황 (2026-05-31 기준)

### 완료
- [x] B: 원형숫자 ①②③ → 숫자 정규화 (198건, 24시트)
- [x] C패턴1: ⓐⓑⓒⓓⓔ → 숫자 변환 (13건)
- [x] 패턴1 재채점: 학생 16건 확인 → 변경 0건 (영향 없음)

- [x] C패턴2: "번호+텍스트" → 번호만 추출 (6건) — 완료, 시도 0건
- [x] C패턴3: 보기→서술형 전환 + 안내문 + acceptedAnswers (26건) — 완료, 시도 0건
- [x] E: 빈 정답 수정 — 총 70건 처리:
  - Multi-select 답 복사 (q.answer→answer_key): 35건, 7시트
  - 정답 도출 + 채우기 (영작/문장완성): 18건, 4시트 + acceptedAnswers 추가
  - 불완전 문제 삭제 (지문/보기/이미지 누락): 17건, 4시트
  - 학생 재채점: 1건 확인 → 점수 변동 없음
- [x] 검증 완료: 빈 정답 0건 (외부지문 제외 전체 시트)

- [x] 2단계: 정답과 AI 설명 일치 검증 — 9,572개 설명 중 불일치 0건
- [x] 3단계: 유사 정답 처리 확인 — 2,119건 오답 분석, 채점 버그 0건
  - AI 채점 우선 순위 버그 예방 코드 수정 완료 (submit/route.ts)
  - retryCorrect 11건은 정상 동작 (재시도 정답 추적)
- [x] 4~5단계: 학생 채점 검증 — 전체 198건 재채점, 점수 변동 0건
- [x] 6단계: 대시보드/진도 업데이트 확인
  - Stale progress 4건 수정 (새 시트 추가 후 완료 상태 미갱신)
  - 원인: 시트 추가 시 기존 progress 미업데이트

- [x] 7단계: 저장 시점 검증 게이트 구현
  - sanitizeQuestions: 원형숫자 변환, 배열→문자열, 텍스트→번호, answer_key 재구축
  - sanitizeQuestions: 서술형 답안 형식 변형 acceptedAnswers 자동 생성 (슬래시/마침표/괄호 공백)
  - validateBeforeSave: 빈 정답 차단, MCQ 범위 검증, 텍스트 불일치 차단, subParts 검증
  - 서술형 복합 답안 형식 안내 미비 경고 (NO_FORMAT_HINT)
  - normalize-answer.ts 강화: 개행/탭→공백, 슬래시 공백 통일, 번호 접두사 제거 비교
- [x] 전수 조사: 중1/중2/중3 문법 템플릿 (총 387개 시트, 25,000+문항)
  - 정답 오류 수정: 중1 10건, 중2 61건, 중3 73건
  - 형식 차이 오채점 전체 재채점: 69건 점수 상승

### 진행 중
- [ ] A: 외부지문 빈 정답 (88건) — 맨 마지막

### 검증 규칙 추가
- answer_key 형식 통일 필요: 일부 시트는 string[], 일부는 {answer, explanation}[]
- multi-select 답안 (q.answer가 배열)은 저장 시 answer_key에도 자동 동기화 필요
- 시트 추가 시 해당 유닛의 학생 진도(problem_completed/mock_exam_completed)를 false로 리셋 필요

---

# select('*') → 컬럼 명시 전환 (egress 절감)

ESLint `supabase/no-select-wildcard` 규칙 적용 중 (warn).
현재 117건 경고. 테이블별로 컬럼 상수를 만들고 일괄 교체.

## 기존 컬럼 상수 (src/types/naesin.ts)
- `SHEET_LITE_COLUMNS` — 문제 시트 목록용 (13컬럼, questions/answer_key 제외)
- `SHEET_ADMIN_LITE_COLUMNS` — 관리자 목록용 (+ answer_key)
- `PROGRESS_SUMMARY_COLUMNS` — 학생 진도 요약용 (17컬럼)

## 정리 우선순위

### 1순위: 고 egress (38+ 컬럼, 매 페이지 로드)
- [ ] `naesin_student_progress` — 7개 파일, `PROGRESS_SUMMARY_COLUMNS` 활용
  - src/app/(dashboard)/layout.tsx (fetchNaesinTree)
  - src/lib/naesin/fetch-stage-data.ts
  - src/lib/dashboard/fetch-naesin-data.ts
  - src/app/api/naesin/progress/manual/route.ts
  - src/components/dashboard/naesin-admin/use-unit-content-data.ts

### 2순위: JSONB 포함 콘텐츠 테이블
- [ ] `naesin_vocabulary` — 컬럼 상수 생성 필요 (front_text, back_text 등)
  - src/lib/naesin/fetch-stage-data.ts
  - src/components/dashboard/naesin-admin/use-unit-content-data.ts
- [ ] `naesin_passages` — 컬럼 상수 생성 필요 (sentences JSONB 제외 가능)
- [ ] `naesin_dialogues` — 컬럼 상수 생성 필요

### 3순위: 보카 테이블
- [ ] `voca_student_progress` — 4개 파일
- [ ] `voca_vocabulary` — 3개 파일

### 보류: 소규모 admin 테이블 (영향 적음)
- academies, courses, reviews, faqs, announcements, teacher_profiles
- CRUD 폼에서 전체 레코드 필요 → select('*') 유지 가능

---

# Supabase GRANT 마이그레이션 — 단계적 전환 (마감: 2026-10-30)

2026-05-30부터 신규 프로젝트는 public 스키마 테이블에 명시적 GRANT 필요.
기존 프로젝트(우리)는 2026-10-30까지 현행 유지. 단계적으로 진행.

## 현황
- 현재 GRANT가 있는 테이블: `users` (071_fix_anon_users_grant.sql — anon SELECT만)
- 나머지 전체 테이블: 암묵적 권한에 의존 중 (10월 이후 접근 불가 위험)

## 계획 (단계적)
- [ ] 1단계: 전체 테이블 목록 + 필요 권한(anon/authenticated/service_role) 정리
- [ ] 2단계: 핵심 테이블부터 GRANT 마이그레이션 작성 (naesin_*, users, services 등)
- [ ] 3단계: 나머지 테이블 GRANT 추가
- [ ] 4단계: 스테이징에서 테스트 후 프로덕션 적용
- [ ] 5단계: 기본 권한 비활성화 (10월 전 완료)

## 참고
- RLS는 이미 전 테이블에 활성화되어 있으므로 GRANT 추가해도 보안 문제 없음
- 새 테이블 생성 시 GRANT 포함하는 습관 필요

---

# Egress 최적화 작업 로그 (2026-06-05)

## 배경
Supabase egress 과다 문제 해결 후, 재발 방지를 위해 캐시 레이어 + ESLint 규칙 도입.

## 커밋 이력

### 381ebf4 — 캐시 레이어 도입 (20파일, +363/-137)
**서버 캐시 인프라 (src/lib/cache/)**
- `tags.ts` — 캐시 태그 생성 함수 7개 (student-services, is-paid, naesin-sidebar, student-progress, unit-content, voca-content, voca-books)
- `server-cache.ts` — `cached()` 래퍼 + TTL 프리셋 (STATIC 1h, CONTENT 5m, SESSION 5m, LIVE 60s)
- `invalidate.ts` — 무효화 헬퍼 6개 (Next.js 16 revalidateTag 'max' 호환)

**layout.tsx 리팩터**
- 인라인 unstable_cache 3개 → cached() 래퍼로 전환 (동작 동일)

**mutation 라우트 무효화 연결 (10개)**
- service-assignments POST/PATCH/DELETE → invalidateStudentServices
- student/select-free-service POST → invalidateStudentServices
- naesin/exam-assignments POST/DELETE → invalidateStudent
- naesin/progress/manual PATCH → invalidateStudent
- naesin/problems POST/PATCH → invalidateUnitContent
- naesin/textbook-videos POST/DELETE → invalidateUnitContent
- naesin/similar-problems PATCH/DELETE → invalidateUnitContent
- voca/books POST + [id] PATCH/DELETE → invalidateVocaBooks
- voca/days POST/DELETE → invalidateVocaContent

**고빈도 GET 라우트 서버 캐시 적용 (4개)**
- GET /api/naesin/textbook-videos → CONTENT (5min), tag: unit-content:{unitId}
- GET /api/voca/books → CONTENT (5min), tag: voca-books
- GET /api/voca/days → CONTENT (5min), tag: voca-content:{bookId}
- GET /api/naesin/similar-problems → LIVE (60s), tag: unit-content:{unitId}

**React Query 전환 (4개 컴포넌트)**
- LearningCalendarSection — useEffect→useQuery, staleTime 5min
- AdminAnalyticsClient — useEffect+useState→useQuery, staleTime 5min
- BossAnalyticsClient — useEffect+useState→useQuery, staleTime 5min
- WrongAnswersClient — useCallback+useEffect→useQuery + optimistic update, staleTime 1min

### f748e38 — ESLint select('*') 경고 규칙 (6파일, +98/-2)
- src/eslint/no-select-wildcard.mjs — .select('*') 감지 규칙
- src/eslint/plugin.mjs — 플러그인 래퍼
- eslint.config.mjs — supabase/no-select-wildcard: warn, 테스트 파일 제외
- CLAUDE.md — 테이블별 정리 우선순위 기록
- 현재 경고 117건 (warn only, 빌드 차단 없음)

## 검증 결과
- TypeScript: 에러 0건
- 빌드: 성공
- 테스트: 748/748 통과
- ESLint: 에러 0건
