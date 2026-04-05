import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';

interface UnitRow { id: string; title: string; unit_number: number; textbook_id: string }
interface TbRow { id: string; display_name: string }

export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ supabase, request }) => {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    if (!templateId) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 });
    }

    // Fetch template info from naesin_templates
    const template = dbResult(await supabase
      .from('naesin_templates')
      .select('id, title')
      .eq('id', templateId)
      .single());

    const templateTitle = (template as { title: string }).title;

    // 1. source_template_id로 추적된 복사본
    const tracked = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('id, title, unit_id, created_at')
      .eq('source_template_id', templateId)) ?? [];

    // 2. 제목 매칭 fallback (기존 복사본)
    const titleMatched = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('id, title, unit_id, created_at')
      .ilike('title', templateTitle)
      .neq('id', templateId)
      .eq('is_template', false)) ?? [];

    // Merge & deduplicate
    const trackedIds = new Set(tracked.map((r) => r.id));
    const merged = [
      ...tracked,
      ...titleMatched.filter((r) => !trackedIds.has(r.id)),
    ];

    if (merged.length === 0) {
      return NextResponse.json({ copies: [], grouped: {} });
    }

    // Fetch unit + textbook info for grouping
    const unitIds = [...new Set(merged.map((r) => r.unit_id))];
    const units = (dbResult(await supabase
      .from('naesin_units')
      .select('id, title, unit_number, textbook_id')
      .in('id', unitIds)) ?? []) as UnitRow[];

    const textbookIds = [...new Set(units.map((u) => u.textbook_id))];
    const textbooks = (dbResult(await supabase
      .from('naesin_textbooks')
      .select('id, display_name')
      .in('id', textbookIds)) ?? []) as TbRow[];

    const unitMap: Record<string, UnitRow> = {};
    for (const u of units) unitMap[u.id] = u;
    const tbMap: Record<string, TbRow> = {};
    for (const t of textbooks) tbMap[t.id] = t;

    // Enrich copies with unit/textbook info
    const copies = merged.map((c) => {
      const unit = unitMap[c.unit_id];
      const tb = unit ? tbMap[unit.textbook_id] : null;
      return {
        ...c,
        unit_title: unit?.title ?? '',
        unit_number: unit?.unit_number ?? 0,
        textbook_id: unit?.textbook_id ?? '',
        textbook_name: tb?.display_name ?? '',
      };
    });

    // Group by textbook
    const grouped: Record<string, typeof copies> = {};
    for (const copy of copies) {
      const key = copy.textbook_name || '기타';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(copy);
    }

    return NextResponse.json({ copies, grouped });
  }
);
