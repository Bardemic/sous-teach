import { FormEvent, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';

type FocusFilter = 'all' | 'volunteer' | 'nonprofit' | 'donation';

function HomePage() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');
  const [focus, setFocus] = useState<FocusFilter>('all');

  const search = trpc.community.search.useMutation();

  const disabled = useMemo(
    () => !city.trim() || !state.trim() || !country.trim() || search.isPending,
    [city, state, country, search.isPending],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;

    search.mutate({
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      focus: focus === 'all' ? undefined : focus,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        padding: '2rem 1.5rem 3rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Community opportunities</h1>
        <p style={{ color: '#4c566a', lineHeight: 1.5 }}>
          Drop in your location and we&apos;ll ask Exa-powered OpenRouter search to scout nonprofits, volunteer shifts,
          donation drives, and civic events that match your focus.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          padding: '1rem',
          borderRadius: 12,
          background: '#fff',
          border: '1px solid #e2e8f0',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>City</span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Austin"
            required
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>State / region</span>
          <input
            value={state}
            onChange={(event) => setState(event.target.value)}
            placeholder="Texas"
            required
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Country</span>
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="United States"
            required
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Focus</span>
          <select
            value={focus}
            onChange={(event) => setFocus(event.target.value as FocusFilter)}
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
          >
            <option value="all">All civic actions</option>
            <option value="volunteer">Volunteer shifts</option>
            <option value="nonprofit">Nonprofits to support</option>
            <option value="donation">Donation drives</option>
          </select>
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="submit"
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 8,
              border: 'none',
              background: disabled ? '#94a3b8' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {search.isPending ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {search.error && (
          <div
            style={{
              border: '1px solid #fecaca',
              background: '#fef2f2',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              color: '#b91c1c',
            }}
          >
            Failed to load opportunities: {search.error.message}
          </div>
        )}

        {search.data && (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #cbd5f5',
                background: '#fff',
              }}
            >
              <strong>Showing leads for {search.data.meta.location}</strong>
              <span style={{ color: '#64748b' }}>
                Model {search.data.meta.model} · Focus {search.data.meta.focus} · Generated{' '}
                {new Date(search.data.meta.generatedAt).toLocaleTimeString()}
              </span>
              {search.data.summary && <p style={{ marginTop: '0.35rem' }}>{search.data.summary}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {search.data.opportunities.map((item) => (
                <article
                  key={`${item.title}-${item.url}`}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '1rem 1.25rem',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.title}</span>
                    <span style={{ color: '#475569', fontSize: '0.95rem' }}>
                      {item.organization ?? 'Independent effort'}
                      {item.category ? ` • ${item.category}` : ''}
                    </span>
                  </div>
                  <p style={{ color: '#1f2937', lineHeight: 1.5 }}>{item.summary}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.9rem' }}>
                    {item.tags?.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 999,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {item.nextSteps && (
                      <span style={{ color: '#0f172a' }}>
                        <strong>Next steps:</strong> {item.nextSteps}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                      View details ↗
                    </a>
                    {item.contact && <span style={{ color: '#475569' }}>{item.contact}</span>}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
