import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaPetFeedSchema } from '@/lib/api/schemas/voca';
import {
  computeXpEarned,
  computeStageFromXp,
  buildPetState,
} from '@/lib/voca/pet-constants';

// GET: 펫 상태 조회 (없으면 자동 생성)
export const GET = createApiHandler(
  { hasBody: false },
  async ({ user, supabase }) => {
    // 조회
    const { data: existing } = await supabase
      .from('student_pets')
      .select('stage, xp, last_fed_at')
      .eq('student_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ pet: buildPetState(existing) });
    }

    // 자동 생성
    const { data: created, error } = await supabase
      .from('student_pets')
      .insert({ student_id: user.id })
      .select('stage, xp, last_fed_at')
      .single();

    if (error) {
      // race condition: 동시 요청으로 이미 생성됨
      const { data: retry } = await supabase
        .from('student_pets')
        .select('stage, xp, last_fed_at')
        .eq('student_id', user.id)
        .single();
      if (retry) return NextResponse.json({ pet: buildPetState(retry) });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ pet: buildPetState(created) });
  },
);

// POST: Day 완료 시 XP 지급
export const POST = createApiHandler(
  { schema: vocaPetFeedSchema },
  async ({ user, body, supabase }) => {
    const { dayId, scores, streak } = body;

    // 1. 현재 펫 조회 (없으면 생성)
    let { data: pet } = await supabase
      .from('student_pets')
      .select('id, stage, xp, last_fed_at, last_fed_day_id')
      .eq('student_id', user.id)
      .single();

    if (!pet) {
      const { data: created, error } = await supabase
        .from('student_pets')
        .insert({ student_id: user.id })
        .select('id, stage, xp, last_fed_at, last_fed_day_id')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      pet = created;
    }

    // 2. 같은 Day 중복 방지
    if (pet.last_fed_day_id === dayId) {
      return NextResponse.json({
        pet: buildPetState(pet),
        xpEarned: 0,
        evolved: false,
      });
    }

    // 3. XP 계산
    const xpEarned = computeXpEarned(scores, streak);
    const newXp = pet.xp + xpEarned;
    const oldStage = pet.stage;
    const newStage = computeStageFromXp(newXp);
    const evolved = newStage > oldStage;

    // 4. DB 업데이트
    const { data: updated, error } = await supabase
      .from('student_pets')
      .update({
        xp: newXp,
        stage: newStage,
        last_fed_at: new Date().toISOString(),
        last_fed_day_id: dayId,
      })
      .eq('id', pet.id)
      .select('stage, xp, last_fed_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      pet: buildPetState(updated),
      xpEarned,
      evolved,
    });
  },
);
