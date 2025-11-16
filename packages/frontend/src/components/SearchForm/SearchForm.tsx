import { FormEvent } from 'react';
import styles from './SearchForm.module.css';

type FocusFilter = 'all' | 'volunteer' | 'nonprofit' | 'donation';

interface SearchFormProps {
  city: string;
  state: string;
  country: string;
  focus: FocusFilter;
  disabled: boolean;
  isPending: boolean;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onFocusChange: (value: FocusFilter) => void;
  onSubmit: (event: FormEvent) => void;
}

export function SearchForm({
  city,
  state,
  country,
  focus,
  disabled,
  isPending,
  onCityChange,
  onStateChange,
  onCountryChange,
  onFocusChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <label className={styles.label}>
        <span className={styles.labelText}>City</span>
        <input
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          placeholder="Austin"
          required
          className={styles.input}
        />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>State / region</span>
        <input
          value={state}
          onChange={(event) => onStateChange(event.target.value)}
          placeholder="Texas"
          required
          className={styles.input}
        />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Country</span>
        <input
          value={country}
          onChange={(event) => onCountryChange(event.target.value)}
          placeholder="United States"
          required
          className={styles.input}
        />
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Focus</span>
        <select
          value={focus}
          onChange={(event) => onFocusChange(event.target.value as FocusFilter)}
          className={styles.select}
        >
          <option value="all">All civic actions</option>
          <option value="volunteer">Volunteer shifts</option>
          <option value="nonprofit">Nonprofits to support</option>
          <option value="donation">Donation drives</option>
        </select>
      </label>
      <div className={styles.buttonContainer}>
        <button type="submit" disabled={disabled} className={styles.button}>
          {isPending ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  );
}

