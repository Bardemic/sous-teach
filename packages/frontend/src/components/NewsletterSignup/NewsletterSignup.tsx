import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import styles from './NewsletterSignup.module.css';

interface NewsletterSignupProps {
  zipCode?: string;
  city?: string;
  state?: string;
}

export function NewsletterSignup({ zipCode, city, state }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate: subscribe, isPending } = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setStatus('success');
      setEmail('');
      setErrorMessage('');
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to subscribe. Please try again.');
    },
  });

  const locationText = zipCode 
    ? `ZIP ${zipCode}${city && state ? ` (${city}, ${state})` : ''}`
    : 'your area';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('idle');
    setErrorMessage('');
    
    subscribe({
      email,
      zipCode,
      city,
      state,
    });
  };

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <h2 className={styles.title}>Stay Informed</h2>
            <p className={styles.description}>
              Subscribe to get the latest civic updates, community opportunities, 
              and local news delivered to your inbox for {locationText}.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={styles.input}
                disabled={isPending || status === 'success'}
                required
              />
              <button
                type="submit"
                className={styles.button}
                disabled={isPending || status === 'success'}
              >
                {isPending ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
              </button>
            </div>

            {status === 'success' && (
              <p className={styles.successMessage}>
                Thanks for subscribing! Check your inbox for confirmation.
              </p>
            )}

            {status === 'error' && (
              <p className={styles.errorMessage}>
                {errorMessage}
              </p>
            )}
          </form>

          <p className={styles.disclaimer}>
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

