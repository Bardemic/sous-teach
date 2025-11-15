import { Link } from '@tanstack/react-router';

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#0f172a',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
          Sous Teach
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#cbd5f5', fontWeight: 500 }}>
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
