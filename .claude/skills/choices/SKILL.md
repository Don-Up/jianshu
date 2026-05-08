---
name: multi-choice questions
description: This skill generates interactive multiple-choice questions (3-option) from technical dialogue or code documentation. It focuses on building mental models and helping developers quickly understand new codebases through strategic questioning.
---

# Claude Code Skill: Interactive Choice Generator for Code Learning

You are generating interactive multiple-choice questions for developers learning a new codebase.

**Context:** [Brief description of what the developer is learning]

**Mental Model to Build:** [What understanding should the developer walk away with?]

**Source Dialogue/Code:** [The technical discussion or code to base questions on]

**Generate 5-10 questions following this pattern:**

For each question:
1. Identify a **decision point** or **non-obvious pattern**
2. Craft a question that tests **understanding of why** (not just memorization)
3. Write 3 options: 1 correct, 2 plausible distractors
4. Provide an explanation that **builds mental model** (not just "A is correct")
5. Include a code snippet that **compares correct vs incorrect** approaches

**Output Format:** HTML with embedded code snippets using proper syntax highlighting

**Constraints:**
- Correct answer should be pedagogically valuable
- Distractors must be realistic (things developers actually get wrong)
- Code snippets must be self-contained and runnable in context
- Avoid trick questions; focus on genuine understanding

## Where to place this multi-choice questions
/docs/multi-chocies/{TaskName}.html

## Key Principles for Mental Model Building

### 1. **Question Focus Areas**
- **Why** decisions were made (not just what)
- **Trade-offs** between approaches
- **Edge cases** and error handling
- **Data flow** through the system
- **Component boundaries** and responsibilities

### 2. **Distractor Design Rules**
- Distractors should be **plausible but wrong** (not obviously silly)
- Each distractor should represent a **common misconception**
- Avoid making correct answer consistently longer/shorter
- Distractors should teach something (even wrong answers have learning value)

### 3. **Code Snippet Strategy**
- Include **both correct and incorrect patterns** side-by-side
- Highlight the **minimal difference** between working and broken code
- Show **real usage examples** from actual codebase
- Annotate key lines with comments

## Example Question Generation Process

### Step 1: Extract Key Technical Decision
From dialogue: "Why does `PageLayout` need `showFooter` prop?"

### Step 2: Identify Mental Model
**Mental Model:** Container components should be configurable for different page contexts (login pages need focus, content pages need complete layout).

### Step 3: Craft Question
> "为什么 PageLayout 需要 `showFooter` 这个 prop？"

### Step 4: Write Distractors
- (Correct) 某些页面（如登录页、注册页）需要隐藏页脚，将用户注意力集中在表单上
- (Plausible wrong) 移动端性能优化：在低端设备上隐藏 Footer 可以节省渲染资源
- (Plausible wrong) 某些页面会自己实现页脚，需要避免重复渲染

### Step 5: Write Explanation
Explain the **conversion funnel** concept and why login pages omit footer links to reduce cognitive load.

### Step 6: Create Code Snippet
Show both usage patterns (with/without footer) in real context.

## Quality Checklist

Before outputting questions, verify:

- [ ] Each question tests **understanding of a decision**, not just fact recall
- [ ] Distractors represent **real misconceptions**
- [ ] Code snippets are **minimal but complete**
- [ ] Explanations build **mental models** (cause → effect)
- [ ] Correct answer isn't consistently the longest/shortest
- [ ] Questions cover **edge cases** and **error handling** (not just happy path)
- [ ] Snippets show **both correct and incorrect** patterns when helpful

## Example Output: Auth Context Questions

Here's a sample question generated using this skill from the earlier Auth Hook dialogue:

data-answer="1" means the first option is correct, 2 means the second option is correct, 3 means the third option is correct.

```html
<div class="options" data-answer="1">
  <div>在 `AuthProvider` 中，为什么需要 `isLoading` 状态，以及它的初始值为什么是 `true`？</div>
  <div>`isLoading` 表示认证初始化状态（正在验证 token），初始 `true` 可防止组件在认证完成前错误地渲染“未登录” UI，避免界面闪烁或内容错位</div>
  <div>`isLoading` 是 React 18 并发特性的要求，不定义会导致组件无法使用 Suspense</div>
  <div>`AuthProvider` 必须在加载完成前返回加载状态，否则 Next.js 会警告服务器组件与客户端组件不匹配</div>
  <div class="explain">`isLoading` 解决了“认证水合”（auth hydration）问题。在 AuthProvider 完成 token 验证前，不知道用户是否真的登录。初始返回 `isLoading: true`，组件可以显示加载动画，验证完成后才显示“已登录”或“未登录”的 UI，避免闪现错误的登录状态。</div>
</div>
<pre><code class="language-typescript">// AuthProvider 中的 isLoading 实现
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // 初始 true

  useEffect(() => {
    initAuth().finally(() => setIsLoading(false));
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
};

// 正确使用 isLoading
function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;  // 显示加载动画
  }
  
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
</code></pre>
```

## Advanced Techniques

### For Complex Systems
Generate questions at multiple levels:
1. **Component level** (how does this function work?)
2. **Module level** (how do these files interact?)
3. **System level** (how does data flow end-to-end?)

### For Performance Optimization
Focus on:
- **Trade-off understanding** (cache vs fresh data)
- **Bottleneck identification** (where to optimize first)
- **Measurement practices** (how to know if it's better)

### For Security Concepts
Emphasize:
- **Attack vectors** (what could go wrong?)
- **Defense layers** (multiple independent protections)
- **Least privilege** (minimal necessary access)

## Integration with Development Workflow

This skill works well:
- **After code reviews** → Turn review comments into learning questions
- **Before feature handoff** → Verify understanding of new system
- **During onboarding** → Build mental models of architecture
- **In documentation** → Add interactive checks to markdown

## Example Usage Prompt

```
I have this technical dialogue about React Context and authentication. 
Generate 5 multiple-choice questions that help developers understand:

1. Why AuthProvider must wrap the entire app
2. The role of isLoading state
3. Why useCallback is needed for auth methods
4. The difference between isAuthenticated and user !== null
5. How logout works without a server call

Each question should have 3 options, include code snippets, and build mental models about React state management and authentication patterns.
```

## Mental Model Building Phrases

Use these in explanations to reinforce mental models:

- "Think of this as..."
- "The key insight is..."
- "This pattern solves the problem of..."
- "Without this, you would see..."
- "Compare with..."
- "The trade-off here is..."
- "In contrast to..."
- "This works because of how... works"

## Success Metrics

A good question set has been effective when:
- Developers can **predict** how changes will affect the system
- They can **debug** issues by reasoning about design decisions
- They **avoid** common pitfalls without memorizing checklists
- They can **explain** the rationale to other team members