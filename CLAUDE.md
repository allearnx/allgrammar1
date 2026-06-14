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

### 완료 (추가)
- [x] A: 외부지문 빈 정답 — 전수 조사 결과 0건 (이전 E 수정 + sanitize 게이트로 해결 완료)

---

# 학생 UX 안정화 작업 로그 (2026-06-08~10)

## 커밋 이력

### db22e53 — 문제 제출 네트워크 오류 자동 재시도
- `fetchWithToast`에 `retry` 옵션 추가 (exponential backoff: 1s, 2s, 4s)
- TypeError(네트워크 끊김) + 5xx 서버 에러만 재시도, 4xx는 즉시 실패
- 6개 제출 call site에 `retry: 2` 적용:
  - use-interactive-problem.ts, use-paper-test.ts, omr-tab.tsx
  - workbook-omr-view.tsx, external-passage-view.tsx, image-answer-view.tsx
- 원인: 학생 정아인이 네트워크 오류로 3번 넘게 재풀이

### 7116ad4 — 인터랙티브 모드 25문항 묶음 자동 저장
- `CHUNK_SIZE = 25` 상수 + `chunkPaused` 상태 추가 (use-interactive-problem.ts)
- 25문항마다 자동 서버 저장 + 쉬어가기 화면 표시 (interactive-view.tsx)
- 진행률 바, 점수 배지, "나머지 N문제 계속하기" 버튼
- 100문항 시트에서 중간 유실 방지 (순수 UI 변경, 채점/제출 로직 미변경)

### 0d424e5 — 빈칸 채우기 유니코드 오채점 수정
- normalize-answer.ts: 유니코드 특수 공백/하이픈/따옴표 → ASCII 정규화
- 부호 빈칸(___) 제거 비교 추가

### 667b0a2 — 수동태 step2 시트 서술형 채점 개선 + subParts 변환
- 수동태 step2 템플릿(cac534f0) + 3개 복사본 수정:
  - 23개 빈칸 채우기 문제에 "※ 빈칸에 들어갈 말만 쓰시오" 안내 추가
  - 16개 복합 답안 문제를 subParts로 변환 (독립 채점)
  - 엣지 케이스 acceptedAnswers 추가 (쉼표/슬래시 변형, 수동태만 기재 등)
- regrade-sheet.ts: subParts 채점 실패 시 전체 문자열 비교 fallback 추가
- 결과: 윤지율 66→71점 (+5점 상승), 강무성/김민서 드래프트 재채점
- scripts/fix-sudontae-step2.mjs: 일회성 마이그레이션 + 재채점 스크립트

### e2f028a — 지문 저장 시 타이포그래피 문자 자동 정규화
- 저장 시 스마트 따옴표/대시 등 자동 변환

### 527fa6a — 마크다운 파이프 테이블 HTML 렌더링
- FormattedText 컴포넌트에 마크다운 표 파싱 추가:
  - 텍스트를 블록 단위(table vs text)로 분류
  - 파이프 테이블 → `<table>` + `<thead>`/`<tbody>` 렌더링
  - 구분선(`|---|---|`) 자동 필터링, 셀 내 `<u>` 인라인 마크업 지원
- 테이블 포함 래퍼 `<p>` → `<div>` 변경 (5개 파일):
  - interactive-view.tsx, results-screen.tsx, wrong-answer-review.tsx, wrong-answer-detail-panel.tsx
- 영향 범위: 12개 템플릿, 32개 시트, 256개 문항
- 원인: 학생 안지훈 — to부정사의 명사적 용법 Step1에서 표가 깨져 보임

### 40878cc — 슬래시 복합 답안 자동 subParts 변환 (재발 방지)
- sanitizeQuestions: 서술형 답안에 " / "가 포함되면 자동으로 subParts 생성
  - "A / B / C" → subParts: [{label:"(1)", answer:"A"}, {label:"(2)", answer:"B"}, ...]
  - 기존 subParts가 있으면 덮어쓰지 않음, 객관식은 대상 아님
- 테스트 5건 추가 (problem-validator.test.ts): 41 tests 전체 통과
- 원인: 수동태 step2 같은 복합 서술형을 새로 만들면 subParts 없이 저장되어 빈칸별 독립 채점 불가

### 41aa130 — 스테이지 완료 시 네비게이션 바 즉시 갱신
- `handleStageComplete`가 비어있어 완료해도 상단 nav bar에 반영 안 되던 문제 수정
- `stageStatuses`를 `useState`로 로컬 관리, 완료 시 해당 스테이지를 'completed'로 갱신
- `router.refresh()` 없이 클라이언트 상태만 업데이트하여 채점 결과 등 기존 state 유지
- 서버 props 변경 시(페이지 이동) `useEffect`로 자동 동기화
- 원인: 학생 이서하(올라영) — 단어 암기 완료 후 "다음으로 넘어가기"가 안 보임

### 91d0833 — 다음 단계 이동 배너 + 사이드바 naesinRequiredRounds 수정
- 스테이지 완료 시 "다음 단계로 이동" 초록색 배너 표시 (client.tsx)
- 사이드바 fetchNaesinTree에서 academy의 naesin_required_rounds를 가져와 calculateStageStatuses에 전달
- 원인: 학생 이서하(올라영) — 교과서 암기 완료 후 다음 단계로 가는 방법을 모름

### b2194ec — 교과서 암기 서브 단계 자동 전환
- 서브 단계(빈칸 채우기, 영작 등) 80점 이상 통과 시 다음 탭으로 자동 전환
- passedSubStages ref로 이미 통과한 탭은 건너뜀
- 원인: 학생 이서하 — 빈칸 채우기만 반복하고 영작 탭을 못 찾음

### 9911346 — 교과서 암기 이미 통과한 서브 단계 건너뛰기
- fetch-stage-data.ts에서 passage_fill_blanks_best, passage_ordering_best 등 서브 단계 최고 점수 조회
- usePassageTabState에서 initialTab을 첫 번째 미통과 탭으로 설정 (80점 미만)
- 원인: 이미 빈칸 채우기 100점인데 페이지 로드마다 빈칸 탭에서 시작

### 9b5718a — 학생 화면 보기 버튼을 admin/teacher 역할에도 표시
- ImpersonateButton이 boss만 보이던 것을 admin, teacher에도 표시
- API에서도 admin/teacher 허용, 비-boss는 같은 학원 학생만 접근 가능 (academy_id 검증)
- 원인: 선생님이 "학생 화면 확인하는 창이 안 보입니다"

### 1598021 — 저장 경로에서 validateBeforeSave 제거
- 템플릿 import, 문제 시트 POST/PATCH에서 validateBeforeSave 완전 제거
- sanitizeQuestions(자동 정규화)만 유지
- 원인: PDF/템플릿 원본을 고칠 수 없으므로 검증 차단이 무의미 — import/생성 실패만 유발

### 570373c — retryCorrectAnswers Zod 스키마 완화
- correctAnswer를 z.unknown()으로, userAnswer에 nullable 추가, question을 optional로 변경
- 원인: 학생 안지훈 — 100점인데 결과 저장 실패 (`correctAnswer: Invalid input`)

### 이미지 참조 문항 전수 삭제 (DB 직접 수정)
- PDF 추출 시 이미지가 빠진 "다음 그림을 보고" 문항을 전수 삭제
- 인라인 설명 있는 문항 `(그림: 설명)` 은 유지, 설명 없는 문항만 삭제
- 범위: 템플릿 16개 (32문항), 시트 36개 (61문항) = 총 93문항 삭제
  - to부정사 명사적 용법, 동명사, 명령문, 조동사, 관계부사, 가정법 과거, 과거완료 등
- 번호 재정리 + 배열 정답 변환 포함
- 재채점: stale 시도 7건 처리, 6건 점수 조정 (1~2점 차이), 이미지 오답 2건 제거
- 오답 테이블(naesin_wrong_answers) 재생성

### c7bc63b — sanitizeQuestions에 이미지 참조 문항 자동 삭제 추가
- 저장 시 인라인 설명 없는 이미지 참조 문항을 자동 삭제 + 번호 재정리
- 판별 로직: IMAGE_INSTRUCTION(다음 그림을 보고 등) && !HAS_INLINE_DESC && !CONTENT_USAGE
- 테스트 3건 추가 (50 tests 통과)
- 재발 방지: 새 문제 시트 import/생성 시 이미지 없는 그림 문항이 학생에게 노출되지 않음

## 재발 방지 정리

| 문제 | 일회성 수정 | 시스템적 재발 방지 |
|------|:-:|:-:|
| 네트워크 유실 | - | fetchWithToast retry 내장 |
| 100문항 중간 유실 | - | CHUNK_SIZE=25 자동 저장 |
| 유니코드 오채점 | - | normalize-answer.ts 정규화 |
| 수동태 채점 오류 | 특정 시트 수정 | subParts fallback + 자동 subParts 생성 |
| 타이포그래피 문자 | - | 저장 시 자동 변환 |
| 테이블 깨짐 | - | FormattedText 테이블 파싱 |
| 복합 답안 subParts 누락 | - | sanitizeQuestions 자동 분할 |
| 스테이지 완료 미반영 | - | handleStageComplete 로컬 상태 갱신 |
| 이미지 없는 그림 문항 | 93문항 삭제 + 재채점 | sanitizeQuestions 자동 삭제 |
| 콤마 누락 복수정답 ("45") | 시트 5건 수정 | sanitizeQuestions Rule 6 + 추출 규칙 |
| 선지 뭉침/손상 (ⓐⓑ) | 시트 4 + 템플릿 1 복원 | 추출 규칙 (보기 한 칸에 하나씩) |
| 서술형 정답=완전한 문장 안내 누락 | (일괄수정 무리 — 자동탐지 불가) | 추출 프롬프트 forward 규칙 |

### 검증 규칙 추가
- answer_key 형식 통일 필요: 일부 시트는 string[], 일부는 {answer, explanation}[]
- multi-select 답안 (q.answer가 배열)은 저장 시 answer_key에도 자동 동기화 필요
- 시트 추가 시 해당 유닛의 학생 진도(problem_completed/mock_exam_completed)를 false로 리셋 필요

---

# 콘텐츠 헬스 — MCQ_RANGE / 서술형 형식 일괄 수정 (2026-06-12)

라이브 콘텐츠 전수 스캔(`validateBeforeSave` 로직)으로 학생 대면 오채점 탐지·수정.
스캐너는 **correctness(오탐 0) 검사만** 포함하는 게 원칙 — NO_EXPLANATION(약 1만건)·
NO_FORMAT_HINT 같은 품질 노이즈는 제외해 "🔴=무조건 진짜 버그" 신뢰 유지.

## MCQ_RANGE (정답 번호 > 선지 수) — 10건 수정 + 재발방지

원인 2종:
- **원인 A — 콤마 누락 복수정답 (5건, 전부 시트)**: "2개 고르시오" 정답을 `"45"`처럼
  붙여 저장 → 채점기가 숫자 45로 읽어 범위밖 + `answerHasComma=false`라 학생 UI가
  단일선택으로 렌더되어 두 개를 못 고름. 수정: `"45"`→`"4, 5"` (쉼표가 복수선택 UI 스위치).
- **원인 B — 선지 뭉침/손상 (5건: 시트 4 + 템플릿 1)**: PDF 추출이 ⓐ~ⓔ 5지선다를
  `["ⓐ ⓑ","ⓒ ⓓ","ⓔ"]` 3칸으로 뭉갬. 지문·해설 근거로 선지 5개 복원 + 정답 재매핑.
  - Q5: 지문에 ⓐ~ⓔ 마커 유실 → 마커 재삽입. Q11: T/F 표 유실 → 제자리 재구성
    (삭제는 기존 시도의 위치기반 답안배열과 어긋나 재채점 깨짐 → 제자리 수정이 안전).
  - 템플릿 Q14: 선지에 in/on이 없고 ③④ 중복(in/at) → 해설(in/on) 근거로 복원.

재발 방지 (커밋 53c203e):
- **sanitizeQuestions Rule 6**: 정답이 범위 밖 연속숫자이고 각 자릿수가 모두 유효 선지면
  쉼표 삽입. 통째 숫자가 범위 안이면 미발동("12"=12번 오인 방지), 0 포함 미발동.
- **추출 프롬프트(extract-pdf/images)**: "보기 한 칸에 하나씩(묶음 금지)", "복수정답 쉼표 구분".

blast radius: 영향 학생 2명(시트 d6a024bd 1명·2b897d6d 1명), 나머지 4시트 0명.
정답이 기존엔 무조건 오답이었으므로 재채점 시 점수는 오르거나 그대로. 원본은 스크립트
출력에 백업. **재채점은 boss "재채점" 또는 regrade-all로 트리거 필요(별도 단계).**

## 서술형 "정답=완전한 문장" 형식 안내 — forward 규칙 (커밋 59e1e14)

빈칸/일부만 입력해 오답되는 문제. **자동 검사 불가**(한국어 지시문 변주 완성/배열/합치/
영작/전환/고쳐쓰기…로 키워드 필터 무한 누수, 4라운드 검증). 기존 콘텐츠는 대부분 이미
지시돼 있어 일괄수정 불필요. → 추출 프롬프트(extract-pdf/images/paraphrase)에서 생성
시점에 "정답이 완전한 문장인데 형식 안내 없으면 ※완전한 문장으로 쓰시오 추가" 강제.
사람 규칙은 template-rules.md 규칙 1(2026-04-08)에 이미 존재. **BLANK_FULL_SENTENCE를
validateBeforeSave에 검사로 재추가 금지**(노이즈).

## TEXT_NOT_IN_OPTIONS — DB 직접 수정 (학생 시트 0 달성)

선지(options)는 있는데 정답이 어떤 선지와도 안 맞는 텍스트 → 라디오버튼인데 글자 정답 → 무조건 오답.
**스캔 166건 중 160건은 원형숫자 정답("③")의 가짜 경보** — matchMcqAnswer가 원형숫자를 처리하고
sanitize가 "③"→"3" 변환하므로 학생 무영향. **스캔이 sanitize를 안 거쳐 과보고**한 것(→ 스캐너는
sanitize→validate 순서로 돌려야 함). 진짜는 6종:
- **손상 4 (현재완료진행 Step3)**: answer 필드만 엉뚱한 문장으로 덮였고 `acceptedAnswers`에 정답이
  살아있음 → acceptedAnswers와 맞는 선지 번호로 복구 (Q6→2, Q7→1, Q8→1, Q10→2).
- **word-bank 2 (과거완료 step1/step2, 부사절 Step3)**: 보기를 options에 넣은 서술형 → options 제거
  (서술형 전환, 보기는 문제 텍스트에 유지). C패턴3 선례 동일.

## EMPTY_OPTION / EMPTY_ANSWER — DB 직접 수정

**EMPTY_OPTION은 "빈 보기"만이 아니라 정답까지 틀린 경우가 많음**(명령문/감탄문 Step2). 옵션만 복원하면
오답인 채 답하게 되니 **반드시 다시 풀어 옵션 복원 + 정답 검증**.
- Type A(끝자리 빈 보기 패딩) → trim. Type B(보기 전부 ∅, 문제에 ①~⑤ 인라인) → options를 ①~⑤로 복원.
- 학생 시트 5문항 + 템플릿 14문항 수정. 정답 교정 포함(감탄문 Q5·Q6 4→3, 명령문 Q12 4→2/Q13 2→3 등).
- EMPTY_ANSWER: 의문사의문문 Q15(옵션 분리+정답), 조동사 Step1 Q45(맥락 유실 복원 불가 → **삭제**:
  복사본·학생 시도 0 확인 후 문항+answer_key 제거 + 뒤 번호 당김).

→ **결과: 학생 시트는 MCQ_RANGE·TEXT_NOT_IN_OPTIONS·EMPTY_OPTION·EMPTY_ANSWER 전부 0.**

## 스캐너 원칙 + 품질 노이즈 처리 (NO_FORMAT_HINT / NO_EXPLANATION)

향후 `runContentScan`은 검사를 **correctness(오탐0, 🔴 알림) vs quality(기본 숨김, 🟡)** 두 통으로 분리하고
**sanitize→validate 순서**로 돌릴 것 — "🔴=무조건 진짜 버그" 신뢰 유지가 핵심.
- **NO_FORMAT_HINT (2,484)**: 서술형 형식 안내 가족 → 이미 forward 규칙으로 처리. **추가 작업 없음, 스캐너 제외(quality).**
- **NO_EXPLANATION (10,169)**: 해설 없음 = 채점 0 영향, 버그 아님. **블랭킷 AI 생성 비추**(오정보 주입 위험).
  필요 시 "오답 빈출 문항 한정 + 검증" 소규모 배치만. **스캐너 제외(quality).**

---

# select('*') → 컬럼 명시 전환 (egress 절감)

ESLint `supabase/no-select-wildcard` 규칙 적용 중 (warn).
현재 117건 경고. 테이블별로 컬럼 상수를 만들고 일괄 교체.

## ⚠️ 유령 컬럼 주의 — 이 리팩터의 반복 사고
`select('*')`를 명시 컬럼으로 바꿀 때 **실제 스키마에 없는 컬럼**을 적으면 그 쿼리가
런타임에 통째로 에러난다. 빈 데이터/빈 목록으로 조용히 망가져 학생/관리자에게 노출됨.
- 사고 이력: `naesin_textbooks.cover_image_url`(교과서 전체 안 보임, 6/12) + 19건
  (분석/리포트: problem_attempts.unit_id, grammar_video_progress.created_at/unit_id,
  vocab_quiz_set_results.unit_id, voca_matching_submissions.score,
  student_progress.textbook_id, grammar_chat_questions.is_auto_generated).
- 흔한 함정: 시도/진도 테이블엔 `unit_id`가 없고 `sheet_id`/`lesson_id`/`quiz_set_id`만
  있음 → 조인으로 유도해야 함. 영상진도 시각은 `created_at`이 아니라 `updated_at`.
- **재발 방지**: `npm run check:columns` (scripts/check-select-columns.mjs) — PostgREST
  OpenAPI 스키마와 코드의 모든 `.from().select()`를 대조. `build` 체인에 포함되어
  Vercel 배포 시(실 자격증명) 게이트. CI(placeholder)/네트워크 실패는 graceful skip.
  컬럼 추가/변경 후 반드시 한 번 돌릴 것.

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

# Supabase GRANT 마이그레이션 — 완료 (2026-06-12)

2026-05-30부터 신규 프로젝트는 public 스키마 테이블에 명시적 GRANT 필요.
기존 프로젝트(우리)는 2026-10-30까지 현행 유지.

## 완료
- [x] 1단계: 전체 테이블 목록 + 필요 권한 정리 (71개 테이블)
- [x] 2~3단계: 088_explicit_grants.sql — 전체 테이블 GRANT 일괄 적용
  - anon: 공개 페이지 7개 SELECT + consultations INSERT
  - authenticated: 전체 71개 테이블 CRUD (RLS가 행 단위 보안 담당)
  - service_role: 기본 전체 권한이므로 별도 GRANT 불필요
- [x] 4단계: 프로덕션 배포 완료 (037706c)

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
