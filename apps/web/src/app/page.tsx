import { User } from '@jianshu/shared';

export default function Home() {
  const user: User = {
    id: '1',
    email: 'user@example.com',
    name: 'Demo User',
    username: 'demo_user',
    createdAt: new Date(),
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome to Jianshu</h1>
      <p>This is a pnpm monorepo with Next.js and Nest.js</p>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Shared Types Demo</h2>
        <p><strong>User:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
    </main>
  );
}
