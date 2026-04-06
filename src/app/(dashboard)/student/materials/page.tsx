import { Topbar } from '@/components/layout/topbar';
import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function StudentMaterialsPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: materials } = await supabase
    .from('learning_materials')
    .select('id, title, description, file_url, file_size, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="학습자료" />
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">학습자료</h2>
        {!materials?.length ? (
          <p className="text-muted-foreground">등록된 학습자료가 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} · {formatFileSize(m.file_size)}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
