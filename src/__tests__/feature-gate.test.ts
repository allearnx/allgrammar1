import { describe, it, expect } from 'vitest';
import {
  canUseFeature,
  deriveTier,
  getAllowedNaesinStages,
  mergeEnabledStages,
} from '@/lib/billing/feature-gate';
import type { Feature, Tier } from '@/lib/billing/feature-gate';

describe('deriveTier', () => {
  it('null subscription → free', () => {
    expect(deriveTier(null)).toBe('free');
  });

  it('tier=free subscription → free', () => {
    expect(deriveTier({ status: 'trialing', tier: 'free' })).toBe('free');
    expect(deriveTier({ status: 'active', tier: 'free' })).toBe('free');
  });

  it('tier=paid + status=trialing → trialing', () => {
    expect(deriveTier({ status: 'trialing', tier: 'paid' })).toBe('trialing');
  });

  it('tier=paid + status=active → paid', () => {
    expect(deriveTier({ status: 'active', tier: 'paid' })).toBe('paid');
  });

  it('tier=paid + status=past_due → paid', () => {
    expect(deriveTier({ status: 'past_due', tier: 'paid' })).toBe('paid');
  });
});

describe('canUseFeature', () => {
  const ALL_FEATURES: Feature[] = [
    'naesin:grammar', 'naesin:problem', 'voca:round2',
    'analytics:charts', 'analytics:rankings',
    'bulk:import', 'bulk:assign', 'bulk:export', 'reports',
  ];

  it('paid tier → all features allowed', () => {
    for (const f of ALL_FEATURES) {
      expect(canUseFeature('paid', f)).toBe(true);
    }
  });

  it('trialing tier → all features allowed (same as paid)', () => {
    for (const f of ALL_FEATURES) {
      expect(canUseFeature('trialing', f)).toBe(true);
    }
  });

  it('free tier → all premium features blocked', () => {
    for (const f of ALL_FEATURES) {
      expect(canUseFeature('free', f)).toBe(false);
    }
  });
});

describe('getAllowedNaesinStages', () => {
  it('paid → all 5 stages', () => {
    expect(getAllowedNaesinStages('paid')).toEqual([
      'vocab', 'passage', 'grammar', 'problem', 'lastReview',
    ]);
  });

  it('trialing → all 5 stages', () => {
    expect(getAllowedNaesinStages('trialing')).toEqual([
      'vocab', 'passage', 'grammar', 'problem', 'lastReview',
    ]);
  });

  it('free → only vocab + passage', () => {
    expect(getAllowedNaesinStages('free')).toEqual(['vocab', 'passage']);
  });
});

describe('mergeEnabledStages', () => {
  it('free + no teacher stages → plan stages only', () => {
    expect(mergeEnabledStages('free', null)).toEqual(['vocab', 'passage']);
    expect(mergeEnabledStages('free', undefined)).toEqual(['vocab', 'passage']);
  });

  it('paid + no teacher stages → all stages', () => {
    expect(mergeEnabledStages('paid', null)).toEqual([
      'vocab', 'passage', 'grammar', 'problem', 'lastReview',
    ]);
  });

  it('free + teacher enables all → intersection with plan (vocab+passage only)', () => {
    const teacherAll = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'];
    expect(mergeEnabledStages('free', teacherAll)).toEqual(['vocab', 'passage']);
  });

  it('paid + teacher restricts to vocab only → vocab only', () => {
    expect(mergeEnabledStages('paid', ['vocab'])).toEqual(['vocab']);
  });

  it('free + teacher enables vocab only → vocab only', () => {
    expect(mergeEnabledStages('free', ['vocab'])).toEqual(['vocab']);
  });

  it('paid + teacher enables grammar+problem → grammar+problem', () => {
    expect(mergeEnabledStages('paid', ['grammar', 'problem'])).toEqual([
      'grammar', 'problem',
    ]);
  });

  it('free + teacher enables grammar+problem → empty (plan blocks both)', () => {
    expect(mergeEnabledStages('free', ['grammar', 'problem'])).toEqual([]);
  });

  it('empty teacher array → empty result', () => {
    expect(mergeEnabledStages('paid', [])).toEqual([]);
  });
});
