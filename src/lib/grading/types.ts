/**
 * 채점 엔진 공용 타입 — 순수 코어.
 *
 * 이 폴더(src/lib/grading/)는 학원 구조·Supabase·UI를 모른다.
 * 글로벌 제품(IELTS Writing 등)으로 그대로 들고 나갈 수 있어야 하므로,
 * DB·인증·화면 의존을 여기에 추가하지 말 것. LLM 호출도 주입(LlmCall)으로만 받는다.
 */

/** 채점 대상 한 건 */
export interface GradingItem {
  /** 배치 내에서 결과를 되찾기 위한 식별자 (문항 번호 등 자유 형식) */
  id: string;
  /** 문제 지시문 — 조건(※ 형식 안내 등)이 포함되므로 채점 근거로 전달 */
  prompt: string;
  /** 모범 답안 */
  referenceAnswer: string;
  /** 학생 답안 */
  studentAnswer: string;
  /** 추가 인정 답안 */
  acceptedAnswers?: string[] | null;
}

/** 채점 결과 — score는 100(정답) / 50(부분 정답) / 0(오답)만 사용 */
export interface GradingResult {
  id: string;
  score: 0 | 50 | 100;
  /** 학생에게 보여줄 짧은 피드백 (한국어) */
  feedback?: string;
  /** 교정된 모범 답안 (학생 답을 고쳐 쓴 형태) */
  correctedAnswer?: string;
  /** exact: 문자열 일치 빠른 경로 / ai: LLM 채점 / fallback: AI 실패 시 오답 처리 */
  method: 'exact' | 'ai' | 'fallback';
}

/**
 * 루브릭 어댑터 — 채점 기준을 갈아끼우는 지점.
 * 내신(정답키 비교)과 IELTS(밴드 평가)는 이 인터페이스 구현체만 다르다.
 */
export interface RubricAdapter {
  /** 어댑터 식별자 (로그용) */
  id: string;
  /** AI 없이 즉시 판정 가능하면 결과를, 아니면 null (문자열 일치 등) */
  fastPath(item: GradingItem): GradingResult | null;
  /** AI 폴백 대상들을 하나의 배치 프롬프트로 */
  buildPrompt(items: GradingItem[]): string;
  /** LLM 응답 텍스트 → 결과 배열. 매칭 실패 항목은 누락 가능 (엔진이 fallback 처리) */
  parseResponse(text: string, items: GradingItem[]): GradingResult[];
}

/** LLM 호출 — 서버 구현체를 주입받는다 (코어는 SDK를 모름) */
export type LlmCall = (prompt: string, opts?: { maxTokens?: number }) => Promise<string>;
