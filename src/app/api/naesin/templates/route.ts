import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase }) => {
    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('id, title, questions, template_topic, category, unit_id, created_at')
      .eq('is_template', true)
      .order('template_topic')
      .order('created_at', { ascending: false }));

    // topic별 그룹핑
    const grouped: Record<string, typeof data> = {};
    for (const sheet of data ?? []) {
      const topic = sheet.template_topic || '기타';
      if (!grouped[topic]) grouped[topic] = [];
      grouped[topic].push(sheet);
    }

    return NextResponse.json({ templates: data, grouped });
  }
);
