<!--
Mental Model: Refresh tokens provide secure token rotation — short-lived JWTs (7d) are refreshed using long-lived refresh tokens (30d), reducing JWT theft risk through token rotation.
-->

<div class="options" data-answer="1">
  <div>为什么需要 refresh token？JWT 本身难道不能用于认证吗？</div>
  <div>JWT 无状态，token 过期后无法撤销。Refresh token 提供了在 token 被盗时限制损失的方法</div>
  <div>JWT 太长了，每次请求都带 JWT 会增加网络开销，refresh token 更短更高效</div>
  <div>Refresh token 可以在服务器端存储用户状态，弥补 JWT 无状态的不足</div>
  <div class="explain">JWT 是无状态的，签发后无法撤销。即使 token 被盗，攻击者在过期前都可以使用。Refresh token 通过**令牌轮换**（token rotation）解决这个问题：每次 refresh 时删除旧 token、创建新 token，即使被盗的 token 也会立即失效。</div>
</div>

<pre><code class="language-typescript">// JWT 无状态 - 签发后无法撤销
const token = jwtService.sign({ sub: user.id });
// 如果这个 token 被盗，在过期前攻击者都能使用
// 服务器端没有任何办法"撤销"这个 token

// Refresh token 存在数据库，可以随时删除
await prisma.refreshToken.delete({ where: { token: stolenToken } });
// 现在即使攻击者有 token 也无法 refresh
</code></pre>

---

<div class="options" data-answer="2">
  <div>当一个 refresh token 被使用了两次（被盗用后又被原持有者使用），会发生什么？</div>
  <div>两次调用都返回新的 token pair，原 token 失效</div>
  <div>第一次调用成功返回新 token，第二次调用检测到 token 已被使用过，拒绝并抛出 UnauthorizedException</div>
  <div>两次调用都返回相同的 token pair</div>
  <div class="explain">Refresh 时先 `findUnique` 找到记录再 `delete`。如果 token 已被使用过，第一次调用时删除成功，第二次调用时 `findUnique` 返回 null，抛出异常。攻击者和原持有者不能同时使用同一个 token。</div>
</div>

<pre><code class="language-typescript">async refreshTokens(refreshToken: string) {
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token 无效或已过期');
  }

  // 立即删除旧 token（原子操作）
  await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

  // 生成新 token pair
  const newRefreshToken = await this.createRefreshToken(tokenRecord.userId);
  // ...
}
</code></pre>

---

<div class="options" data-answer="2">
  <div>为什么 refresh token 使用 80 字符的十六进制字符串，而不是更短的用户 ID？</div>
  <div>80字符的hex字符串更短，存储效率更高</div>
  <div>80字符的hex字符串来自 crypto.randomBytes(40)，提供 320 bits 熵，无法暴力猜测</div>
  <div>用户ID太短，JWT header 会暴露用户数量</div>
  <div class="explain">`crypto.randomBytes(40)` 生成 40 字节（320 bits）的密码学安全随机数，转换为 80 字符 hex 字符串。Token 必须不可预测，否则攻击者可以枚举猜测。80 hex chars ≈ 10^48 种可能，暴力破解不现实。</div>
</div>

<pre><code class="language-typescript">// 生成高熵 refresh token
private generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex'); // 40 bytes = 80 hex chars
}

// 错误的做法：用用户 ID 作为 refresh token
const badToken = user.id; // "user-123" - 攻击者可以猜测
// 正确的做法：使用加密学安全的随机数
const goodToken = crypto.randomBytes(40).toString('hex');
// "cc2ed01d633706e71fea9a9ed9846dd2faa3df6516568e4b0232c721b7d46d1e..."
</code></pre>

---

<div class="options" data-answer="2">
  <div>什么叫"令牌轮换"(token rotation)？在这套实现中它是如何工作的？</div>
  <div>Token rotation 指的是 access token 和 refresh token 交换角色</div>
  <div>Token rotation 指每次使用 refresh token 时，都销毁旧 token 并生成全新的 token pair</div>
  <div>Token rotation 指 token 每次 API 调用后自动延长过期时间</div>
  <div class="explain">Token rotation = 每次 refresh 时：验证传入的 token → 立即删除旧 refresh token（原子操作）→ 颁发新的 access token + 新的 refresh token。这确保即使旧 token 被盗，攻击者也只能使用一次就被撤销。</div>
</div>

<pre><code class="language-typescript">// Token rotation 流程
async refreshTokens(refreshToken: string) {
  // 1. 验证旧 token
  const tokenRecord = await this.prisma.refreshToken.findUnique({ ... });

  // 2. 立即删除旧 token（关键：防止重放攻击）
  await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

  // 3. 生成新 token pair
  const newAccessToken = this.generateToken(tokenRecord.user);
  const newRefreshToken = await this.createRefreshToken(tokenRecord.userId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, ... };
}
</code></pre>

---

<div class="options" data-answer="2">
  <div>Logout 的目的是什么？它是如何工作的？</div>
  <div>Logout 清除客户端的 token，服务器端不需要做任何事</div>
  <div>Logout 通过删除用户所有 refresh token 实现服务器端撤销，客户端的 access token 会在 7 天后自然过期</div>
  <div>Logout 会使 access token 立即失效</div>
  <div class="explain">Logout 删除该用户**所有**的 refresh token。Access token（JWT）本身无法撤销，但没有有效的 refresh token 就无法刷新，7 天后自然失效。服务器端撤销是真正的安全保证。</div>
</div>

<pre><code class="language-typescript">async logout(userId: string) {
  // 删除该用户所有 refresh token
  await this.prisma.refreshToken.deleteMany({
    where: { userId },
  });
  return { success: true };
}

// JWT 无法撤销，但 logout 后攻击者无法 refresh
// 7 天后 access token 自然过期，完全失效
</code></pre>

---

<div class="options" data-answer="1">
  <div>Access token 有效期 7 天，refresh token 有效期 30 天。为什么这样设计？</div>
  <div>Access token 短，refresh token 长 —— 平衡安全性与用户体验</div>
  <div>两者反过来，access token 应该更长以便长期访问</div>
  <div>两者时长无所谓，只要不一样就行</div>
  <div class="explain">Access token 频繁在 API 请求中传输，被截获风险高 → 短有效期降低被盗窗口。Refresh token 仅在 refresh 时使用，传输频率低 → 长有效期减少用户登录频率。平衡安全性和用户体验。</div>
</div>

<pre><code class="language-typescript">// JWT 配置
JwtModule.register({
  secret: process.env.JWT_SECRET || 'default-secret',
  signOptions: { expiresIn: '7d' }, // Access token: 7 天
});

// Refresh token 配置
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30); // Refresh token: 30 天

await this.prisma.refreshToken.create({
  data: { token, expiresAt, userId },
});
</code></pre>

---

<div class="options" data-answer="2">
  <div>如果 refresh token 被盗，系统如何保护用户？原持有者会怎样？</div>
  <div>原持有者完全不受影响，继续正常使用</div>
  <div>原持有者的 refresh 会失败（token 不存在），被迫重新登录</div>
  <div>系统自动检测到异常，锁定账户</div>
  <div class="explain">Token rotation 的关键安全属性：**原持有者会被强制下线**。攻击者 refresh 成功后删除了旧 token，当原持有者尝试 refresh 时，`findUnique` 返回 null，抛出 401。原持有者发现异常后重新登录即可。</div>
</div>

<pre><code class="language-typescript">// 被盗场景时序
// 攻击者 → refresh(stolen_token) → 成功，删除旧 token，颁发新 token pair
// 原持有者 → refresh(old_token) → findUnique 返回 null
//           → 抛出 UnauthorizedException
//           → 被迫重新登录

// 攻击者拿到的新 token 也会在下次登录时被吊销
// 因为登录时会删除旧的 refresh token
</code></pre>