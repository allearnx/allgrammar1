/**
 * 어휘 레벨 진단 — 문항 봉인 토큰 (서버 전용).
 *
 * 문제: 문항 API가 정답 vocabId를 함께 내려주면 클라이언트에서 정답을 읽을 수 있고,
 * submit이 클라이언트가 주장하는 정오를 신뢰하게 된다 (콘솔 한 줄로 만점 가능).
 *
 * 해법: 문항마다 정답 정보(정답 보기 인덱스·단어·밴드)를 HMAC 서명 토큰에 봉인해 내려주고,
 * 클라이언트는 [토큰, 고른 보기 인덱스]만 되돌려준다. 서버만 토큰을 열어 채점하므로
 * 정답은 클라이언트에 노출되지 않고, 위조 rounds는 서명 검증에서 걸린다.
 * 상태 저장이 없어(stateless) 익명 /level-test 플로우에도 그대로 쓸 수 있다.
 */
import type { BandKey } from './diagnostic-bands';

export interface DiagnosticTokenPayload {
  /** 정답 단어 id */
  v: string;
  /** front_text (영어) — 타이핑 정답 비교 대상 */
  f: string;
  /** back_text (뜻) */
  b: string;
  /** 정답 보기 인덱스 — 5지선다 문항만. 타이핑 문항 토큰엔 없음 */
  c?: number;
  /** 출제 밴드 — 클라이언트가 밴드를 속이지 못하게 토큰에 봉인 */
  band: BandKey;
  /** 만료 (epoch ms) — 비로그인 완주 후 가입까지의 여유를 고려해 24시간 */
  exp: number;
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
    keyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(`voca-diagnostic:${secret}`),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return keyPromise;
}

function b64urlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function b64urlDecode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64url'));
}

export async function signDiagnosticToken(
  payload: Omit<DiagnosticTokenPayload, 'exp'>,
): Promise<string> {
  const full: DiagnosticTokenPayload = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64urlEncode(encoder.encode(JSON.stringify(full)));
  const sig = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** 서명·만료 검증 후 payload 반환. 실패 시 null. */
export async function verifyDiagnosticToken(token: string): Promise<DiagnosticTokenPayload | null> {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      b64urlDecode(sig) as BufferSource,
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(Buffer.from(b64urlDecode(body)).toString('utf8')) as DiagnosticTokenPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.v !== 'string' || typeof payload.f !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

export interface TokenAnswer {
  token: string;
  /** 타이핑 문항의 답 — null = "모르겠어요" */
  typed?: string | null;
  /** 5지선다 문항의 고른 보기 인덱스 — null = "모르겠어요" */
  chosenIndex?: number | null;
}

/** 타이핑 답 정규화 — 대소문자·연속 공백·끝 문장부호 무시 (trim을 먼저 해야 끝 부호가 잡힌다) */
export function normalizeTypedAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.?!]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface VerifiedItem {
  vocabId: string;
  front_text: string;
  back_text: string;
  /** 문항 형식 — 타이핑(리콜) 성적은 승급 게이트에 별도로 쓰인다 */
  format: 'typing' | 'choice';
  result: 'correct' | 'wrong' | 'unknown';
}

export interface VerifiedRound {
  band: BandKey;
  items: VerifiedItem[];
}

/**
 * 토큰 라운드 전체를 검증·채점한다. 하나라도 서명이 깨지면 null (위조 시도).
 * 라운드의 밴드는 토큰 payload에서 도출 — 한 라운드 안에 밴드가 섞여 있으면 위조로 본다.
 */
export async function verifyRounds(rounds: TokenAnswer[][]): Promise<VerifiedRound[] | null> {
  const out: VerifiedRound[] = [];
  const seenVocab = new Set<string>();
  for (const round of rounds) {
    const items: VerifiedItem[] = [];
    let band: BandKey | null = null;
    for (const { token, typed, chosenIndex } of round) {
      const p = await verifyDiagnosticToken(token);
      if (!p) return null;
      if (band === null) band = p.band;
      else if (band !== p.band) return null;
      // 같은 토큰 재사용(문항 복제)으로 라운드를 부풀리는 것 방지
      if (seenVocab.has(p.v)) return null;
      seenVocab.add(p.v);
      const format: VerifiedItem['format'] = typed !== undefined ? 'typing' : 'choice';
      let result: VerifiedItem['result'];
      if (typed !== undefined) {
        // 타이핑 문항
        result =
          typed === null || !typed.trim()
            ? 'unknown'
            : normalizeTypedAnswer(typed) === normalizeTypedAnswer(p.f)
              ? 'correct'
              : 'wrong';
      } else {
        // 선다형 문항 (구 4지선다 토큰도 같은 경로로 채점된다)
        result =
          chosenIndex === null || chosenIndex === undefined
            ? 'unknown'
            : typeof p.c === 'number' && chosenIndex === p.c
              ? 'correct'
              : 'wrong';
      }
      items.push({ vocabId: p.v, front_text: p.f, back_text: p.b, format, result });
    }
    if (!band || items.length === 0) return null;
    out.push({ band, items });
  }
  return out;
}
