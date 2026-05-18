import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArticleContent } from './article-content';
import type { ArticleWithAuthor } from '@/types';

const mockArticle: ArticleWithAuthor = {
  id: '1',
  title: '学习 TypeScript 的最佳实践',
  slug: 'typescript-best-practices',
  content: `
    <h1>什么是 TypeScript</h1>
    <p>TypeScript 是 JavaScript 的超集，提供了类型系统和面向对象编程特性。</p>
    <h2>类型推断</h2>
    <p>TypeScript 可以自动推断变量的类型。</p>
    <h3>基本类型</h3>
    <ul>
      <li>string - 字符串类型</li>
      <li>number - 数字类型</li>
      <li>boolean - 布尔类型</li>
    </ul>
    <blockquote>TypeScript 让代码更健壮</blockquote>
    <pre><code class="language-typescript">const greeting: string = "Hello";</code></pre>
    <p>更多信息请访问 <a href="https://www.typescriptlang.org">TypeScript 官网</a></p>
    <hr>
    <p>感谢阅读！</p>
  `,
  excerpt: '本文介绍 TypeScript 的核心概念和最佳实践',
  coverImage: 'https://picsum.photos/800/400',
  tags: ['TypeScript', '前端', '编程'],
  author: {
    id: 'user-123',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    username: 'zhangsan',
    bio: '全栈开发者',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  },
  likeCount: 42,
  readCount: 1234,
  commentCount: 5,
  isLiked: false,
  isBookmarked: false,
  createdAt: new Date('2024-01-20T08:00:00Z'),
  updatedAt: new Date('2024-01-20T08:00:00Z'),
};

const meta: Meta<typeof ArticleContent> = {
  title: 'Components/ArticleContent',
  component: ArticleContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    article: { control: 'object' },
    onLike: { action: 'liked' },
    isLiking: { control: 'boolean' },
    showEditButton: { control: 'boolean' },
    onEdit: { action: 'edit clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    article: mockArticle,
    onLike: () => console.log('Like clicked'),
    isLiking: false,
  },
};

export const Liked: Story = {
  args: {
    article: { ...mockArticle, isLiked: true, likeCount: 43 },
    onLike: () => console.log('Unlike clicked'),
    isLiking: false,
  },
};

export const Loading: Story = {
  args: {
    article: mockArticle,
    onLike: () => {},
    isLiking: true,
  },
};

export const WithEditButton: Story = {
  args: {
    article: mockArticle,
    onLike: () => {},
    isLiking: false,
    showEditButton: true,
    onEdit: () => console.log('Edit clicked'),
  },
};

export const NoTags: Story = {
  args: {
    article: { ...mockArticle, tags: [] },
    onLike: () => {},
    isLiking: false,
  },
};

export const NoCoverImage: Story = {
  args: {
    article: { ...mockArticle, coverImage: '' },
    onLike: () => {},
    isLiking: false,
  },
};

export const LongContent: Story = {
  args: {
    article: {
      ...mockArticle,
      content: `
        <h1>第一章</h1>
        <p>这是一个很长的文章内容，用于测试渲染效果。</p>
        <h2>第一节</h2>
        <p>介绍性内容...</p>
        <h3>1.1 小节</h3>
        <p>详细讲解...</p>
        <ul>
          <li>第一点</li>
          <li>第二点</li>
          <li>第三点</li>
        </ul>
        <h3>1.2 小节</h3>
        <p>更多内容...</p>
        <blockquote>重要引用</blockquote>
        <pre><code>console.log("Hello World");</code></pre>
        <h2>第二章</h2>
        <p>继续深入...</p>
      `,
    },
    onLike: () => {},
    isLiking: false,
  },
};