'use client';

import { useState, useRef } from 'react';
import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { uploadImage, isImageFile, getImageFileLimit } from '@/lib/upload';

interface TiptapToolbarProps {
  editor: Editor | null;
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleLink = () => {
    let url = window.prompt('输入链接 URL:');
    if (url) {
      // Ensure URL has protocol for absolute link
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const { from, to } = editor.state.selection;
      if (from === to) {
        editor.chain().focus().insertContent(`<a href="${url}">链接</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isImageFile(file)) {
      alert('请选择图片文件');
      return;
    }

    // Validate file size
    if (file.size > getImageFileLimit()) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      if (result.success && result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
      } else {
        alert(result.error || '上传失败');
      }
    } catch {
      alert('上传失败');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUrl = () => {
    const url = window.prompt('输入图片 URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const groups = [
    {
      label: '文本',
      items: [
        { label: 'B', title: '粗体', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { label: 'I', title: '斜体', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { label: 'U', title: '下划线', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
        { label: 'S', title: '删除线', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
      ],
    },
    {
      label: '标题',
      items: [
        { label: 'H1', title: '一级标题', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
        { label: 'H2', title: '二级标题', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
        { label: 'H3', title: '三级标题', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
      ],
    },
    {
      label: '列表',
      items: [
        { label: '•', title: '无序列表', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { label: '1.', title: '有序列表', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
      ],
    },
    {
      label: '块',
      items: [
        { label: '"', title: '引用', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
        { label: '<>', title: '代码块', action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
        { label: '—', title: '分割线', action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
      ],
    },
    {
      label: '媒体',
      items: [
        { label: '🔗', title: '链接', action: handleLink, active: editor.isActive('link') },
        { label: '🖼', title: '上传图片', action: handleImageUploadClick, active: false, loading: isUploading },
        { label: '🔍', title: '图片 URL', action: handleImageUrl, active: false },
      ],
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {groups.map((group, i) => (
        <div key={i} className="flex items-center gap-1">
          {group.items.map((item, j) => (
            <Button
              key={j}
              type="button"
              variant="ghost"
              size="sm"
              title={item.title}
              onClick={item.action}
              disabled={(item as any).loading}
              className={item.active ? 'bg-accent' : ''}
            >
              {(item as any).loading ? '⏳' : item.label}
            </Button>
          ))}
          {i < groups.length - 1 && <div className="w-px h-6 bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
}