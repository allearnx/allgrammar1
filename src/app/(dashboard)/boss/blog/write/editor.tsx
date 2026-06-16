'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, ArrowLeft, Paperclip, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { generateSlug } from '@/lib/blog/generate-slug';
import { EditorToolbar } from './editor-toolbar';
import type { BlogPost, BlogCategory, BlogAttachment } from '@/types/blog';
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS } from '@/types/blog';

interface BlogEditorProps {
  post: BlogPost | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter();
  const isEdit = !!post;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [category, setCategory] = useState<BlogCategory>(post?.category ?? 'general');
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url ?? '');
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? '');
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);
  const [attachments, setAttachments] = useState<BlogAttachment[]>(post?.attachments ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await fetchWithToast<{ url: string }>('/api/boss/upload', {
        method: 'POST',
        body: formData,
        successMessage: '이미지가 업로드되었습니다',
        errorMessage: '업로드 실패',
      });
      return result.url;
    } catch {
      return null;
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'rounded-md max-w-full' },
      }),
      Placeholder.configure({
        placeholder: '본문을 작성하세요... (이미지를 드래그하거나 붙여넣기할 수 있습니다)',
      }),
    ],
    content: post?.content ?? '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none',
      },
      handleDrop(view, event, _slice, moved) {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadImage(file).then((url) => {
          if (!url) return;
          const node = view.state.schema.nodes.image.create({ src: url });
          const tr = view.state.tr.insert(pos ?? view.state.selection.anchor, node);
          view.dispatch(tr);
        });
        return true;
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;
            uploadImage(file).then((url) => {
              if (!url || !editor) return;
              editor.chain().focus().setImage({ src: url }).run();
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugManuallyEdited) {
        setSlug(generateSlug(value));
      }
    },
    [slugManuallyEdited],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true);
    // 소문자, 숫자, 하이픈만 허용
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }, []);

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setThumbnailUrl(url);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 첨부할 수 있습니다');
      if (attachInputRef.current) attachInputRef.current.value = '';
      return;
    }
    setAttaching(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await fetchWithToast<{ url: string }>('/api/boss/upload', {
        method: 'POST',
        body: formData,
        successMessage: '파일이 첨부되었습니다',
        errorMessage: '첨부 실패',
      });
      setAttachments((prev) => [...prev, { name: file.name, url: result.url, size: file.size }]);
    } catch {
      // error already toasted
    } finally {
      setAttaching(false);
      if (attachInputRef.current) attachInputRef.current.value = '';
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  async function handleSave() {
    if (!title.trim()) return;
    if (!editor) return;

    const content = editor.getHTML();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim(),
        content,
        category,
        thumbnail_url: thumbnailUrl.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_published: isPublished,
        attachments,
      };

      if (isEdit) {
        payload.id = post.id;
        await fetchWithToast('/api/boss/blog', {
          method: 'PATCH',
          body: payload,
          successMessage: '글이 수정되었습니다',
          errorMessage: '수정 실패',
        });
      } else {
        await fetchWithToast('/api/boss/blog', {
          method: 'POST',
          body: payload,
          successMessage: '글이 작성되었습니다',
          errorMessage: '작성 실패',
        });
      }
      router.push('/boss/blog');
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/boss/blog')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={isPublished}
              onCheckedChange={(v: boolean) => setIsPublished(v)}
            />
            <Label className="text-sm">{isPublished ? '공개' : '비공개'}</Label>
          </div>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? '저장 중...' : isEdit ? '수정' : '작성'}
          </Button>
        </div>
      </div>

      {/* Title & Slug */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>제목</Label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="글 제목을 입력하세요"
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label>슬러그 (URL)</Label>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="url-friendly-slug"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            /blog/{slug || 'slug'}
          </p>
        </div>
      </div>

      {/* Category & Excerpt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as BlogCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {BLOG_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>대표 이미지</Label>
          <div className="flex gap-2">
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="이미지 URL 또는 업로드"
              className="flex-1"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleThumbnailUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="썸네일 미리보기"
              className="h-20 w-auto rounded-md object-cover mt-1"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>요약</Label>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="블로그 목록에 표시될 요약문"
          rows={2}
        />
      </div>

      {/* Tiptap Editor */}
      <div className="space-y-2">
        <Label>본문</Label>
        <div className="rounded-md border">
          <EditorToolbar editor={editor} onUploadImage={uploadImage} />
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 첨부 파일 (PDF) */}
      <div className="space-y-2">
        <Label>첨부 파일 (PDF)</Label>
        <p className="text-xs text-muted-foreground">
          시험지·학습자료 등 PDF를 첨부하면 글 하단에 다운로드 링크로 표시됩니다. (최대 20MB)
        </p>
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map((att) => (
              <li
                key={att.url}
                className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-violet-500" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate hover:underline"
                >
                  {att.name}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(att.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeAttachment(att.url)}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={attachInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleAttachmentUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={attaching}
          onClick={() => attachInputRef.current?.click()}
        >
          {attaching ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4 mr-1.5" />
          )}
          PDF 첨부
        </Button>
      </div>

      {/* SEO */}
      <details className="space-y-4">
        <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
          SEO 설정 (선택)
        </summary>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>메타 제목</Label>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="검색엔진에 표시될 제목 (비워두면 글 제목 사용)"
            />
          </div>
          <div className="space-y-2">
            <Label>메타 설명</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="검색엔진에 표시될 설명 (비워두면 요약 사용)"
              rows={2}
            />
          </div>
        </div>
      </details>

      {/* Bottom Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push('/boss/blog')}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? '저장 중...' : isEdit ? '수정' : '작성'}
        </Button>
      </div>
    </div>
  );
}
