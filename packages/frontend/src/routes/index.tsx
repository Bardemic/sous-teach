import { FormEvent, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import { SearchForm } from '../components/SearchForm/SearchForm';
import { OpportunityCard } from '../components/OpportunityCard/OpportunityCard';

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

      <SearchForm
        city={city}
        state={state}
        country={country}
        focus={focus}
        disabled={disabled}
        isPending={search.isPending}
        onCityChange={setCity}
        onStateChange={setState}
        onCountryChange={setCountry}
        onFocusChange={setFocus}
        onSubmit={handleSubmit}
      />

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {search.data.opportunities.map((item) => (
              <OpportunityCard
                key={`${item.title}-${item.url || item.title}`}
                title={item.title}
                organization={item.organization}
                url={item.url}
                date={item.date}
                location={item.location}
                focus={item.focus}
                description={item.description}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
