# 문제 타입 모델 — 설계 문서 (2026-06-13)

> 목적: 문제 콘텐츠의 정확성 뿌리를 고친다. 지금은 `type` 칸이 없어 "options 있으면 객관식"으로
> **추론**하고, `answer`가 번호·텍스트·복수정답("4, 5")을 다 떠맡는 **과부하 문자열**이다.
> 이 모호함이 오채점 버그의 구조적 원인. → **명시 type + 구조화된 정답 + 작성시점 검증**으로 전환.
>
> 북극성: `[PDF추출 · 직접작성 · AI생성] → 타입 모델 → 검수 게이트 → 학생`.
> 입력 3채널은 소스일 뿐, 안전 인프라는 타입 모델 + 게이트 하나. (메모리: content-pipeline-north-star)

## 0. 설계 원칙 (right-size, not 풀 QTI)
- 풀 QTI(회사 간 상호운용·60타입·채점 DSL·XML)는 **우리가 없는 요구**라 오버엔지니어링.
- 가져올 건 **원칙 3개**: ① 명시 type ② 구조화된 정답(cardinality 포함) ③ 작성시점 검증.
- 실데이터(27,559문항) 분류 결과 **구조 타입 5개 + 교육적 tag**로 전부 수렴.

## 1. 실데이터 분포 (2026-06-13 스캔, 27,559문항)
| % | 표면 유형 | → 구조 타입 |
|---|---|---|
| 39.6% | 단일정답 객관식 | single_choice |
| 14.8% | 영작/문장쓰기 | sentence |
| 11.8% | 빈칸채우기(단어) | short_answer |
| 11.5% | 단어배열/보기 | sentence |
| 5.8% | 오류수정 | sentence |
| 4.8% | 인라인마커(ⓐ~ⓔ) | single_choice + flag |
| 3.6% | 단어/짧은답·괄호선택 | short_answer / single_choice |
| 3.6% | 복합답안(subParts) | multi_part |
| 2.5% | 기타 서술형 | sentence |
| 1.9% | 복수정답 | multi_choice |

→ **표면 10 → 구조 5.** 교육적 맛(영작/빈칸/오류수정…)은 별도 타입이 아니라 `tag` 메타데이터.

## 2. 스키마 (목표)

```ts
type QuestionType = 'single_choice' | 'multi_choice' | 'short_answer' | 'sentence' | 'multi_part';

// 모든 문항 공통 base
interface QuestionBase {
  number: number;
  question: string;        // 지시문(+[지문] 태그). 인라인 '(그림: 설명)'도 여기 텍스트로.
  type: QuestionType;      // ★ 명시. 추론 금지.
  tag?: string;            // 교육적 분류(영작/빈칸/오류수정/관계대명사…) — 메타데이터, 채점 무관
  imageUrl?: string;       // 실제 사진만. 기존 upload-image API 재사용. (이미지는 타입과 직교)
  explanation?: string;
}

interface SingleChoice extends QuestionBase {
  type: 'single_choice';
  options: string[];                  // ≥2
  choicesAreMarkers?: boolean;        // 인라인마커형: 보기가 지문 속 ⓐ~ⓔ 밑줄을 가리킴(렌더/작성 힌트, 채점 동일)
  answer: { value: number };          // 1..options.length
}

interface MultiChoice extends QuestionBase {
  type: 'multi_choice';
  options: string[];
  answer: { value: number[] };        // 각 ∈ 1..options.length, 2개 이상. ← "45" 직렬화 버그 구조적 불가
}

interface ShortAnswer extends QuestionBase {
  type: 'short_answer';               // 단어/짧은 구. 빈칸채우기·괄호선택(클릭 아님 텍스트면) 등
  answer: { value: string; accepted?: string[] };   // normalize + accepted 일치
}

interface Sentence extends QuestionBase {
  type: 'sentence';                   // 영작·오류수정·단어배열·문장쓰기
  answer: { value: string; accepted?: string[]; aiGraded?: boolean };  // normalize+accepted, 미달 시 AI
}

interface MultiPart extends QuestionBase {
  type: 'multi_part';                 // 빈칸 여러 개 독립 채점 (기존 subParts)
  parts: { label: string; value: string; accepted?: string[] }[];
}
```

### 경계 결정 (2026-06-13 확정)
1. **괄호선택형** `(who / which)` → **single_choice (클릭)**. 마이그레이션 시 괄호 파싱 → options 추출 + 정답 index화.
2. **인라인마커**(ⓐ~ⓔ) → 별도 타입 X. `single_choice` + `choicesAreMarkers:true` 플래그. 채점은 single_choice 그대로 재사용.
3. **이미지** → 타입 X. base 필드 `imageUrl?`. 인라인 텍스트 '(그림:설명)'은 그냥 question 텍스트(이미지 처리 불필요), 실제 사진만 imageUrl + 기존 upload API.

## 3. 채점 (타입별 dispatch — 추론 제거)
- single_choice: `studentIdx === answer.value`
- multi_choice: `set(student) === set(answer.value)`
- short_answer: `normalize(student) ∈ [value, ...accepted].map(normalize)`
- sentence: 위 + 미달 시 AI 채점(`aiGraded`)
- multi_part: 파트별 독립, 전부 맞아야 정답

## 4. 검증 게이트 (작성/추출/생성 공통, 저장 전)
type ↔ 필드 정합성 검사 — 불일치 시 차단/플래그:
- single_choice/multi_choice: options 존재 + value 범위
- short_answer/sentence: value 비어있지 않음, options 없음(있으면 "보기를 options에 넣은 서술형" 버그)
- multi_part: 각 part value 존재
→ 오늘(06-13) 만든 `scanRow`/`validateBeforeSave`/`validateAnswerKey`가 이 게이트의 씨앗. type 도입 후 "type=객관식인데 보기 없음" 등을 **추론 없이 100% 탐지**.

## 5. 입력 채널 → 타입 매핑 (소스별)
- **PDF 추출**: 프롬프트를 2단계로 — ① 유형 분류(5개 중) ② 그 유형 필드만 채움 → 게이트 검증. (현재 flat 스키마 패치들이 구조적 보장으로 승격)
- **직접 작성**: 에디터에 type 선택 → 유형별 칸 렌더 → 잘못된 구조를 *못 만듦*(word bank를 options에 못 넣음). prevention by design.
- **AI 생성**(ai-generate): 타입 명시해 직접 생성 → 게이트 검증.

## 6. 마이그레이션 (점진, 빅뱅 금지)
기존 27,559문항 + 신규를 안전하게. dual-write/dual-read로 단계 분리:

- **Phase 1 — 타입 백필 (non-breaking)**: 모든 문항에 `type` 추론 채움(스캔 휴리스틱 + 괄호선택 파싱). `options`/`answer`는 그대로. 채점 코드 안 건드림 → 분류 정확도를 실데이터로 검증.
- **Phase 2 — 정답 구조화**: `answer` 문자열 → `{value}` 구조로 마이그레이션. 채점기는 **구조 우선, flat 폴백**(이중 읽기). single("3"→{value:3}), multi("4, 5"→{value:[4,5]}), multi_part(subParts→parts).
- **Phase 3 — 신규 엄격**: 추출/작성/생성이 타입 아이템만 생산. 게이트가 type↔필드 강제.
- **Phase 4 — 정리**: 채점기 type dispatch 전환, 작성 에디터 유형별 칸, flat 폴백·추론 코드 제거.

## 7. 무엇을 안 하나
- 풀 QTI / XML / 채점 DSL / 60타입 / 시험 조립 엔진 — 전부 제외(불필요).
- 한 번에 전체 마이그레이션 — 금지(Phase 분리).
- 이미지를 타입으로 — 안 함(base 필드).

## 8. 실행 체크리스트 (잘게 쪼갬)
각 번호 = 독립 배포 단위. 🟢안전(non-breaking) / 🟡채점건드림 / 🔴학생대면.

### Phase 1 — 타입 백필 (전부 non-breaking, type 추가만)
1. 🟢 타입 정의 + `classifyQuestionType()` 코드화 + 테스트 (아무도 안 씀) → 배포
2. 🟢 백필 DRY-RUN — 2.5만 문항 분류 리포트(쓰기 X), 분포·이상치 검토
3. 🟢 백필 적용 — questions JSONB 각 문항에 `type` 추가(괄호선택 파싱 포함), 백업. options/answer 불변 → 배포
4. 🟢 불확실 케이스 리뷰 — 분류 헷갈림 + type↔현재필드 불일치 목록 수동 확인

### Phase 2 — 정답 구조화 (🟡 신중, 이중읽기)
5. 🟢 `parseAnswer(type, raw)` 헬퍼 + 테스트 (안 씀) → 배포
6. 🟡 채점기 이중 읽기(구조 우선, flat 폴백) + "구조vsflat 동일점수" 테스트 → 배포
7. 🟡 구조화 정답 백필 — DRY-RUN(차이 0 확인) → 적용
8. 🟡 회귀 검증 — 샘플 재채점, 점수 변동 0

### Phase 3 — 신규 엄격 + prevention by design (🔴)
9. 🟡 sanitize가 저장 시 type+구조화 정답 생성 (born-typed)
10. 🟡 게이트가 type↔필드 검증 (scanRow 확장)
11. 🔴 추출 프롬프트 2단계화(분류→채움) + 게이트
12. 🔴 작성 에디터 타입 피커 + 유형별 칸 (prevention by design, 최대 효과)

### Phase 4 — 정리 (🟡)
13. 🟡 채점기 type dispatch 전환 (`isSubjective=!options` 추론 제거)
14. 🟢 flat 폴백·죽은 추론 코드 제거

> 진행: 1~4 지금 당장 안전. 5~8이 answer 과부하 해결. 9~12가 "다신 안 생김"(특히 12). 한 번에 하나씩.
