import { createFileRoute } from '@tanstack/react-router';
import { NewsletterConfirm } from '../../pages/Newsletter/Confirm';

export const Route = createFileRoute('/newsletter/confirm')({
  component: NewsletterConfirm,
});
