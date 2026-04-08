import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const regradeSchema = z.object({
  sheetId: z.string().uuid(),
});

export const POST = createApiHandler(
  { schema: regradeSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);
    const result = await regradeSheet(body.sheetId);
    return NextResponse.json(result);
  }
);
