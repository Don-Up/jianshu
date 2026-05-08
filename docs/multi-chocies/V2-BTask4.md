<!--
Mental Model: Three layers of API defense — Rate Limiting prevents abuse, Helmet sets secure HTTP headers, Request Logging enables monitoring and debugging.
-->

<div class="options" data-answer="2">
  <div>什么是 Helmet？它是如何保护 API 的？</div>
  <div>Helmet 是一个加密库，用于加密请求体</div>
  <div>Helmet 通过设置安全的 HTTP 头部来防止 XSS、点击劫持等攻击</div>
  <div>Helmet 是一个限流中间件，防止 API 被滥用</div>
  <div class="explain">Helmet 是 Express/NestJS 的安全中间件，自动设置 11 个 HTTP 安全头部，如 X-XSS-Protection、X-Content-Type-Options、X-Frame-Options 等。这些头部告诉浏览器如何处理你的 API 响应，防止常见攻击向量。</div>
</div>

<pre><code class="language-typescript">// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet 自动设置安全头部
  app.use(helmet());

  // 设置的常见头部：
  // X-XSS-Protection: 1; mode=block
  // X-Content-Type-Options: nosniff
  // X-Frame-Options: SAMEORIGIN
  // Strict-Transport-Security: max-age=31536000; includeSubDomains
}
</code></pre>

---

<div class="options" data-answer="2">
  <div>Rate Limiting（限流）配置的 100 req/min 是什么意思？超出限制会怎样？</div>
  <div>每分钟最多 100 个请求，超出的请求会被重试</div>
  <div>每分钟最多 100 个请求，超出的请求会收到 429 Too Many Requests 错误</div>
  <div>每分钟最多 100 个请求，但所有请求都会被处理</div>
  <div class="explain">ThrottlerModule 配置 ttl: 60000 (1分钟) 和 limit: 100。每 IP 在滑动窗口内最多 100 次请求。超出限制返回 429 状态码。这防止暴力破解和 DoS 攻击。</div>
</div>

<pre><code class="language-typescript">// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1分钟 = 60000ms
      limit: 100,  // 最多100次请求
    }]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 全局限流守卫
  ],
})
export class AppModule {}

// 超出限制时返回：
// HTTP 429 Too Many Requests
</code></pre>

---

<div class="options" data-answer="3">
  <div>LoggingMiddleware 的 `res.on('finish', ...)` 有什么作用？为什么要监听 finish 事件？</div>
  <div>监听 finish 事件是为了等待响应完成后再记录日志</div>
  <div>监听 finish 事件是为了验证响应内容</div>
  <div>监听 finish 事件是因为需要在响应结束后才能获取 statusCode 和 content-length</div>
  <div class="explain">HTTP 响应是流式传输的，在 `res.statusCode` 设置时响应可能还没完成。finish 事件在响应完全发送后才触发，此时可以准确获取最终状态码和响应大小（content-length）。</div>
</div>

<pre><code class="language-typescript">use(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // 不能在这里记录，因为响应还没完成
  // console.log(res.statusCode); // 可能不准确

  res.on('finish', () => {
    // 响应完成后才记录
    const duration = Date.now() - start;
    this.logger.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${res.get('content-length')}b - ${duration}ms`
    );
  });

  next();
}
</code></pre>

---

<div class="options" data-answer="1">
  <div>为什么 Rate Limiting 要用 APP_GUARD 而不是中间件？</div>
  <div>APP_GUARD 让 ThrottlerGuard 成为全局守卫，自动应用于所有路由，无需每个控制器手动添加</div>
  <div>APP_GUARD 性能比中间件更好</div>
  <div>中间件无法访问路由信息</div>
  <div class="explain">使用 `APP_GUARD` 注册的守卫是全局的，会自动应用于每个路由。通过中间件方式需要 `app.use(guard)` 并且不能利用守卫的反射机制（如 @Public() 装饰器）。全局守卫更符合 NestJS 的设计理念。</div>
</div>

<pre><code class="language-typescript">// 全局守卫 - 所有路由自动受保护
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
]

// 如果用中间件方式
app.use(throttlerGuard); // 不能识别 @Public() 等装饰器

// 如果用守卫方式，配合装饰器可以精细控制
@Public() // 这个路由跳过限流
@Get('health')
healthCheck() { ... }
</code></pre>

---

<div class="options" data-answer="3">
  <div>CORS_ORIGINS 环境变量的作用是什么？为什么要可配置？</div>
  <div>用于加密 CORS 密钥</div>
  <div>用于限制同时连接的客户端数量</div>
  <div>用于指定允许哪些域名跨域访问 API，支持多值配置</div>
  <div class="explain">CORS (Cross-Origin Resource Sharing) 限制哪些域名可以从前端 JavaScript 访问 API。可配置允许多个域名（如 `http://localhost:3000,https://example.com`），开发环境用 localhost，生产环境用正式域名。</div>
</div>

<pre><code class="language-typescript">// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});

// .env
// CORS_ORIGINS=http://localhost:3000,https://jianshu.example.com

// 浏览器检查 Origin 头部
// 如果 origin 不在允许列表，返回 CORS 错误
</code></pre>

---

<div class="options" data-answer="2">
  <div>Log 格式 `GET /api/articles 200 100b - 15ms` 中各部分的含义？</div>
  <div>HTTP方法、路由、状态码、响应大小、错误代码</div>
  <div>HTTP方法、原始URL、状态码、响应大小(字节)、处理时长(毫秒)</div>
  <div>请求方法、用户IP、状态码、响应大小、处理时长</div>
  <div class="explain">LoggingMiddleware 记录的格式：METHOD ORIGINAL_URL STATUS_CODE CONTENT_LENGTHb DURATIONms。便于监控 API 性能、发现异常请求（如大量 404）、识别慢请求。</div>
</div>

<pre><code class="language-typescript">// 实际日志输出示例
// GET /api/articles 200 100b - 15ms - 127.0.0.1 Mozilla/5.0
// DELETE /api/articles/test-123 204 0b - 8ms - 10.0.0.1 curl/7.68.0
// GET /api/nonexistent 404 0b - 3ms - 192.168.1.1 Chrome/100

// 用于：
// 1. 性能监控 - 发现慢请求
// 2. 异常检测 - 大量 4xx/5xx
// 3. 调试 - 追踪请求流程
</code></pre>

---

<div class="options" data-answer="1">
  <div>X-Frame-Options 头部防止的是什么攻击？</div>
  <div>点击劫持（Clickjacking）- 攻击者将你的页面嵌入 iframe，诱骗用户点击</div>
  <div>跨站脚本（XSS）- 注入恶意 JavaScript 代码</div>
  <div>跨站请求伪造（CSRF）- 诱导用户访问恶意链接发送伪造请求</div>
  <div class="explain">Clickjacking 攻击：攻击者用 iframe 嵌入你的网站，表面盖一层透明按钮诱导用户点击（如"领取奖品"）。X-Frame-Options: DENY 完全禁止，或 SAMEORIGIN 只允许同源 iframe。Helmet 自动设置此头部。</div>
</div>

<pre><code class="language-typescript">// 攻击者网页
// &lt;iframe src="https://your-api.com/dashboard"&gt;
//   &lt;button onclick="恶意代码"&gt;领取奖品&lt;/button&gt;
// &lt;/iframe&gt;

// 用户看到"领取奖品"，实际点击的是 iframe 内的按钮

// 防御：
// X-Frame-Options: DENY 禁止任何 iframe
// X-Frame-Options: SAMEORIGIN 只允许同源 iframe
// Helmet 默认设置 X-Frame-Options: SAMEORIGIN
</code></pre>

---

<div class="options" data-answer="3">
  <div>为什么 Strict-Transport-Security (HSTS) 对 API 安全重要？</div>
  <div>HSTS 强制浏览器始终通过 HTTPS 访问，防止中间人攻击</div>
  <div>HSTS 加密 API 响应体</div>
  <div>HSTS 将所有 HTTP 请求重定向到 HTTPS</div>
  <div class="explain">HSTS 告诉浏览器"在未来访问这个域名时只使用 HTTPS"。防止中间人攻击：即使用户手动输入 http:// 或被重定向到 http://，浏览器会自动使用 HTTPS。这对保护 JWT tokens 等敏感信息很重要。</div>
</div>

<pre><code class="language-typescript">// HSTS 头部
// Strict-Transport-Security: max-age=31536000; includeSubDomains

// 效果：
// 1. 浏览器记住 1 年（31536000秒）
// 2. 期间所有请求强制走 HTTPS
// 3. 即使有人拦截 http://api.com，也会被浏览器自动改为 https://

// 风险：如果证书过期，网站完全无法访问
// 所以 max-age 需要权衡
</code></pre>