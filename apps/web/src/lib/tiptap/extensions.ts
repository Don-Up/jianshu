import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export const extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-md max-w-full',
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline hover:underline',
    },
  }),
  Placeholder.configure({
    placeholder: '输入文章内容...',
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: 'bg-muted rounded-md p-4 font-mono text-sm',
    },
  }),
  HorizontalRule,
];