import { describe, it, expect } from 'vitest';
import { isNaesinManagementBlocked } from '@/lib/api/require-naesin-enabled';
import { getNavGroups } from '@/components/layout/sidebar-nav-config';
import type { AuthUser } from '@/types/auth';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u1',
    email: 'test@test.com',
    full_name: 'Test',
    role: 'teacher',
    academy_id: 'a1',
    naesin_enabled: false,
    ...overrides,
  };
}

describe('isNaesinManagementBlocked — 내신 관리 API 올라영 전용 잠금', () => {
  it('naesin_enabled 없는 teacher는 /api/naesin/* 차단', () => {
    expect(isNaesinManagementBlocked('/api/naesin/problems', makeUser())).toBe(true);
  });

  it('naesin_enabled 없는 admin도 차단', () => {
    expect(isNaesinManagementBlocked('/api/naesin/textbooks', makeUser({ role: 'admin' }))).toBe(true);
  });

  it('naesin_enabled 학원 teacher는 통과', () => {
    expect(isNaesinManagementBlocked('/api/naesin/problems', makeUser({ naesin_enabled: true }))).toBe(false);
  });

  it('boss는 항상 통과', () => {
    expect(isNaesinManagementBlocked('/api/naesin/problems', makeUser({ role: 'boss' }))).toBe(false);
  });

  it('student는 통과 (무료 tier 내신 체험 유지)', () => {
    expect(isNaesinManagementBlocked('/api/naesin/omr/submit', makeUser({ role: 'student' }))).toBe(false);
  });

  it('내신 외 경로는 영향 없음', () => {
    expect(isNaesinManagementBlocked('/api/voca/books', makeUser())).toBe(false);
    expect(isNaesinManagementBlocked('/api/students', makeUser())).toBe(false);
  });
});

describe('getNavGroups — 내신 관리 메뉴 노출', () => {
  const allHrefs = (groups: ReturnType<typeof getNavGroups>) =>
    groups.flatMap((g) => g.items.map((i) => i.href));

  it('naesin_enabled 없는 teacher는 내신 관리 메뉴 숨김', () => {
    const hrefs = allHrefs(getNavGroups('teacher', undefined, false, true, false));
    expect(hrefs).not.toContain('/teacher/naesin');
    expect(hrefs).not.toContain('/teacher/naesin?tab=templates');
  });

  it('naesin_enabled 없는 admin은 내신 관리 메뉴 숨김', () => {
    const hrefs = allHrefs(getNavGroups('admin', undefined, false, false, false));
    expect(hrefs).not.toContain('/admin/naesin');
  });

  it('naesin_enabled 학원 teacher는 내신 관리 메뉴 표시', () => {
    const hrefs = allHrefs(getNavGroups('teacher', undefined, false, true, true));
    expect(hrefs).toContain('/teacher/naesin');
  });

  it('boss는 플래그와 무관하게 내신 관리 메뉴 표시', () => {
    const hrefs = allHrefs(getNavGroups('boss', undefined, false, false, false));
    expect(hrefs).toContain('/boss/naesin');
  });

  it('다른 메뉴(보카 등)는 영향 없음', () => {
    const hrefs = allHrefs(getNavGroups('admin', undefined, false, false, false));
    expect(hrefs).toContain('/admin/voca/submissions');
  });
});
