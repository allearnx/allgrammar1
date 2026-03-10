import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import type { NaesinGrammarLesson } from '@/types/database';
import { ChatQuestionManager } from './chat-question-manager';

interface GrammarEditForm {
  title: string;
  youtube_url: string;
  text_content: string;
}

export interface UnitGrammarListProps {
  lessons: NaesinGrammarLesson[];
  editingId: string | null;
  editForm: GrammarEditForm;
  setEditForm: (form: GrammarEditForm) => void;
  startEdit: (item: NaesinGrammarLesson) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  onRequestDelete: (id: string) => void;
}

export function UnitGrammarList({
  lessons, editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit, onRequestDelete,
}: UnitGrammarListProps) {
  return (
    <div className="space-y-1 rounded-lg border p-2">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="rounded hover:bg-muted/50">
          <div className="flex items-center gap-2 py-1.5 px-2 group">
            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
              {lesson.content_type === 'video' ? '영상' : '텍스트'}
            </Badge>
            <span className="text-sm font-medium flex-1 truncate">{lesson.title}</span>
            {lesson.youtube_video_id && (
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{lesson.youtube_video_id}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => editingId === lesson.id ? cancelEdit() : startEdit(lesson)}
              aria-label="수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onRequestDelete(lesson.id)}
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          {editingId === lesson.id && (
            <div className="px-2 pb-2 space-y-2">
              <Input className="h-7 text-sm" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="제목" />
              {lesson.content_type === 'video' ? (
                <Input className="h-7 text-sm" value={editForm.youtube_url} onChange={(e) => setEditForm({ ...editForm, youtube_url: e.target.value })} placeholder="YouTube URL" />
              ) : (
                <Input className="h-7 text-sm" value={editForm.text_content} onChange={(e) => setEditForm({ ...editForm, text_content: e.target.value })} placeholder="텍스트 내용" />
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="h-7" onClick={cancelEdit}>취소</Button>
                <Button size="sm" className="h-7" onClick={saveEdit}>저장</Button>
              </div>
            </div>
          )}
          <div className="px-2 pb-2">
            <ChatQuestionManager lessonId={lesson.id} lessonTitle={lesson.title} />
          </div>
        </div>
      ))}
    </div>
  );
}
