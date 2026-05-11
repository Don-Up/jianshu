<!--
Mental Model: HTTP-only cookies + Next.js middleware provides server-side auth protection. Middleware intercepts requests before rendering, validates tokens, and handles refresh automatically.
-->

<div class="options" data-answer="2">
  <div>为什么登录后要把 token 存储在 HTTP-only Cookie 而不是 localStorage？</div>
  <div>HTTP-only Cookie 传输更方便，自动随请求发送</div>
  <div>XSS 攻击无法读取 HTTP-only Cookie，只有服务器能访问</div>
  <div>localStorage 有大小限制，Cookie 没有</div>
  <div class="explain">HTTP-only Cookie 通过设置 `httpOnly: true`，JavaScript 无法通过 `document.cookie` 访问。即使页面存在 XSS 漏洞，攻击者也无法窃取 token。而 localStorage 可以被任何 JavaScript 代码读写，是 XSS 攻击的主要目标。这就是为什么认证 token 应该用 HTTP-only Cookie 存储。</div>
</div>

<pre><code class="language-typescript">// 设置 HTTP-only Cookie（服务器端）
cookieStore.set('jianshu_access_token', token, {
  httpOnly: true,    // JavaScript 无法访问
  secure: true,     // 仅 HTTPS 传输
  sameSite: 'lax',  // CSRF 保护
});

// 攻击者即使发现 XSS 漏洞，也无法读取 token
// document.cookie 返回不包含 httpOnly 的 cookie
</code></pre>

---

<div class="options" data-answer="3">
  <div>Next.js Middleware 的 `matcher` 配置为什么要排除 `api/_next/static` 等路径？</div>
  <div>这些路径不需要认证，所以排除可以提高性能</div>
  <div>Next.js 要求这些路径必须排除，否则会报错</div>
  <div>排除静态资源和 Next.js 内部路径，只对页面路由进行认证检查</div>
  <div class="explain">Middleware 的 matcher 决定哪些请求需要被拦截处理。静态资源（`_next/static`、`_next/image`）、API 路由（`api/*`）、favicon 等不需要会话认证。如果不排除，访问一个 JS 文件也会触发不必要的中间件逻辑，而且 API 路由有自己的认证处理方式。</div>
</div>

<pre><code class="language-typescript">export const config = {
  matcher: [
    // 匹配所有页面请求，排除静态资源和 API 路由
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

// 访问 /write → 触发 middleware 检查 token
// 访问 /api/articles → 不触发（API 有自己的认证）
// 访问 /_next/static/chunks/app.js → 不触发（静态资源）
</code></pre>

---

<div class="options" data-answer="2">
  <div>当用户访问 /write 时，JWT 已过期但 refreshToken 有效，Middleware 的处理流程是？</div>
  <div>直接重定向到 /login</div>
  <div>调用 /api/auth/refresh 获取新 token，设置新 cookie，允许请求继续</div>
  <div>从 localStorage 读取旧 token</div>
  <div class="explain">Middleware 检测到 accessToken 过期但有 refreshToken 时，会先调用后端的 /api/auth/refresh 接口。成功后获得新的 accessToken 和 refreshToken（单次使用轮换），更新 cookie 后允许请求继续。这是无感的自动刷新，用户不会察觉到 token 已更新。</div>
</div>

<pre><code class="language-typescript">if (accessToken && !isTokenValid(accessToken) && refreshToken) {
  // Token 过期但有 refreshToken，尝试刷新
  const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (refreshResponse.ok) {
    const { token, refreshToken: newRefreshToken } = await refreshResponse.json();
    // 设置新 cookie，继续处理请求
    response.cookies.set('jianshu_access_token', token, {...});
    return response; // 请求继续，不重定向
  }
}
</code></pre>

---

<div class="options" data-answer="1">
  <div>`sameSite: 'lax'` 在 Cookie 配置中的作用是什么？</div>
  <div>防止 CSRF 攻击，只在同站点请求时发送 cookie</div>
  <div>让 Cookie 在所有域名的请求中都能发送</div>
  <div>增加 Cookie 的安全性，防止被篡改</div>
  <div class="explain">`sameSite` 属性可以防止 CSRF（跨站请求伪造）攻击。设置为 `lax` 时，浏览器只在 Same Site 的请求（用户从你的网站点击链接访问）中发送 cookie。跨站 POST 请求（如来自其他网站的表单提交）不会携带 cookie，从而防止攻击者利用用户的登录状态发起恶意请求。</div>
</div>

<pre><code class="language-typescript">cookieStore.set('jianshu_access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',  // CSRF 保护
  maxAge: 60 * 60 * 24 * 7, // 7 天
});

// 攻击者从其他网站 POST 请求到你的 API
// 浏览器不会发送 cookie（跨站请求），攻击失败
</code></pre>

---

<div class="options" data-answer="3">
  <div>为什么 logout 需要调用后端的 /api/auth/logout 接口？</div>
  <div>不需要，clearAuthCookies 已经足够</div>
  <div>后端需要记录用户登出日志</div>
  <div>需要让后端删除 refreshToken 使其失效，防止被窃取后继续使用</div>
  <div class="explain">logout 不仅要清除客户端的 cookie，还要通知后端使 refreshToken 失效。因为 refreshToken 存储在数据库中，如果只清除本地 cookie，攻击者如果已经窃取了 refreshToken 仍然可以使用它（直到过期或被使用）。调用后端 logout 会删除数据库中的 refreshToken，实现真正的"注销"效果。</div>
</div>

<pre><code class="language-typescript">export async function POST() {
  const accessToken = await getAccessToken();

  // 通知后端删除 refreshToken（即使窃取也无法使用）
  if (accessToken) {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // 清除本地 cookie
  await clearAuthCookies();
  return NextResponse.json({ success: true });
}
</code></pre>

---

<div class="options" data-answer="1">
  <div>Next.js API Route 作为 auth 的代理（proxy）而不是直接调用后端，主要原因是什么？</div>
  <div>API Route 可以在服务端设置 HTTP-only Cookie，直接调用后端无法设置</div>
  <div>减少前端与后端的直接连接，提高性能</div>
  <div>方便统一管理所有 API 的错误处理</div>
  <div class="explain">浏览器安全策略限制：只有同源的响应才能设置 Cookie。前端直接调用 `http://localhost:4000`（后端）无法设置 `localhost:3000`（前端）的 Cookie。通过 Next.js API Route 作为代理，前端请求同源的 `/api/auth/login`，然后由服务端代码调用后端并设置 Cookie，这样可以利用服务端的能力绕过浏览器限制。</div>
</div>

<pre><code class="language-typescript">// 直接调用后端（无法设置前端 Cookie）
await fetch('http://localhost:4000/api/auth/login', {...});

// 通过 API Route 代理（可以设置 HTTP-only Cookie）
// apps/web/src/app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {...}); // 调用后端
  await setAuthCookies({ accessToken: token, refreshToken }); // 设置 Cookie
  return NextResponse.json({ success: true, data: { user } });
}
</code></pre>

---

<div class="options" data-answer="2">
  <div>为什么 (app)/layout.tsx 中的路由保护可以被 middleware 替代？</div>
  <div>两者功能完全一样，可以删除任何一个</div>
  <div>middleware 在请求到达服务器前就拦截，layout 只在客户端渲染后检查</div>
  <div>layout 检查更安全，因为是服务端执行</div>
  <div class="explain">middleware 在服务端执行，请求在到达页面组件之前就被拦截。如果用户没有有效 token，直接返回重定向响应，不会渲染任何页面内容。而 layout.tsx 的 useEffect 检查只在客户端 hydration 后执行，用户会短暂看到加载状态。middleware 提供了"零闪烁"的保护，而且即使恶意用户直接构造请求，middleware 也能在服务端验证。</div>
</div>

<pre><code class="language-typescript">// middleware.ts - 服务端拦截，完全不渲染页面
export async function middleware(request: NextRequest) {
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// (app)/layout.tsx - 客户端渲染后才检查，有闪烁
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login'); // 用户会先看到加载动画
  }
}, [...]);
</code></pre>

---

<div class="options" data-answer="3">
  <div>refreshToken 为什么设计为"单次使用"（使用后立即失效并生成新的）？</div>
  <div>减少数据库存储压力，删除旧 token 节省空间</div>
  <div>让前端更容易管理 token 状态</div>
  <div>防止 refreshToken 被窃取后被重复使用（token 窃取攻击）</div>
  <div class="explain">单次使用的 refreshToken 设计（token rotation）是安全最佳实践。如果 refreshToken 被攻击者窃取，由于原用户下次使用后原 token 会立即失效并更新，攻击者拿到的已失效，无法再次使用。这阻止了"token 窃取重放攻击"。但这也意味着必须一次性使用，不能多次用于获取新 token。</div>
</div>

<pre><code class="language-typescript">// 后端 auth.service.ts
async refreshTokens(oldToken: string) {
  // 验证旧 token
  const storedToken = await this.findRefreshToken(oldToken);

  // 删除旧 token（立即失效）
  await this.deleteRefreshToken(oldToken);

  // 生成新 pair
  const newAccessToken = this.generateAccessToken(user);
  const newRefreshToken = this.generateRefreshToken();

  // 保存新 token
  await this.saveRefreshToken(userId, newRefreshToken);

  return { token: newAccessToken, refreshToken: newRefreshToken };
}
</code></pre>