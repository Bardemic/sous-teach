import { useState, FormEvent } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { trpc } from '../../lib/trpc';
import styles from './HomeNew.module.css';

export function HomeNew() {
  const [zip, setZip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const trpcUtils = trpc.useUtils();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedZip = zip.trim();

    if (trimmedZip.length !== 5) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const locationData = await trpcUtils.community.zipLookup.fetch({ zipCode: trimmedZip });

      navigate({
        to: '/civic',
        search: {
          zip: trimmedZip,
          city: locationData.city,
          state: locationData.state,
          county: locationData.county,
        }
      });
    } catch (err) {
      setError('Unable to find city for this ZIP code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setZip('02139');
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await trpcUtils.community.zipLookup.fetch({ zipCode: '02139' });

      navigate({
        to: '/civic',
        search: {
          zip: '02139',
          city: locationData.city,
          state: locationData.state,
          county: locationData.county,
        }
      });
    } catch (err) {
      setError('Unable to load demo. Please try again.');
      setIsLoading(false);
    }
  };

  const isValid = zip.trim().length === 5 && !isLoading;

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <div className={styles.established}>Est. 2025</div>
          <div className={styles.price}>FREE</div>
        </div>

        <div className={styles.title}>
          <h1 className={styles.mainTitle}>
            THE CIVIC GAZETTE
          </h1>
          <p className={styles.tagline}>
            Your Local Community News, Simplified
          </p>
        </div>

        <div className={styles.mastheadBottom}>
          <div className={styles.dateInfo}>{dateString}</div>
          <div>SPECIAL EDITION</div>
        </div>
      </div>

      <div className={styles.hero}>
        <motion.h2
          className={styles.heroHeadline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Local Civic Information<br />Now at Your Fingertips
        </motion.h2>

        <motion.p
          className={styles.heroSubhead}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Enter your ZIP code below to receive instant updates on what's happening in your community
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={styles.searchBox}>
            <div className={styles.searchLabel}>Enter Your ZIP Code</div>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
              <input
                type="text"
                className={styles.zipInput}
                placeholder="00000"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                autoFocus
                disabled={isLoading}
              />

              {error && (
                <div style={{ color: '#d32f2f', fontSize: '14px', marginTop: '8px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!isValid}
              >
                {isLoading ? 'Looking up...' : 'Get My Community Report'}
              </button>

              <button
                type="button"
                className={styles.demoButton}
                onClick={handleDemo}
                disabled={isLoading}
              >
                Try with demo ZIP code (02139)
              </button>
            </form>
          </div>
        </motion.div>

        <div className={styles.decorativeLine}></div>

        <motion.div
          className={styles.gamesPromo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className={styles.gamesHeadline}>The Civic Arcade</h3>
          <p className={styles.gamesText}>
            Learn about civics, government, and current events through fun, engaging daily games!
          </p>
          <Link to="/games" className={styles.gamesButton}>
            Play Games →
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
