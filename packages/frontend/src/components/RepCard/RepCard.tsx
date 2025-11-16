import { motion } from 'framer-motion';
import styles from './RepCard.module.css';

export interface RepCardProps {
  name: string;
  position: string;
  email?: string;
  phone?: string;
  index?: number;
}

export function RepCard({ name, position, email, phone, index = 0 }: RepCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className={styles.header}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.position}>{position}</p>
        </div>
      </div>

      <div className={styles.contact}>
        {email && (
          <a href={`mailto:${email}`} className={styles.contactButton}>
            Email
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className={styles.contactButton}>
            Call
          </a>
        )}
      </div>
    </motion.div>
  );
}
