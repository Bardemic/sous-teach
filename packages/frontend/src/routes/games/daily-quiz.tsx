import { createFileRoute } from '@tanstack/react-router';
import { DailyQuiz } from '../../pages/Games/DailyQuiz/DailyQuiz';

export const Route = createFileRoute('/games/daily-quiz')({
  component: DailyQuiz,
});
