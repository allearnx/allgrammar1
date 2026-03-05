'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface TextbookPassageWithGrammar {
  id: string;
  title: string;
  original_text: string;
  is_textbook_mode_active: boolean;
  grammar: { title: string; level?: { level_number: number } | null } | null;
}

interface TextbookModeClientProps {
  passages: TextbookPassageWithGrammar[];
}

export function TextbookModeClient({ passages }: TextbookModeClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggle(passageId: string, currentActive: boolean) {
    setUpdating(passageId);
    const supabase = createClient();

    const { error } = await supabase
      .from('textbook_passages')
      .update({ is_textbook_mode_active: !currentActive })
      .eq('id', passageId);

    if (error) {
      toast.error('변경 실패', { description: error.message });
    } else {
      toast.success(!currentActive ? '교과서 모드 활성화' : '교과서 모드 비활성화');
      router.refresh();
    }
    setUpdating(null);
  }

  if (passages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 교과서 지문이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        교과서 모드를 켜면 학생들이 해당 지문을 학습할 수 있습니다.
      </p>
      {passages.map((passage) => (
        <Card key={passage.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{passage.title}</span>
                  <Badge
                    variant={passage.is_textbook_mode_active ? 'default' : 'secondary'}
                  >
                    {passage.is_textbook_mode_active ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                {passage.grammar && (
                  <p className="text-sm text-muted-foreground">
                    Lv.{passage.grammar.level?.level_number} - {passage.grammar.title}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {passage.original_text?.substring(0, 100)}...
                </p>
              </div>
              <Button
                variant={passage.is_textbook_mode_active ? 'destructive' : 'default'}
                size="sm"
                onClick={() => handleToggle(passage.id, passage.is_textbook_mode_active)}
                disabled={updating === passage.id}
              >
                {updating === passage.id
                  ? '변경 중...'
                  : passage.is_textbook_mode_active
                    ? '비활성화'
                    : '활성화'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
