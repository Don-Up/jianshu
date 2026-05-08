<!--
Mental Model: Password change requires identity verification — users must prove they know the current password before setting a new one, preventing unauthorized access on shared devices.
-->

<div class="options" data-answer="2">
  <div>为什么修改密码需要验证当前密码，而不是直接设置新密码？</div>
  <div>为了确保新密码与旧密码不同</div>
  <div>防止他人在你已登录的设备上擅自修改密码</div>
  <div>bcrypt.compare 是必须的，没有任何替代方案</div>
  <div class="explain">当用户输入正确当前密码时，证明是账号主人本人在操作。这防止了他人借用你已登录的设备（如手机、电脑）擅自修改密码。如果没有当前密码验证，拿到你设备的人可以直接改掉密码，真正的账号主人就被拒之门外了。</div>
</div>

<pre><code class="language-typescript">async changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  // 验证当前密码 - 证明你是账号主人
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new UnauthorizedException('当前密码错误');
  }

  // 只有验证通过才能更新新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await this.prisma.user.update({ ... });
}
</code></pre>

---

<div class="options" data-answer="3">
  <div>bcrypt.hash 和 bcrypt.compare 的区别是什么？</div>
  <div>hash 是加密，compare 是解密</div>
  <div>hash 用于存储密码，compare 用于验证密码，两者都是可逆的</div>
  <div>hash 是单向哈希，无法逆向还原；compare 用于验证输入是否匹配哈希</div>
  <div class="explain">bcrypt.hash 是单向函数，给定密码得到哈希，但无法从哈希反推密码。bcrypt.compare 内部对输入密码再次哈希，与存储的哈希比对。相同则匹配。这确保即使数据库泄露，攻击者也难以从哈希还原原始密码。</div>
</div>

<pre><code class="language-typescript">// 存储密码时 - 哈希
const hashedPassword = await bcrypt.hash(newPassword, 10);
// "$2a$10$X4Z7..." - 无法逆向还原原始密码

// 验证密码时 - 比对
const isValid = await bcrypt.compare(inputPassword, storedHash);
// true = 密码正确, false = 密码错误
</code></pre>

---

<div class="options" data-answer="1">
  <div>为什么 ChangePasswordDto 中新密码有最小长度限制（6字符）？</div>
  <div>防止用户设置过于简单的弱密码，提高账户安全性</div>
  <div>因为数据库字段有长度限制</div>
  <div>这是 RESTful API 的标准规范</div>
  <div class="explain">6字符虽然短，但已是常见最低要求。设置最低长度限制可以防止用户设置 "123"、"pass" 这类极弱密码。配合大写字母、数字、特殊字符等要求（可后续扩展），可以显著提高账户安全性。bcrypt 即使被破解，短密码也更容易被暴力猜解。</div>
</div>

<pre><code class="language-typescript">export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword!: string;

  // 如果不加限制，用户可能设置：
  // "" - 空密码
  // "123" - 3位数字
  // "password" - 常见弱密码
}
</code></pre>

---

<div class="options" data-answer="3">
  <div>为什么修改密码用 POST 方法而不是 PATCH？</div>
  <div>POST 更安全，PATCH 不支持密码修改</div>
  <div>因为密码修改需要同时验证旧密码和新密码</div>
  <div>PATCH 是部分更新，POST 是执行操作。修改密码是"改密码"这个动作，不是更新用户档案字段</div>
  <div class="explain">PATCH /users/me 应该用于更新用户档案（如 name、bio），是部分字段更新。而 POST /users/me/change-password 是一个独立的安全操作，需要特殊验证（当前密码）。REST 设计中，改变身份凭证通常用独立端点和 POST 方法。</div>
</div>

<pre><code class="language-typescript">// PATCH - 部分更新用户资料
@Patch('me')
async updateMe(@Body() dto: UpdateUserDto) {
  // 更新 name, bio 等字段
}

// POST - 独立的安全操作
@Post('me/change-password')
async changePassword(@Body() dto: ChangePasswordDto) {
  // 验证当前密码，设置新密码
}
</code></pre>

---

<div class="options" data-answer="2">
  <div>修改密码成功后，用户现有的登录状态会怎样？</div>
  <div>保持不变，继续使用原有的 access token</div>
  <div>Access token 7天后过期前仍然有效，但无法 refresh。应该调用 logout 撤销 refresh token</div>
  <div>Access token 和 refresh token 都被立即撤销</div>
  <div class="explain">当前实现中，修改密码只更新密码字段。原有的 JWT access token 不会被撤销（因为 JWT 无法撤销）。用户如果有 refresh token，在 token 有效期内仍可使用。安全建议：修改密码后应调用 authService.logout() 撤销所有 refresh token，强制用户重新登录。</div>
</div>

<pre><code class="language-typescript">// 当前实现只改密码
await this.prisma.user.update({
  where: { id: userId },
  data: { password: hashedPassword },
});
// 用户的 access token (JWT) 仍然有效直到过期

// 安全增强：在改密码时撤销所有 refresh token
await this.prisma.refreshToken.deleteMany({ where: { userId } });
// 下次 refresh 会失败，被迫重新登录
</code></pre>

---

<div class="options" data-answer="2">
  <div>如果用户输入错误的当前密码会怎样？服务器返回什么？</div>
  <div>返回 404 Not Found</div>
  <div>返回 401 Unauthorized，提示"当前密码错误"</div>
  <div>返回 400 Bad Request，验证错误</div>
  <div class="explain">用户输入的当前密码与数据库存储的哈希不匹配时，bcrypt.compare 返回 false，抛出 UnauthorizedException，HTTP 状态码 401 Unauthorized。这与"用户不存在"（404）不同——401 明确表示身份验证失败，而不是账号问题。</div>
</div>

<pre><code class="language-typescript">const isValid = await bcrypt.compare(currentPassword, user.password);
if (!isValid) {
  // 401 = 身份验证失败（密码错误）
  throw new UnauthorizedException('当前密码错误');
}

// 注意与 404 的区别
if (!user) {
  // 404 = 资源不存在
  throw new NotFoundException('用户不存在');
}
</code></pre>

---

<div class="options" data-answer="1">
  <div>bcrypt.hash 的第二个参数 10 是什么意思？</div>
  <div>工作因子（cost factor），控制计算复杂度。值越高越安全但越慢</div>
  <div>哈希迭代次数，10 次完全哈希</div>
  <div>密码长度必须至少 10 个字符</div>
  <div class="explain">bcrypt 的 cost factor 决定哈希计算时间。10 表示 2^10 = 1024 次迭代。值越高越能抵抗暴力破解，但计算也越慢。通常 10-12 是平衡值。2019 年的硬件上，bcrypt(10) 约 75ms 计算一次，攻击者每秒只能尝试约 13 次。</div>
</div>

<pre><code class="language-typescript">// cost factor = 10
// 计算时间约 75ms（2019 年硬件）
const hashed = await bcrypt.hash(password, 10);

// cost factor = 14
// 计算时间约 300ms，更安全但更慢
// 通常 10-12 是推荐值
const hashed = await bcrypt.hash(password, 12);
</code></pre>