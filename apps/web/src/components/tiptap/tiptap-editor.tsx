'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useCallback } from 'react';
import { extensions } from '@/lib/tiptap/extensions';
import { TiptapToolbar } from './tiptap-toolbar';
import { uploadImage, isImageFile, getImageFileLimit } from '@/lib/upload';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[400px] font-serif text-lg leading-relaxed px-4 py-3 focus:outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
      },
      handleDrop: (view, event, _slice, _moved) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (!isImageFile(file)) return false;

        if (file.size > getImageFileLimit()) {
          alert('图片大小不能超过 5MB');
          return true;
        }

        // Upload and insert image
        event.preventDefault();
        const reader = new FileReader();
        reader.onload = async () => {
          const result = await uploadImage(file);
          if (result.success && result.url) {
            editor?.chain().focus().setImage({ src: result.url }).run();
          } else {
            alert(result.error || '上传失败');
          }
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
  });

  // Update editor content when prop changes (after article loads)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="border rounded-md overflow-hidden">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}