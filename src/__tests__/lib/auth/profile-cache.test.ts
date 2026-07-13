import { describe, it, expect, beforeAll } from 'vitest';
import {
  hashAuthCookies,
  signProfileToken,
  verifyProfileToken,
  type CachedProfile,
} from '@/lib/auth/profile-cache';

const profile: CachedProfile = {
  id: 'user-1',
  email: 'lui@love.com',
  full_name: '이루이',
  role: 'student',
  academy_id: null,
};

const cookiesA = [
  { name: 'sb-abc-auth-token.0', value: 'token-account-1-part0' },
  { name: 'sb-abc-auth-token.1', value: 'token-account-1-part1' },
];
const cookiesB = [{ name: 'sb-abc-auth-token.0', value: 'token-account-2' }];

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
});

describe('profile-cache', () => {
  it('서명·해시가 일치하면 프로필을 반환한다', async () => {
    const hash = await hashAuthCookies(cookiesA);
    const token = await signProfileToken(profile, hash);
    expect(await verifyProfileToken(token, hash)).toEqual(profile);
  });

  it('인증 쿠키가 바뀌면(다른 계정 로그인) 검증에 실패한다', async () => {
    const hashA = await hashAuthCookies(cookiesA);
    const hashB = await hashAuthCookies(cookiesB);
    const token = await signProfileToken(profile, hashA);
    expect(hashA).not.toBe(hashB);
    expect(await verifyProfileToken(token, hashB)).toBeNull();
  });

  it('페이로드를 변조하면 서명 검증에 실패한다', async () => {
    const hash = await hashAuthCookies(cookiesA);
    const token = await signProfileToken(profile, hash);
    const [body, sig] = token.split('.');
    const forged = JSON.parse(
      Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    );
    forged.p.role = 'boss';
    const forgedBody = Buffer.from(JSON.stringify(forged))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await verifyProfileToken(`${forgedBody}.${sig}`, hash)).toBeNull();
  });

  it('구버전 포맷(raw JSON)·손상된 토큰은 null (캐시 미스)', async () => {
    const hash = await hashAuthCookies(cookiesA);
    expect(await verifyProfileToken(JSON.stringify(profile), hash)).toBeNull();
    expect(await verifyProfileToken('garbage', hash)).toBeNull();
    expect(await verifyProfileToken('', hash)).toBeNull();
  });

  it('해시는 sb-* 인증 쿠키만 반영하고 순서에 무관하다', async () => {
    const withNoise = [
      { name: 'x-user-profile', value: 'ignored' },
      { name: 'other', value: 'ignored' },
      ...cookiesA,
    ];
    expect(await hashAuthCookies(withNoise)).toBe(
      await hashAuthCookies([...cookiesA].reverse()),
    );
  });
});
