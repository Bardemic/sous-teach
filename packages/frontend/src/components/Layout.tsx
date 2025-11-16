import { PropsWithChildren } from 'react';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );
}
