'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronDown, ChevronRight, BookOpen, FileText, Video, Target, UserPlus, Pencil, Trash2, Loader2, PlayCircle } from 'lucide-react';
import { extractVideoId } from '@/lib/utils/youtube';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { AssignClinicDialog } from '@/components/dashboard/naesin-admin/content-dialogs/template/assign-clinic-dialog';
import { EditTemplateDialog } from '@/components/dashboard/naesin-admin/content-dialogs/template/edit-template-dialog';
import { AddTemplateFromPdfDialog } from '@/components/dashboard/naesin-admin/content-dialogs/template/add-template-from-pdf-dialog';
import type { KokkokSet } from '@/lib/dashboard/queries';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const KOKKOK_TOPIC = '내신 콕콕';

interface ContentGrammar {
  id: string;
  title: string;
  youtube_video_id: string | null;
  memory_items: { count: number }[];
  textbook_passages: { count: number }[];
}

interface ContentLevel {
  id: string;
  level_number: number;
  title_ko: string;
  grammars: ContentGrammar[];
}

interface ContentClientProps {
  levels: ContentLevel[];
  /** 내신 콕콕 세트 (문법 주제별) — 특정 유형을 틀리는 학생에게 배정하는 맞춤 세트 */
  kokkokSets?: KokkokSet[];
}

export function ContentClient({ levels, kokkokSets = [] }: ContentClientProps) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [addGrammarOpen, setAddGrammarOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const router = useRouter();

  // 내신 콕콕 상태
  const [assigning, setAssigning] = useState<KokkokSet | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; template_topic: string; questions: NaesinProblemQuestion[] } | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null); // grammar_id
  const [deleting, setDeleting] = useState<string | null>(null);
  const [videoFor, setVideoFor] = useState<KokkokSet | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  async function handleSaveVideo() {
    if (!videoFor) return;
    const url = videoUrl.trim();
    if (url && !extractVideoId(url)) { toast.error('유튜브 링크가 아닙니다'); return; }
    setSavingVideo(true);
    try {
      await fetchWithToast('/api/naesin/templates', { method: 'PATCH', body: { id: videoFor.id, videoUrl: url }, logContext: 'content.kokkok_video' });
      toast.success(url ? '영상을 연결했습니다. 이미 배정된 학생에게도 바로 보입니다.' : '영상 연결을 해제했습니다.');
      setVideoFor(null);
      router.refresh();
    } catch { /* toast handled */ } finally { setSavingVideo(false); }
  }

  async function openEdit(set: KokkokSet) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('naesin_templates').select('id, title, template_topic, questions').eq('id', set.id).single();
      if (error || !data) { toast.error('세트를 불러오지 못했습니다'); return; }
      setEditing(data as { id: string; title: string; template_topic: string; questions: NaesinProblemQuestion[] });
    } catch { toast.error('세트를 불러오지 못했습니다'); }
  }

  async function handleDeleteSet(set: KokkokSet) {
    const n = set.assignments.length;
    if (!window.confirm(`"${set.title}" 세트를 삭제할까요?${n ? `\n\n배정된 학생 ${n}명의 사본과 풀이 기록도 함께 삭제됩니다.` : ''}`)) return;
    setDeleting(set.id);
    try {
      await fetchWithToast(`/api/naesin/templates?id=${set.id}`, { method: 'DELETE', logContext: 'content.kokkok_delete' });
      toast.success('삭제했습니다');
      router.refresh();
    } catch { /* toast handled */ } finally { setDeleting(null); }
  }

  // Grammar form state
  const [grammarTitle, setGrammarTitle] = useState('');
  const [grammarDescription, setGrammarDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

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
                  {grammars.map((grammar) => (
                    <div key={grammar.id} className="p-2 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
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

                      {/* 내신 콕콕 — 이 문법 유형을 내신에서 틀리는 학생에게 배정하는 맞춤 세트 */}
                      <div className="ml-4 pl-3 border-l-2 border-amber-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                          <Target className="h-3.5 w-3.5" />
                          내신 콕콕
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={() => setAddingFor(grammar.id)}>
                            <Plus className="h-3 w-3 mr-1" />PDF에서 세트 추가
                          </Button>
                        </div>
                        {kokkokSets.filter((k) => k.grammar_id === grammar.id).length === 0 ? (
                          <p className="text-xs text-muted-foreground">아직 세트가 없습니다.</p>
                        ) : kokkokSets.filter((k) => k.grammar_id === grammar.id).map((set) => (
                          <div key={set.id} className="rounded-md bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium flex-1 min-w-0 truncate">{set.title}</span>
                              <Badge variant="outline" className="text-[10px]">{set.questionCount}문항</Badge>
                              {set.videoUrl && <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><Video className="h-3 w-3 mr-0.5" />영상</Badge>}
                              <Button variant="ghost" size="icon" className="h-7 w-7" title={set.videoUrl ? '먼저 보는 영상 바꾸기' : '먼저 보는 영상 연결'} onClick={() => { setVideoFor(set); setVideoUrl(set.videoUrl ?? ''); }}><PlayCircle className={`h-3.5 w-3.5 ${set.videoUrl ? 'text-red-500' : ''}`} /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="학생에게 배정" onClick={() => setAssigning(set)}><UserPlus className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="편집" onClick={() => openEdit(set)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="삭제" disabled={deleting === set.id} onClick={() => handleDeleteSet(set)}>
                                {deleting === set.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
                              </Button>
                            </div>
                            {set.assignments.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {set.assignments.map((a) => (
                                  <span key={a.sheetId} className={`text-[11px] px-1.5 py-0.5 rounded ${a.bestScore != null ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                                    {a.studentName}{a.bestScore != null ? ` ${a.bestScore}점` : ' 미완료'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
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

      {assigning && (
        <AssignClinicDialog templateId={assigning.id} templateTitle={assigning.title} open={true}
          onOpenChange={(v) => { if (!v) { setAssigning(null); router.refresh(); } }} />
      )}
      {editing && (
        <EditTemplateDialog template={editing} open={true}
          onOpenChange={(v) => { if (!v) setEditing(null); }} onUpdated={() => router.refresh()} />
      )}
      <Dialog open={!!videoFor} onOpenChange={(v) => { if (!v) setVideoFor(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>먼저 보는 영상</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">&ldquo;{videoFor?.title}&rdquo; 세트를 풀기 전에 학생이 보는 유튜브 영상입니다. 배정된 학생의 풀이 화면 맨 위에 나오고 시청 여부가 기록됩니다.</p>
          <div className="space-y-2">
            <Label htmlFor="kokkok-video-url">YouTube URL</Label>
            <Input id="kokkok-video-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... (비우면 해제)" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVideoFor(null)}>취소</Button>
            <Button onClick={handleSaveVideo} disabled={savingVideo}>{savingVideo ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}저장</Button>
          </div>
        </DialogContent>
      </Dialog>

      {addingFor && (
        <AddTemplateFromPdfDialog open={true} onOpenChange={(v) => { if (!v) setAddingFor(null); }}
          onAdd={() => router.refresh()} fixed={{ kind: 'kokkok', templateTopic: KOKKOK_TOPIC, grammarId: addingFor }} />
      )}
    </div>
  );
}
