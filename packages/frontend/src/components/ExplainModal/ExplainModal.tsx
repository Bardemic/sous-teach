import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ExplainModal.module.css';

export interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  billTitle: string;
  billSummary: string;
}

export function ExplainModal({
  isOpen,
  onClose,
  billTitle,
  billSummary,
}: ExplainModalProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Simulate AI explanation (you can replace this with actual API call later)
      setIsExplaining(true);
      setTimeout(() => {
        setExplanation(
          `Here's a simpler explanation:\n\n${billSummary}\n\nThis bill could affect your community by changing local policies and regulations. You can contact your representatives to share your thoughts on this issue.`
        );
        setIsExplaining(false);
      }, 1000);
    } else {
      setExplanation('');
      setIsExplaining(false);
    }
  }, [isOpen, billSummary]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Explain Simpler</h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                type="button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <h3 className={styles.billTitle}>{billTitle}</h3>

              {isExplaining ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <p>Generating simpler explanation...</p>
                </div>
              ) : (
                <div className={styles.explanation}>
                  {explanation.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.closeButtonSecondary}
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
