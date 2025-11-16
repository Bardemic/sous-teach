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
  sourceUrl?: string;
  isSkeleton?: boolean;
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
  sourceUrl,
  isSkeleton = false,
}: IssueCardProps) {
  const impactClass = `impact${impact.charAt(0).toUpperCase() + impact.slice(1)}`;

  return (
    <motion.article
      className={styles.article}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={isSkeleton ? { opacity: 0.5 } : {}}
    >
      <div className={styles.kicker}>{category}</div>

      <h3 className={styles.headline}>{title}</h3>

      <div className={styles.byline}>
        By Civic Reporter &middot; {impact.toUpperCase()} IMPACT
        {sourceUrl && (
          <>
            {' '}
            &middot;{' '}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              See Source
            </a>
          </>
        )}
      </div>

      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles[category]}`}>
          {category.toUpperCase()}
        </span>
        <span className={`${styles.tag} ${styles[impactClass]}`}>
          {impact.toUpperCase()}
        </span>
      </div>

      {isSkeleton ? (
        <>
          <div className={`${styles.skeletonLine} ${styles.skeletonLede}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLede}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLedeShort}`} />
        </>
      ) : (
        <p className={styles.lede}>{summary}</p>
      )}

      <div className={styles.actions}>
        {isSkeleton ? (
          <>
            <div className={`${styles.skeletonButton}`} />
            <div className={`${styles.skeletonButton}`} />
            <div className={`${styles.skeletonButton}`} />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </motion.article>
  );
}
