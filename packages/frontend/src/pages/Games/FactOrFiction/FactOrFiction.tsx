import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import styles from './FactOrFiction.module.css';

// Backend Integration Interface
export interface Headline {
  id: string;
  text: string;
  isFact: boolean;
  explanation: string;
  source?: string;
}

export interface FactOrFictionGameData {
  date: string;
  headlines: Headline[];
}

// Mock data - replace with API call
const MOCK_HEADLINES: Headline[] = [
  {
    id: '1',
    text: 'City Council Approves $2 Million Budget for New Public Parks',
    isFact: true,
    explanation: 'This is a fact. The city council voted 7-2 to allocate funds for three new community parks in underserved neighborhoods.',
    source: 'City Council Meeting Minutes, Jan 10, 2024',
  },
  {
    id: '2',
    text: 'U.S. Constitution Requires Presidential Candidates to Be Born on American Soil',
    isFact: false,
    explanation: 'Fiction! The Constitution requires the President to be a "natural born citizen," which can include those born abroad to U.S. citizen parents.',
    source: 'U.S. Constitution, Article II',
  },
  {
    id: '3',
    text: 'Local Mayor Announces Plan to Replace All City Vehicles with Flying Cars by 2025',
    isFact: false,
    explanation: 'Fiction! This is an unrealistic claim. No such technology or plan exists in any municipality.',
  },
  {
    id: '4',
    text: 'State Legislature Passes Bill Requiring Civic Education in High Schools',
    isFact: true,
    explanation: 'Fact! Many states have recently passed legislation requiring civics courses for graduation.',
    source: 'State Education Department',
  },
  {
    id: '5',
    text: 'Supreme Court Can Overturn Federal Laws It Deems Unconstitutional',
    isFact: true,
    explanation: 'Fact! This power, called judicial review, was established in Marbury v. Madison (1803).',
    source: 'Marbury v. Madison, 1803',
  },
  {
    id: '6',
    text: 'Senators Must Resign If They Miss More Than 10 Days of Sessions',
    isFact: false,
    explanation: 'Fiction! There is no such requirement in the Constitution. Senators can miss sessions for various reasons.',
  },
  {
    id: '7',
    text: 'Public Comment Periods Are Required Before New Local Ordinances Take Effect',
    isFact: true,
    explanation: 'Fact! Most jurisdictions require public notice and comment periods for new ordinances to ensure transparency.',
    source: 'Local Government Code',
  },
  {
    id: '8',
    text: 'The Vice President Casts the Tie-Breaking Vote in the Senate',
    isFact: true,
    explanation: 'Fact! Article I, Section 3 of the Constitution gives the Vice President this power.',
    source: 'U.S. Constitution, Article I',
  },
];

type SwipeDirection = 'left' | 'right' | null;

export function FactOrFiction() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastSwipe, setLastSwipe] = useState<SwipeDirection>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // TODO: Replace with API call
  // useEffect(() => {
  //   fetch('/api/games/fact-or-fiction/daily')
  //     .then(r => r.json() as Promise<FactOrFictionGameData>)
  //     .then(data => setHeadlines(data.headlines));
  // }, []);

  const currentHeadline = MOCK_HEADLINES[currentIndex];

  const handleSwipe = (direction: SwipeDirection) => {
    if (!currentHeadline) return;

    const userSaidFact = direction === 'right';
    const isCorrect = userSaidFact === currentHeadline.isFact;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, isCorrect]);
    setLastSwipe(direction);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      if (currentIndex < MOCK_HEADLINES.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setLastSwipe(null);
      } else {
        setGameComplete(true);
      }
    }, 2500);
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setLastSwipe(null);
    setGameComplete(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / MOCK_HEADLINES.length) * 100;
    if (percentage === 100) return 'Perfect! You can spot fake news like a pro!';
    if (percentage >= 80) return 'Excellent! Your media literacy is strong!';
    if (percentage >= 60) return 'Good job! Keep honing your skills!';
    if (percentage >= 40) return 'Not bad! Practice makes perfect!';
    return 'Keep learning! Critical thinking is a skill!';
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <Link to="/games" className={styles.backButton}>
            ← Games
          </Link>
          <div className={styles.gameTitle}>Fact or Fiction</div>
        </div>
      </div>

      <section className={styles.gameSection}>
        <div className={styles.gameContainer}>
          {!gameComplete ? (
            <>
              <div className={styles.instructions}>
                <h2 className={styles.instructionsTitle}>Swipe to Decide!</h2>
                <p className={styles.instructionsText}>
                  Swipe LEFT for Fiction • Swipe RIGHT for Fact
                </p>
              </div>

              <div className={styles.progressBar}>
                <div className={styles.progressHeader}>
                  <span className={styles.questionNumber}>
                    {currentIndex + 1} of {MOCK_HEADLINES.length}
                  </span>
                  <span className={styles.scoreDisplay}>
                    Score: {score}/{MOCK_HEADLINES.length}
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / MOCK_HEADLINES.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className={styles.cardContainer}>
                <div className={styles.swipeIndicators}>
                  <div className={`${styles.indicator} ${styles.fictionIndicator}`}>
                    FICTION
                  </div>
                  <div className={`${styles.indicator} ${styles.factIndicator}`}>
                    FACT
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!showResult && currentHeadline && (
                    <motion.div
                      key={currentHeadline.id}
                      className={styles.card}
                      style={{ x, rotate, opacity }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={handleDragEnd}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className={styles.headlineText}>{currentHeadline.text}</h3>
                      <p className={styles.dragHint}>Drag or tap buttons below</p>
                    </motion.div>
                  )}

                  {showResult && currentHeadline && (
                    <motion.div
                      key={`result-${currentHeadline.id}`}
                      className={`${styles.resultCard} ${
                        answers[answers.length - 1] ? styles.correct : styles.incorrect
                      }`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <div className={styles.resultBadge}>
                        {answers[answers.length - 1] ? 'Correct!' : 'Wrong!'}
                      </div>
                      <div className={styles.correctAnswer}>
                        This headline is {currentHeadline.isFact ? 'FACT' : 'FICTION'}
                      </div>
                      <p className={styles.explanation}>{currentHeadline.explanation}</p>
                      {currentHeadline.source && (
                        <p className={styles.source}>Source: {currentHeadline.source}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!showResult && (
                <div className={styles.swipeButtons}>
                  <motion.button
                    className={`${styles.swipeButton} ${styles.fictionButton}`}
                    onClick={() => handleSwipe('left')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Fiction
                  </motion.button>
                  <motion.button
                    className={`${styles.swipeButton} ${styles.factButton}`}
                    onClick={() => handleSwipe('right')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Fact
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              className={styles.resultsContainer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.resultsBox}>
                <h2 className={styles.resultsHeadline}>Game Complete!</h2>
                <motion.div
                  className={styles.scoreCircle}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className={styles.scoreNumber}>
                    {score}/{MOCK_HEADLINES.length}
                  </div>
                  <div className={styles.scorePercentage}>
                    {Math.round((score / MOCK_HEADLINES.length) * 100)}%
                  </div>
                </motion.div>
                <p className={styles.scoreMessage}>{getScoreMessage()}</p>

                <div className={styles.resultsActions}>
                  <button className={styles.actionButton} onClick={handleRestart}>
                    Play Again
                  </button>
                  <Link to="/games" className={styles.actionButton}>
                    Back to Games
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
