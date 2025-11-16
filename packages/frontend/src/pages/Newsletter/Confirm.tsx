import { useEffect, useState } from 'react';
import { useSearch, Link } from '@tanstack/react-router';
import { trpc } from '../../lib/trpc';
import styles from './Confirm.module.css';

export function NewsletterConfirm() {
  const search = useSearch({ strict: false }) as { token?: string };
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const { mutate: confirm } = trpc.newsletter.confirm.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message || 'Failed to confirm subscription');
    },
  });

  useEffect(() => {
    const token = search.token;
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link');
      return;
    }

    confirm({ token });
  }, [search.token, confirm]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Newsletter Confirmation</h1>
          </div>

          {status === 'loading' && (
            <div className={styles.message}>
              <p>Confirming your subscription...</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.success}>
              <h2 className={styles.successTitle}>Subscription Confirmed!</h2>
              <p className={styles.successMessage}>{message}</p>
              <p className={styles.successSubtext}>
                You'll now receive civic updates and community news in your inbox.
              </p>
              <Link to="/" className={styles.button}>
                Return to Home
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.error}>
              <h2 className={styles.errorTitle}>Confirmation Failed</h2>
              <p className={styles.errorMessage}>{message}</p>
              <Link to="/" className={styles.button}>
                Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

