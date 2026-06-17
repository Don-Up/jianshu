import type { Meta, StoryObj } from '@storybook/nextjs-vite';

/**
 * SearchBarPreview shows the visual structure of the SearchBar component.
 * Since SearchBar uses useRouter from Next.js, which requires App Router context,
 * we render a static preview that matches the component's visual appearance.
 */
const SearchBarPreview = () => (
  <form className="relative flex items-center">
    <input
      type="search"
      placeholder="搜索文章..."
      className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
    <button
      type="submit"
      aria-label="搜索"
      className="absolute right-0 h-full px-3 hover:bg-transparent"
    >
      <svg
        className="w-4 h-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  </form>
);

const meta: Meta<typeof SearchBarPreview> = {
  title: 'Components/SearchBar',
  component: SearchBarPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '搜索栏组件，支持输入关键词后回车跳转到搜索结果页。由于使用 Next.js App Router 的 useRouter，需要通过静态预览展示样式。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithPlaceholder: Story = {
  args: {},
};

export const Narrow: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
};

export const Wide: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};