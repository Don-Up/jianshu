---
name: code-change-report
description: Generate a comprehensive code change summary report after feature development.
---

Use English as the default language.

### 第一部分: 概述

简要描述此次开发和改动的内容(300字以内)。

### 第二部分: 改动文件清单

1. 文件结构: 提供项目文件树，在修改和新增的文件名后面添加(修改)和(新增)标识，方便开发者快速了解改动范围，对于文件树中未改动的叶子节点可以省略。
2. 新增文件: 表格，第一列是文件路径，第二列是功能类别，第三列是说明，文件路径的文件名部分使用``包裹，父级目录使用****包裹，例如apps/api/src/**collections**/`collections.module.ts`。
3. 修改文件: 表格，第一列是文件路径，第二列是功能类别，第三列是改动说明。
4. mermaid类图: 包含了新增文件和修改文件的类图，帮助开发者快速了解代码结构和类之间的关系。
5. API Reference: 分别为类图中的类列出新增或修改的APIh或API端点以及其它与功能实现相关的API，参考格式如下:

## API Reference

### **API1**: AnalyticsService

#### **Prop**: id: String

Get article ID, e.g., "clx1234".

#### **Method**: getArticleAnalytics(slug): ArticleAnalytics

Get single article stats.

| Params | Type | Desc | Example |
|-----------|----------|-------------|-------------|
| slug | String | Article slug | "my-post" |


##### **Return**: ArticleAnalytics

// 备注: 
// 如果属性(Prop)或方法(Method)返回值是一个基本类型，则直接返回示例示例数据即可，例如123, true, null, "name"等
// 如果属性(Prop)或方法(Method)返回值是对象类型，则json片段的格式进行返回，例如:

```json
{
  "success": true,                 // 请求是否成功
  "data": {
    "id": "clx1234",               // 文章唯一标识
    "title": "My First Post",      // 文章标题
    "slug": "my-post",             // URL友好slug
    "stats": {                     // 统计信息
      "likes": 42,                 // 点赞数
      "comments": 8,               // 评论数
      "reads": 1234,               // 阅读数
      "shares": 5,                 // 分享总数
      "sharesByPlatform": {        // 各平台分享数
        "twitter": 3,              // Twitter分享次数
        "facebook": 2              // Facebook分享次数
      }
    },
    "author": {                    // 作者信息
      "id": "clx5678",             // 作者ID
      "username": "john",          // 作者用户名
      "name": "John Doe"           // 作者显示名
    },
    "createdAt": "2024-01-15T10:30:00.000Z", // 文章创建时间
    "updatedAt": "2024-01-20T14:22:00.000Z"  // 文章更新时间
  }
}
```

#### **Method**: getUserAnalytics(username): UserAnalytics

Get author total stats.

| Params | Type | Desc | Example |
|-----------|----------|-------------|-------------|
| username | String | Author username | "john" |

##### **Return** UserAnalytics

```json
{
  "success": true,           // 请求是否成功
  "data": {
    "user": {                // 用户基本信息
      "id": "clx5678",       // 用户唯一标识
      "username": "john"     // 用户名
    },
    "stats": {               // 聚合统计
      "articlesCount": 10,   // 文章总数
      "totalLikes": 542,     // 所有文章累计点赞
      "totalComments": 87,   // 所有文章累计评论
      "totalReads": 15890,   // 所有文章累计阅读
      "followersCount": 256, // 粉丝数
      "followingCount": 42   // 关注数
    }
  }
}
```

### **API2**: AnalyticsController

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/articles/:slug/analytics` | GET | No | Article stats |
| `/api/v1/users/:username/analytics` | GET | No | Author stats |


### 第三部分: 详细改动说明
以"文件名[修改/新增](文件相对路径)"为标题，将每个新增/改动的文件的关键代码贴出来(首行添加文件名注释)，并以列表的格式给出说明。

### 第四部分: 测试方法

提供测试用例，包含手动测试流程，让开发者自己操作并验证新功能涉及到的核心流程。

包含1个"前提条件"(可选)，若干"测试序号: 测试名称"。每个测试包含操作步骤和预期结果。

### 其它
以上四部分是必须要有的，你可以根据实际情况来自由灵活地添加其它部分来丰富报告内容和帮助开发者构建项目心智模型，例如"Memmaid图表总结"(使用常用图标，例如时序图，流程图，类图等)、"功能表单"、"流程说明"、"设计亮点"、"UI演示"、"注意事项"、"安全性考虑"等等，这完全由你自己自由发挥，如果没有必要也可以不添加，不要强行添加低价值的内容导致报告太冗长。