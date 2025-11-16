import { motion } from 'framer-motion';
import styles from './IssueCard.module.css';

export interface IssueCardProps {
  title: string;
  summary: string;
  category: 'housing' | 'transit' | 'safety' | 'construction' | 'campus' | 'misc';
  impact: 'low' | 'medium' | 'high';
  onExplainSimpler?: () => void;
  onContactReps?: () => void;
  onSave?: () => void;
  index?: number;
}

export function IssueCard({
  title,
  summary,
  category,
  impact,
  onExplainSimpler,
  onContactReps,
  onSave,
  index = 0,
}: IssueCardProps) {
  const impactClass = `impact${impact.charAt(0).toUpperCase() + impact.slice(1)}`;

  return (
    <motion.article
      className={styles.article}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className={styles.kicker}>{category}</div>

      <h3 className={styles.headline}>{title}</h3>

      <div className={styles.byline}>
        By Civic Reporter &middot; {impact.toUpperCase()} IMPACT
      </div>

      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles[category]}`}>
          {category.toUpperCase()}
        </span>
        <span className={`${styles.tag} ${styles[impactClass]}`}>
          {impact.toUpperCase()}
        </span>
      </div>

      <p className={styles.lede}>{summary}</p>

      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={onExplainSimpler}
          type="button"
        >
          Explain
        </button>

        <button
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={onContactReps}
          type="button"
        >
          Contact Reps
        </button>

        <button
          className={`${styles.actionButton} ${styles.saveButton}`}
          onClick={onSave}
          type="button"
        >
          Save
        </button>
      </div>
    </motion.article>
  );
}
