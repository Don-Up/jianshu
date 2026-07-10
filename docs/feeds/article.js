/**
 * Script to insert 20 articles with random titles and content into the database.
 *
 * Usage:
 *   node docs/feeds/article.js
 *
 * Prerequisites:
 *   - Database must be running
 *   - Prisma must be generated (pnpm --filter @jianshu/api prisma generate)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample words for generating random titles and content
const adjectives = ['精彩', '有趣', '深刻', '独特', '优美', '感人', '犀利', '温暖', '清新', '迷人'];
const nouns = ['人生', '世界', '时光', '梦想', '爱情', '友情', '生活', '记忆', '成长', '自然'];
const topics = ['关于', '探索', '分享', '思考', '感悟', '记录', '讲述', '描写', '分析', '评论'];
const verbs = ['是', '在于', '属于', '开始', '发现', '创造', '追求', '珍惜', '面对', '拥抱'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle() {
  return `${randomItem(adjectives)}${randomItem(nouns)}${randomItem(topics)}：${randomItem(verbs)}${randomItem(nouns)}的${randomItem(nouns)}`;
}

function generateContent() {
  const paragraphs = [];
  const count = 5 + Math.floor(Math.random() * 6); // 5-10 paragraphs

  for (let i = 0; i < count; i++) {
    const sentences = [];
    const sentenceCount = 3 + Math.floor(Math.random() * 5); // 3-7 sentences per paragraph

    for (let j = 0; j < sentenceCount; j++) {
      const words = [];
      const wordCount = 10 + Math.floor(Math.random() * 15); // 10-25 words per sentence

      for (let k = 0; k < wordCount; k++) {
        words.push(randomItem([...adjectives, ...nouns, ...topics, ...verbs]));
      }

      sentences.push(words.join(''));
    }

    paragraphs.push(sentences.join('。') + '。');
  }

  return paragraphs.join('\n\n');
}

function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

async function main() {
  console.log('🚀 Starting article seed...\n');

  // Get specific user by email
  const user = await prisma.user.findUnique({
    where: { email: 'test@test.com' },
  });

  if (!user) {
    console.error('❌ User with email test@test.com not found.');
    process.exit(1);
  }

  console.log(`📝 Using author: ${user.name} (${user.username})\n`);

  const articles = [];

  for (let i = 0; i < 20; i++) {
    const title = generateTitle();
    const content = generateContent();
    const slug = generateSlug(title);
    const excerpt = content.substring(0, 100) + '...';

    articles.push({
      title,
      slug,
      content,
      excerpt,
      coverImage: null,
      likeCount: Math.floor(Math.random() * 100),
      commentCount: Math.floor(Math.random() * 20),
      readCount: Math.floor(Math.random() * 500),
      published: true,
      authorId: user.id,
    });
  }

  console.log('📄 Creating 20 articles...\n');

  for (const article of articles) {
    await prisma.article.create({
      data: article,
    });
    console.log(`  ✅ Created: ${article.title.substring(0, 30)}...`);
  }

  console.log('\n✨ Successfully created 20 articles!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
