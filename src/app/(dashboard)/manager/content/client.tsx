'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronDown, ChevronRight, BookOpen, FileText, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ContentClientProps {
  levels: any[];
}

export function ContentClient({ levels }: ContentClientProps) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [addGrammarOpen, setAddGrammarOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const router = useRouter();

  // Grammar form state
  const [grammarTitle, setGrammarTitle] = useState('');
  const [grammarDescription, setGrammarDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  function extractVideoId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match?.[1] || null;
  }

  async function handleAddGrammar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;

    const { error } = await supabase.from('grammars').insert({
      level_id: selectedLevelId,
      title: grammarTitle,
      description: grammarDescription || null,
      youtube_url: youtubeUrl || null,
      youtube_video_id: videoId,
      sort_order: 0,
    });

    if (error) {
      toast.error('추가 실패', { description: error.message });
    } else {
      toast.success('문법 주제가 추가되었습니다');
      setGrammarTitle('');
      setGrammarDescription('');
      setYoutubeUrl('');
      setAddGrammarOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        레벨을 클릭하여 문법 주제를 확인하고 관리하세요.
      </p>

      {levels.map((level) => {
        const isExpanded = expandedLevel === level.id;
        const grammars = level.grammars || [];

        return (
          <Card key={level.id}>
            <CardContent className="py-3">
              <button
                onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Badge variant="outline">Lv.{level.level_number}</Badge>
                  <span className="font-medium">{level.title_ko}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {grammars.length}개 주제
                </span>
              </button>

              {isExpanded && (
                <div className="mt-4 ml-8 space-y-2">
                  {grammars.map((grammar: any) => (
                    <div
                      key={grammar.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div>
                        <span className="text-sm font-medium">{grammar.title}</span>
                        <div className="flex gap-2 mt-1">
                          {grammar.youtube_video_id && (
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />영상
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            암기 {grammar.memory_items?.[0]?.count || 0}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            교과서 {grammar.textbook_passages?.[0]?.count || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Dialog open={addGrammarOpen && selectedLevelId === level.id} onOpenChange={setAddGrammarOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedLevelId(level.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        문법 주제 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>문법 주제 추가</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddGrammar} className="space-y-4">
                        <div className="space-y-2">
                          <Label>제목</Label>
                          <Input
                            value={grammarTitle}
                            onChange={(e) => setGrammarTitle(e.target.value)}
                            placeholder="예: be동사의 현재형"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>설명 (선택)</Label>
                          <Textarea
                            value={grammarDescription}
                            onChange={(e) => setGrammarDescription(e.target.value)}
                            placeholder="문법 주제에 대한 설명"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>YouTube URL (선택)</Label>
                          <Input
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                          {saving ? '저장 중...' : '추가'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
