/**
 * x-user-profile 캐시 쿠키/헤더의 서명·세션 바인딩
 *
 * 배경: 미들웨어는 매 네비게이션마다 Supabase getUser() 호출을 아끼려고
 * 프로필을 httpOnly 쿠키에 캐싱한다. 이 캐시가 실제 인증 세션과 분리되어
 * 있으면 두 가지 사고가 난다:
 *  1) 다른 계정으로 재로그인해도 이전 계정의 캐시가 살아있어 화면이 섞임
 *  2) 서명이 없으면 클라이언트가 쿠키/헤더를 위조해 임의 역할로 행세 가능
 *
 * 해결: 토큰 = base64url({ p: profile, h: sessionHash }) + '.' + HMAC-SHA256
 *  - sessionHash: 현재 요청의 Supabase 인증 쿠키(sb-*-auth-token*) 해시.
 *    새 로그인 → 인증 쿠키가 바뀜 → 해시 불일치 → 캐시 미스로 재검증.
 *  - HMAC: SUPABASE_SERVICE_ROLE_KEY 파생 키로 서명. 위조 차단.
 *
 * Edge(미들웨어)·Node(서버 컴포넌트/API) 양쪽에서 돌도록 Web Crypto만 사용.
 */

export interface CachedProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  academy_id: string | null;
  is_homepage_manager?: boolean;
  can_manage_content?: boolean;
  naesin_enabled?: boolean;
}

interface TokenPayload {
  p: CachedProfile;
  h: string;
}

const encoder = new TextEncoder();

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (!hmacKeyPromise) {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
    hmacKeyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(`profile-cache:${secret}`),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return hmacKeyPromise;
}

/** 현재 요청의 Supabase 인증 쿠키들을 해시 — 세션이 바뀌면 값이 바뀐다 */
export async function hashAuthCookies(
  cookies: { name: string; value: string }[],
): Promise<string> {
  const authCookies = cookies
    .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => `${c.name}=${c.value}`)
    .join(';');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(authCookies));
  return base64urlEncode(new Uint8Array(digest));
}

/** 프로필 + 세션 해시를 서명된 토큰으로 인코딩 (쿠키·헤더 공용) */
export async function signProfileToken(
  profile: CachedProfile,
  sessionHash: string,
): Promise<string> {
  const payload: TokenPayload = { p: profile, h: sessionHash };
  const body = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${base64urlEncode(new Uint8Array(sig))}`;
}

/**
 * 토큰 검증. 서명이 유효하고 세션 해시가 현재 인증 쿠키와 일치할 때만
 * 프로필을 반환한다. 불일치·손상·구버전 포맷은 전부 null (= 캐시 미스).
 */
export async function verifyProfileToken(
  token: string,
  currentSessionHash: string,
): Promise<CachedProfile | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = base64urlDecode(token.slice(dot + 1));
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify('HMAC', key, sig as BufferSource, encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(body)),
    ) as TokenPayload;
    if (payload.h !== currentSessionHash) return null;
    return payload.p;
  } catch {
    return null;
  }
}
