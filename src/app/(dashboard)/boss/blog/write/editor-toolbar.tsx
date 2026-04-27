'use client';

import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link,
  Image,
  ImageUp,
  Minus,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onUploadImage?: (file: File) => Promise<string | null>;
}

export function EditorToolbar({ editor, onUploadImage }: EditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  function addLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL을 입력하세요', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function addImageByUrl() {
    if (!editor) return;
    const url = window.prompt('이미지 URL을 입력하세요');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor || !onUploadImage) return;
    const url = await onUploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function openImagePicker() {
    imageInputRef.current?.click();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/50 p-1">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <ToolbarButton icon={Bold} label="굵게" action={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
      <ToolbarButton icon={Italic} label="기울임" action={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
      <ToolbarButton icon={Underline} label="밑줄" action={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} />
      <ToolbarButton icon={Strikethrough} label="취소선" action={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton icon={Heading2} label="제목 2" action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} />
      <ToolbarButton icon={Heading3} label="제목 3" action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} />
      <ToolbarButton icon={Heading4} label="제목 4" action={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive('heading', { level: 4 })} />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton icon={List} label="글머리 기호" action={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
      <ToolbarButton icon={ListOrdered} label="번호 목록" action={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton icon={Quote} label="인용문" action={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} />
      <ToolbarButton icon={Code2} label="코드 블록" action={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton icon={Link} label="링크" action={addLink} isActive={editor.isActive('link')} />
      <ToolbarButton icon={Image} label="이미지 URL" action={addImageByUrl} isActive={false} />
      <ToolbarButton icon={ImageUp} label="이미지 업로드" action={openImagePicker} isActive={false} />
      <ToolbarButton icon={Minus} label="구분선" action={() => editor.chain().focus().setHorizontalRule().run()} isActive={false} />
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, action, isActive }: { icon: React.ComponentType<{ className?: string }>; label: string; action: () => void; isActive: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
      onClick={action}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
