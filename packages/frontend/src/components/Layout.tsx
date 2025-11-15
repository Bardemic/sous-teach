import { PropsWithChildren } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
