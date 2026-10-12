/**
 * 진단 진행의 순수 로직 — 훅(use-diagnostic-flow)에서 떼어 단위 테스트가 가능한 부분.
 * - 비로그인(/level-test) 완주분을 localStorage에 담아 가입 후 자동 제출하는 보관함
 * - 라운드 전환 안내 문구, 연락처 게이트 전송 본문
 */
import { BAND_KEYS, type BandKey, type DiagnosticGrade } from '@/lib/voca/diagnostic-bands';
import type { AnsweredItem, CompletedRound } from './types';

/** 비로그인 진단 완료분 — 가입 후 자동 제출용 (24시간 유효). v2 = 봉인 토큰 형식 */
export const PENDING_KEY = 'allkill:pending-diagnostic:v2';
export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export interface PendingDiagnostic {
  grade: DiagnosticGrade;
  rounds: CompletedRound[];
  at: number;
  /** 완주 시점의 익명 서버 기록 id — 연락처/계정 연결용 */
  leadId?: string;
}

/** 완주분 보관. localStorage 불가 환경에서도 throw 하지 않는다 (게이트는 그대로 진행) */
export function savePendingDiagnostic(grade: DiagnosticGrade, rounds: CompletedRound[], now = Date.now()): void {
  try {
    const pending: PendingDiagnostic = { grade, rounds, at: now };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch { /* ignore */ }
}

/** 익명 완주 기록 id를 보관분에 덧붙인다 — 가입 후 제출 시 리드와 계정을 잇는 앵커 */
export function attachPendingLeadId(leadId: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const pending = JSON.parse(raw) as PendingDiagnostic;
    pending.leadId = leadId;
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch { /* ignore */ }
}

/**
 * 보관분을 꺼내고 지운다. 유효하지 않으면(없음·손상·24시간 경과·라운드 없음) null.
 * tookToday면 서버가 하루 1회 제한(409)만 돌려주므로 버린다.
 */
export function takePendingDiagnostic(opts: { tookToday: boolean; now?: number }): PendingDiagnostic | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    const pending = JSON.parse(raw) as PendingDiagnostic;
    if (!pending?.rounds?.length || !pending.grade) return null;
    if ((opts.now ?? Date.now()) - (pending.at ?? 0) > PENDING_TTL_MS) return null;
    if (opts.tookToday) return null;
    return pending;
  } catch {
    return null; // 손상된 payload는 무시
  }
}

/** 라운드 전환 안내 — 서버가 정한 다음 밴드가 이전보다 위/아래/같음에 따라 */
export function roundTransitionMessage(prevBand: BandKey, nextBand: BandKey): string {
  const dir = BAND_KEYS.indexOf(nextBand) - BAND_KEYS.indexOf(prevBand);
  if (dir === 0) return '정확한 측정을 위해 같은 레벨을 한 번 더 볼게요';
  return dir > 0 ? '잘하는데요? 조금 더 어려운 단어로 볼게요' : '이번엔 조금 쉬운 단어로 볼게요';
}

/** 연락처 게이트 전송 본문 — 익명 기록(leadId)이 있으면 연결만, 없으면 라운드를 다시 보내는 폴백 */
export function buildGateBody(
  args: { leadId: string | null; grade: DiagnosticGrade; rounds: CompletedRound[]; name: string; phone: string },
): { leadId: string; name: string; phone: string } | { name: string; phone: string; grade: DiagnosticGrade; rounds: AnsweredItem[][] } {
  const { leadId, grade, rounds, name, phone } = args;
  return leadId ? { leadId, name, phone } : { name, phone, grade, rounds: rounds.map((r) => r.items) };
}
