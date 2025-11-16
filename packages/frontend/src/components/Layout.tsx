import { PropsWithChildren } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Layout.module.css';

interface LayoutProps extends PropsWithChildren {
  showHeader?: boolean;
  onUploadClick?: () => void;
}

export function Layout({ children, showHeader = true, onUploadClick }: LayoutProps) {
  return (
    <div className={styles.layout}>
      {showHeader && (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.logo}>
              <span>Sous-Teach</span>
            </Link>
            <div className={styles.headerActions}>
              <button
                className={styles.uploadButton}
                onClick={onUploadClick}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 3.5V12.5M3.5 8H12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Upload PDF
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={styles.main}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
}
