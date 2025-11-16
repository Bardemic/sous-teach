import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  title: string;
  organization?: string;
  url?: string;
  date?: string;
  location?: string;
  focus?: string;
  description?: string;
  isSkeleton?: boolean;
}

export function OpportunityCard({
  title,
  organization,
  url,
  date,
  location,
  focus,
  description,
  isSkeleton = false,
}: OpportunityCardProps) {
  const metaText = [organization ?? 'Independent effort', location, date].filter(Boolean).join(' • ');

  return (
    <article className={`${styles.card} ${isSkeleton ? styles.cardSkeleton : ''}`}>
      <div className={styles.header}>
        <span className={`${styles.title} ${isSkeleton ? styles.skeletonBlock : ''}`}>
          {isSkeleton ? '\u00A0' : title}
        </span>
        <span className={`${styles.meta} ${isSkeleton ? styles.skeletonLine : ''}`}>
          {isSkeleton ? '\u00A0' : metaText}
        </span>
      </div>

      {isSkeleton ? (
        <>
          <p className={`${styles.description} ${styles.skeletonLine}`} />
          <p className={`${styles.description} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        </>
      ) : (
        description && <p className={styles.description}>{description}</p>
      )}

      {isSkeleton ? (
        <span className={`${styles.focus} ${styles.skeletonChip}`} />
      ) : (
        focus && <span className={styles.focus}>{focus}</span>
      )}

      {isSkeleton ? (
        <div className={styles.linkContainer}>
          <span className={`${styles.linkSkeleton} ${styles.skeletonLineShort}`} />
        </div>
      ) : (
        url && (
          <div className={styles.linkContainer}>
            <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
              View details ↗
            </a>
          </div>
        )
      )}
    </article>
  );
}

