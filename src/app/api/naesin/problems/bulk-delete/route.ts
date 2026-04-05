import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { z } from 'zod';
import { ID } from '@/lib/api/schemas/_shared';

const bulkDeleteSchema = z.object({
  ids: z.array(ID).min(1).max(100),
});

export const POST = createApiHandler(
  { roles: ['boss'], schema: bulkDeleteSchema },
  async ({ body, supabase }) => {
    const { ids } = body;

    dbResult(await supabase
      .from('naesin_problem_sheets')
      .delete()
      .in('id', ids));

    return NextResponse.json({ deleted: ids.length });
  }
);
