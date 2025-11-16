import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DailyQuiz.module.css';

// Backend Integration Interface
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  category: 'local' | 'state' | 'federal' | 'civics';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResponse {
  date: string;
  questions: QuizQuestion[];
}

// Mock data - replace with API call
const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question: 'How many years does a U.S. Senator serve in one term?',
    options: ['2 years', '4 years', '6 years', '8 years'],
    correctAnswer: 2,
    explanation: 'U.S. Senators serve 6-year terms, with approximately one-third of the Senate up for election every 2 years.',
    category: 'federal',
    difficulty: 'easy',
  },
  {
    id: '2',
    question: 'What is the minimum age requirement to serve as President of the United States?',
    options: ['25 years old', '30 years old', '35 years old', '40 years old'],
    correctAnswer: 2,
    explanation: 'According to Article II of the Constitution, the President must be at least 35 years old.',
    category: 'federal',
    difficulty: 'easy',
  },
  {
    id: '3',
    question: 'Which amendment to the U.S. Constitution granted women the right to vote?',
    options: ['15th Amendment', '17th Amendment', '19th Amendment', '21st Amendment'],
    correctAnswer: 2,
    explanation: 'The 19th Amendment, ratified in 1920, prohibited denying the right to vote based on sex.',
    category: 'civics',
    difficulty: 'medium',
  },
  {
    id: '4',
    question: 'What is the term for a legislative tactic where a senator speaks for an extended time to delay a vote?',
    options: ['Cloture', 'Filibuster', 'Gerrymander', 'Caucus'],
    correctAnswer: 1,
    explanation: 'A filibuster is a prolonged speech that obstructs progress in a legislative assembly.',
    category: 'federal',
    difficulty: 'medium',
  },
  {
    id: '5',
    question: 'How many justices currently serve on the U.S. Supreme Court?',
    options: ['7', '9', '11', '12'],
    correctAnswer: 1,
    explanation: 'The Supreme Court has consisted of nine justices since 1869.',
    category: 'federal',
    difficulty: 'easy',
  },
];

type GameState = 'playing' | 'results';

export function DailyQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(
    new Array(MOCK_QUESTIONS.length).fill(false)
  );
  const [gameState, setGameState] = useState<GameState>('playing');
  const [showExplanation, setShowExplanation] = useState(false);

  // TODO: Replace with real API call
  // useEffect(() => {
  //   fetch('/api/quiz/daily')
  //     .then(r => r.json() as Promise<QuizResponse>)
  //     .then(data => setQuestions(data.questions));
  // }, []);

  const question = MOCK_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === MOCK_QUESTIONS.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (answeredQuestions[currentQuestion]) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestion] = true;
    setAnsweredQuestions(newAnswered);

    if (answerIndex === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setGameState('results');
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredQuestions(new Array(MOCK_QUESTIONS.length).fill(false));
    setGameState('playing');
    setShowExplanation(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / MOCK_QUESTIONS.length) * 100;
    if (percentage === 100) return 'Perfect! You\'re a civic genius!';
    if (percentage >= 80) return 'Excellent! You know your civics!';
    if (percentage >= 60) return 'Good job! Keep learning!';
    if (percentage >= 40) return 'Not bad! Room for improvement!';
    return 'Keep studying! You\'ll get better!';
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
          <div className={styles.gameTitle}>Daily Civic Quiz</div>
        </div>
      </div>

      <section className={styles.gameSection}>
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={styles.quizContainer}
            >
              <div className={styles.progressBar}>
                <div className={styles.progressHeader}>
                  <span className={styles.questionNumber}>
                    Question {currentQuestion + 1} of {MOCK_QUESTIONS.length}
                  </span>
                  <span className={styles.scoreDisplay}>
                    Score: {score}/{MOCK_QUESTIONS.length}
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / MOCK_QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <motion.div
                className={styles.questionBox}
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.categoryBadge}>
                  {question.category} • {question.difficulty}
                </div>
                <h2 className={styles.questionText}>{question.question}</h2>

                <div className={styles.optionsGrid}>
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === question.correctAnswer;
                    const showStatus = answeredQuestions[currentQuestion];

                    let statusClass = '';
                    if (showStatus) {
                      if (isCorrect) statusClass = styles.correct;
                      else if (isSelected) statusClass = styles.incorrect;
                    }

                    return (
                      <motion.button
                        key={index}
                        className={`${styles.optionButton} ${statusClass}`}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={answeredQuestions[currentQuestion]}
                        whileHover={{ scale: answeredQuestions[currentQuestion] ? 1 : 1.02 }}
                        whileTap={{ scale: answeredQuestions[currentQuestion] ? 1 : 0.98 }}
                      >
                        <span className={styles.optionLetter}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className={styles.optionText}>{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      className={styles.explanation}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.explanationLabel}>
                        {selectedAnswer === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                      </div>
                      <p className={styles.explanationText}>{question.explanation}</p>
                      <button className={styles.nextButton} onClick={handleNext}>
                        {isLastQuestion ? 'See Results' : 'Next Question'} →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.resultsContainer}
            >
              <div className={styles.resultsBox}>
                <h2 className={styles.resultsHeadline}>Quiz Complete!</h2>
                <motion.div
                  className={styles.scoreCircle}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className={styles.scoreNumber}>
                    {score}/{MOCK_QUESTIONS.length}
                  </div>
                  <div className={styles.scorePercentage}>
                    {Math.round((score / MOCK_QUESTIONS.length) * 100)}%
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
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
