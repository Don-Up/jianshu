<!--
Mental Model: TanStack Query manages server-side state with caching and background refetching. Providers must be client components. Sonner provides toast notifications for user feedback.
-->

<div class="options" data-answer="3">
  <div>为什么 QueryClient 不能直接在 Server Component 中创建传给 Client Component？</div>
  <div>因为 QueryClient 需要使用 useState</div>
  <div>因为 Next.js App Router 不允许将 class 实例从 Server Component 传递给 Client Component</div>
  <div>因为 QueryClient 太大，传参会性能差</div>
  <div class="explain">Next.js App Router 的 RSC (React Server Components) 规定：Server Components 和 Client Components 之间只能传递"可序列化的"数据。class 实例（如 QueryClient、Date、Map 等）无法被序列化，会导致运行时错误。解决方案是用 `useState(() => new QueryClient())` 在 Client Component 内部创建实例。</div>
</div>

<pre><code class="language-typescript">// ❌ 错误：在 Server Component 中创建 class 实例
// layout.tsx (Server Component)
const queryClient = new QueryClient();
<QueryClientProvider client={queryClient}>
// Error: Only plain objects can be passed to Client Components

// ✅ 正确：在 Client Component 内部创建
// query-provider.tsx (Client Component - 'use client')
'use client';
export function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  return &lt;QueryClientProvider client={queryClient}&gt;{children}&lt;/QueryClientProvider&gt;;
}
</code></pre>

---

<div class="options" data-answer="1">
  <div>TanStack Query 的 staleTime: 5 * 60 * 1000 是什么意思？</div>
  <div>数据在 5 分钟内被认为是"新鲜的"，不会自动重新获取</div>
  <div>每 5 分钟会强制刷新一次数据</div>
  <div>数据最多缓存 5 分钟，超时后会被删除</div>
  <div class="explain">staleTime 表示数据被认为"新鲜"的时间。在这个时间内，即使组件重新挂载，TanStack Query 也不会重新请求 API，而是直接使用缓存数据。这减少了不必要的 API 调用，提升用户体验。5 分钟是常见的平衡值。</div>
</div>

<pre><code class="language-typescript">const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟 = 300000ms
      // 在这 5 分钟内，数据是"新鲜的"，不会重新 fetch
    },
  },
});

// 场景：用户快速在列表页和详情页之间切换
// 第一次请求 API -> 缓存 5 分钟
// 5 分钟内的后续请求直接用缓存，不发 API
</code></pre>

---

<div class="options" data-answer="2">
  <div>Sonner toast 和 TanStack Query 的 useMutation 配合使用的典型模式？</div>
  <div>toast 用于显示加载状态，mutation.isPending</div>
  <div>toast 在 onSuccess 和 onError 回调中显示成功/失败消息</div>
  <div>toast 只能在 mutation 外部调用</div>
  <div class="explain">useMutation 返回的 onSuccess/onError 回调是处理副作用的理想位置。在这些回调中调用 toast 可以确保：请求成功时显示成功消息，请求失败时显示错误消息。而且 useMutation 会在 onError 时自动处理错误，不需要手动 try-catch。</div>
</div>

<pre><code class="language-typescript">const mutation = useMutation({
  mutationFn: (content) => commentApi.create(articleId, content),
  onSuccess: () => {
    setContent('');
    toast.success('评论成功'); // ✅ 在回调中显示 toast
    queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
  },
  onError: () => {
    toast.error('评论失败'); // ✅ 失败时显示错误
  },
});

// 组件中使用
&lt;Button onClick={() => mutation.mutate(content)}&gt;
  {mutation.isPending ? '发送中...' : '发送'}
&lt;/Button&gt;
</code></pre>

---

<div class="options" data-answer="3">
  <div>retry: 1 配置的作用是什么？</div>
  <div>每个请求都会重试 1 次</div>
  <div>只有网络错误才重试，4xx 错误不重试</div>
  <div>请求失败时最多重试 1 次，区分网络问题和业务错误</div>
  <div class="explain">retry: 1 表示当查询失败时，最多自动重试 1 次。TanStack Query 的 retry 机制只会对"真正的失败"（如网络错误、5xx 服务器错误）重试。对于业务逻辑错误（如 401 未授权、404 未找到），不会重试，因为这些错误即使重试也会失败。</div>
</div>

<pre><code class="language-typescript">const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 最多重试 1 次
    },
  },
});

// 重试的场景：
// - 网络断开
// - 5xx 服务器错误
// - 连接到服务器超时

// 不重试的场景（直接失败）：
// - 401 Unauthorized（token 过期）
// - 404 Not Found（资源不存在）
// - 400 Bad Request（参数错误）
</code></pre>

---

<div class="options" data-answer="1">
  <div>为什么需要 ToasterProvider 而不是直接在组件中使用 toast？</div>
  <div>Toast 容器需要在组件树中渲染一次，toast 函数调用时会在该容器中显示消息</div>
  <div>ToasterProvider 会自动重试失败的请求</div>
  <div>ToasterProvider 是必须的，因为 Sonner 需要 SSR 支持</div>
  <div class="explain">Sonner 的 toast 是一个"命令式"的 API（调用 toast() 立即显示），但 toast 的渲染需要有一个 React Portal 容器。ToasterProvider 就是在 DOM 中创建这个容器。没有这个容器，toast 调用会报错。Provider 只需要在 layout 中渲染一次，之后在任意组件中调用 toast() 都能正常工作。</div>
</div>

<pre><code class="language-typescript">// layout.tsx
export default function RootLayout({ children }) {
  return (
    &lt;html&gt;
      &lt;body&gt;
        &lt;QueryProvider&gt;
          &lt;AuthProviderWrapper&gt;
            &lt;ToasterProvider /&gt; {/* 只在这里渲染一次容器 */}
            {children}
          &lt;/AuthProviderWrapper&gt;
        &lt;/QueryProvider&gt;
      &lt;/body&gt;
    &lt;/html&gt;
  );
}

// 任意组件中都可以直接使用
// comment-form.tsx
const handleSubmit = () => {
  toast.success('评论成功'); // ✅ 正常工作
};
</code></pre>

---

<div class="options" data-answer="2">
  <div>QueryProvider 和 AuthProvider 的嵌套顺序重要吗？为什么？</div>
  <div>不重要，顺序可以随意</div>
  <div>重要，AuthProvider 可能需要使用 useQuery，需要 QueryProvider 先存在</div>
  <div>不重要，只要都在 layout 中就可以</div>
  <div class="explain">如果 AuthProvider 内部的 hook（如 useAuth）需要调用 API（如获取用户信息），它就依赖于 TanStack Query 的缓存和状态管理。在这种情况下，QueryProvider 必须在 AuthProvider 外层，这样才能确保 useQuery 能正常工作。但如果 AuthProvider 只用 React Context，则顺序无所谓。</div>
</div>

<pre><code class="language-typescript">// ✅ 正确：QueryProvider 在外层
&lt;QueryProvider&gt;
  &lt;AuthProviderWrapper&gt;
    {/* AuthProvider 中的 useQuery 能正常工作 */}
  &lt;/AuthProviderWrapper&gt;
&lt;/QueryProvider&gt;

// ❌ 可能出问题：如果 AuthProvider 需要 useQuery
&lt;AuthProviderWrapper&gt;
  &lt;QueryProvider&gt;
    {/* AuthProvider 在这里无法使用 useQuery */}
  &lt;/QueryProvider&gt;
&lt;/AuthProviderWrapper&gt;
</code></pre>

---

<div class="options" data-answer="3">
  <div>useState(() => new QueryClient()) 中的箭头函数有什么作用？</div>
  <div>让 QueryClient 只创建一次，避免重复创建</div>
  <div>让 QueryClient 的创建是同步的</div>
  <div>惰性初始化：只在首次渲染时创建，后续渲染跳过</div>
  <div class="explain">useState 的惰性初始化模式：`useState(() => factory)` 只有在首次渲染时才会执行 factory 函数。后续渲染直接使用缓存的值，不会重新执行 factory。这确保了 QueryClient 实例只被创建一次，而且只在需要时才创建（惰性）。</div>
</div>

<pre><code class="language-typescript">// 普通写法（不推荐）
const [queryClient] = useState(new QueryClient());
// 每次渲染都会执行 new QueryClient()，虽然 React 会缓存，但不够明确

// 惰性初始化（推荐）
const [queryClient] = useState(() => new QueryClient());
// 只在首次渲染时执行，后续渲染跳过

// 更复杂场景：初始化依赖其他值
const [queryClient] = useState(() => {
  // 只执行一次
  const config = loadConfig();
  return new QueryClient(config);
});
</code></pre>