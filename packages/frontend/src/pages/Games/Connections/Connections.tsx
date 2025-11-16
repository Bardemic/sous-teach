import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Connections.module.css';

// Backend Integration Interface
export interface ConnectionGroup {
  category: string;
  words: string[];
  difficulty: 1 | 2 | 3 | 4; // 1 = easiest, 4 = hardest
  color: string;
}

export interface ConnectionsGameData {
  date: string;
  groups: ConnectionGroup[];
}

// Mock data - replace with API call
const MOCK_GAME: ConnectionsGameData = {
  date: '2024-01-15',
  groups: [
    {
      category: 'Types of Elections',
      words: ['PRIMARY', 'GENERAL', 'RUNOFF', 'SPECIAL'],
      difficulty: 1,
      color: '#f9df6d',
    },
    {
      category: 'Local Government Officials',
      words: ['MAYOR', 'COUNCILOR', 'ALDERMAN', 'SUPERVISOR'],
      difficulty: 2,
      color: '#a0c35a',
    },
    {
      category: 'Parts of the Constitution',
      words: ['PREAMBLE', 'ARTICLE', 'AMENDMENT', 'CLAUSE'],
      difficulty: 3,
      color: '#b0c4ef',
    },
    {
      category: 'Voting Methods',
      words: ['BALLOT', 'ABSENTEE', 'EARLY', 'PROVISIONAL'],
      difficulty: 4,
      color: '#ba81c5',
    },
  ],
};

type GameState = 'playing' | 'won' | 'lost';

export function Connections() {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const MAX_MISTAKES = 4;

  // Initialize game
  useEffect(() => {
    // TODO: Replace with API call
    // fetch('/api/games/connections/daily')
    //   .then(r => r.json() as Promise<ConnectionsGameData>)
    //   .then(data => {
    //     const allWords = data.groups.flatMap(g => g.words);
    //     setShuffledWords(shuffleArray(allWords));
    //   });

    const allWords = MOCK_GAME.groups.flatMap((g) => g.words);
    setShuffledWords(shuffleArray(allWords));
  }, []);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleWordClick = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length !== 4) return;

    // Check if selection matches any unsolved group
    const matchedGroup = MOCK_GAME.groups.find((group) => {
      if (solvedGroups.includes(group)) return false;
      const groupWords = new Set(group.words);
      return selectedWords.every((word) => groupWords.has(word));
    });

    if (matchedGroup) {
      // Correct guess!
      const newSolvedGroups = [...solvedGroups, matchedGroup];
      setSolvedGroups(newSolvedGroups);
      setSelectedWords([]);

      // Remove solved words from shuffled array
      setShuffledWords(shuffledWords.filter((w) => !matchedGroup.words.includes(w)));

      // Check win condition
      if (newSolvedGroups.length === MOCK_GAME.groups.length) {
        setGameState('won');
      }
    } else {
      // Wrong guess
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);

      if (newMistakes >= MAX_MISTAKES) {
        setGameState('lost');
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedWords([]);
  };

  const handleShuffle = () => {
    setShuffledWords(shuffleArray(shuffledWords));
  };

  const handleRestart = () => {
    const allWords = MOCK_GAME.groups.flatMap((g) => g.words);
    setShuffledWords(shuffleArray(allWords));
    setSelectedWords([]);
    setSolvedGroups([]);
    setMistakes(0);
    setGameState('playing');
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
          <div className={styles.gameTitle}>Civic Connections</div>
        </div>
      </div>

      <section className={styles.gameSection}>
        <div className={styles.gameContainer}>
          <div className={styles.instructions}>
            <h2 className={styles.instructionsTitle}>Find groups of four!</h2>
            <p className={styles.instructionsText}>
              Select four words that share a common theme or category.
            </p>
          </div>

          {/* Solved Groups */}
          <div className={styles.solvedGroups}>
            <AnimatePresence>
              {solvedGroups
                .sort((a, b) => a.difficulty - b.difficulty)
                .map((group, index) => (
                  <motion.div
                    key={group.category}
                    className={styles.solvedGroup}
                    style={{ backgroundColor: group.color }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className={styles.solvedCategory}>{group.category}</div>
                    <div className={styles.solvedWords}>{group.words.join(', ')}</div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Word Grid */}
          {gameState === 'playing' && (
            <motion.div
              className={`${styles.wordsGrid} ${shakeAnimation ? styles.shake : ''}`}
            >
              {shuffledWords.map((word, index) => {
                const isSelected = selectedWords.includes(word);
                return (
                  <motion.button
                    key={`${word}-${index}`}
                    className={`${styles.wordButton} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleWordClick(word)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {word}
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* Mistakes Counter */}
          <div className={styles.mistakesBar}>
            <span className={styles.mistakesLabel}>Mistakes remaining:</span>
            <div className={styles.mistakesDots}>
              {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.mistakeDot} ${i < MAX_MISTAKES - mistakes ? styles.active : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {gameState === 'playing' && (
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={handleShuffle}
                disabled={shuffledWords.length === 0}
              >
                Shuffle
              </button>
              <button className={styles.actionButton} onClick={handleDeselectAll}>
                Deselect All
              </button>
              <button
                className={`${styles.actionButton} ${styles.submitButton}`}
                onClick={handleSubmit}
                disabled={selectedWords.length !== 4}
              >
                Submit
              </button>
            </div>
          )}

          {/* Game Over */}
          <AnimatePresence>
            {(gameState === 'won' || gameState === 'lost') && (
              <motion.div
                className={styles.gameOverBox}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <h2 className={styles.gameOverTitle}>
                  {gameState === 'won' ? 'Congratulations!' : 'Better luck next time!'}
                </h2>
                <p className={styles.gameOverText}>
                  {gameState === 'won'
                    ? `You solved all groups with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}!`
                    : 'You ran out of guesses. Here were the groups:'}
                </p>

                {gameState === 'lost' && (
                  <div className={styles.answerGroups}>
                    {MOCK_GAME.groups
                      .filter((g) => !solvedGroups.includes(g))
                      .map((group) => (
                        <div
                          key={group.category}
                          className={styles.answerGroup}
                          style={{ backgroundColor: group.color }}
                        >
                          <div className={styles.answerCategory}>{group.category}</div>
                          <div className={styles.answerWords}>{group.words.join(', ')}</div>
                        </div>
                      ))}
                  </div>
                )}

                <div className={styles.gameOverActions}>
                  <button className={styles.actionButton} onClick={handleRestart}>
                    Play Again
                  </button>
                  <Link to="/games" className={styles.actionButton}>
                    Back to Games
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}
