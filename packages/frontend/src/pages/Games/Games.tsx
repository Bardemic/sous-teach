import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styles from './Games.module.css';

const GAMES = [
  {
    id: 'daily-quiz',
    title: 'Daily Civic Quiz',
    description: 'Test your knowledge with daily trivia about government, civics, and current issues.',
    color: '#8b4513',
    path: '/games/daily-quiz',
  },
  {
    id: 'civic-connections',
    title: 'Civic Connections',
    description: 'Group 16 civic terms into 4 hidden categories. Can you find all the connections?',
    color: '#1a5490',
    path: '/games/connections',
  },
  {
    id: 'fact-or-fiction',
    title: 'Fact or Fiction',
    description: 'Swipe to identify real vs. fake civic news headlines. Train your media literacy!',
    color: '#8b0000',
    path: '/games/fact-or-fiction',
  },
];

export function Games() {
  const routerState = useRouterState();
  const isLandingPage = routerState.location.pathname === '/games';

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isLandingPage && (
        <div className={styles.masthead}>
          <div className={styles.mastheadTop}>
            <Link to="/" className={styles.backButton}>
              ← Home
            </Link>
            <div className={styles.date}>{dateString}</div>
          </div>

          <div className={styles.pageTitle}>
            <h1 className={styles.mainHeadline}>The Civic Arcade</h1>
            <p className={styles.subheadline}>Daily Games for Engaged Citizens</p>
          </div>
        </div>
      )}

      {isLandingPage ? (
        <section className={styles.gamesSection}>
          <div className={styles.introBox}>
            <div className={styles.introLabel}>Today's Challenge</div>
            <h2 className={styles.introHeadline}>Play. Learn. Engage.</h2>
            <p className={styles.introText}>
              Sharpen your civic knowledge with daily games designed to inform and entertain.
              Each game teaches you something new about government, current events, and how to be an informed citizen.
            </p>
          </div>

          <motion.div
            className={styles.gamesGrid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {GAMES.map((game) => (
              <motion.div key={game.id} variants={cardVariants}>
                <Link to={game.path} className={styles.gameCard}>
                  <h3 className={styles.gameTitle} style={{ color: game.color }}>{game.title}</h3>
                  <p className={styles.gameDescription}>{game.description}</p>
                  <div className={styles.playButton} style={{ borderColor: game.color, color: game.color }}>
                    Play Now →
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      ) : (
        <Outlet />
      )}
    </motion.div>
  );
}
