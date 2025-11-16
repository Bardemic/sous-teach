import { FormEvent, useMemo, useState } from 'react';
import { trpc } from '../../lib/trpc';
import { SearchForm } from '../../components/SearchForm/SearchForm';
import { OpportunityCard } from '../../components/OpportunityCard/OpportunityCard';
import styles from './Home.module.css';

type FocusFilter = 'all' | 'volunteer' | 'nonprofit' | 'donation';

export function Home() {
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
    <div className={styles.container}>

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

      <div className={styles.results}>
        {search.error && (
          <div className={styles.error}>
            Failed to load opportunities: {search.error.message}
          </div>
        )}

        {search.data && (
          <div className={styles.opportunitiesList}>
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

