import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';

function HomePage() {
  const [name, setName] = useState('');
  const query = trpc.ping.hello.useQuery(name ? { name } : undefined, {
    refetchOnWindowFocus: false,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
      <h1>Sous Teach</h1>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ada"
          style={{ padding: '0.5rem 0.75rem', fontSize: '1rem' }}
        />
      </label>
      <div style={{ padding: '1rem', borderRadius: 8, background: '#fff', border: '1px solid #cbd5f5' }}>
        {query.isLoading && <span>Loading</span>}
        {query.error && <span>Request failed: {query.error.message}</span>}
        {query.data && <span>{query.data.message}</span>}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
