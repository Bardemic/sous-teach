import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  title: string;
  organization?: string;
  url?: string;
  date?: string;
  location?: string;
  focus?: string;
  description?: string;
}

export function OpportunityCard({
  title,
  organization,
  url,
  date,
  location,
  focus,
  description,
}: OpportunityCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>
          {organization ?? 'Independent effort'}
          {location ? ` • ${location}` : ''}
          {date ? ` • ${date}` : ''}
        </span>
      </div>
      {description && <p className={styles.description}>{description}</p>}
      {focus && <span className={styles.focus}>{focus}</span>}
      {url && (
        <div className={styles.linkContainer}>
          <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
            View details ↗
          </a>
        </div>
      )}
    </article>
  );
}

