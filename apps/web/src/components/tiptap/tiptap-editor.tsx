'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { extensions } from '@/lib/tiptap/extensions';
import { TiptapToolbar } from './tiptap-toolbar';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      console.log("Editor content updated:", editor.getHTML());
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[400px] font-serif text-lg leading-relaxed px-4 py-3 focus:outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
      },
    },
  });

  return (
    <div className="border rounded-md overflow-hidden">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}