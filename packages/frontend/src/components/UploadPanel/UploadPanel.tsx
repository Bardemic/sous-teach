import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './UploadPanel.module.css';

export interface UploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadPanel({ isOpen, onClose }: UploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf' || file.type === 'text/plain') {
      setFile(file);
    } else {
      alert('Please upload a PDF or text file');
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result
    setResult(
      'This document discusses upcoming changes to local zoning regulations. Key points include new height restrictions for residential buildings in the downtown area, updated parking requirements, and expanded green space mandates for new developments. The changes take effect starting next quarter.',
    );

    setIsProcessing(false);
  };

  const handleReset = () => {
    setFile(null);
    setText('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSubmit = (file !== null || text.trim().length > 0) && !isProcessing;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Upload document</h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.content}>
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className={styles.uploadIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className={styles.dropText}>
                  {file ? file.name : 'Drop your PDF here'}
                </p>
                <p className={styles.dropHint}>or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.fileInput}
                  accept=".pdf,.txt"
                  onChange={handleChange}
                />
              </div>

              <div className={styles.divider}>or paste text</div>

              <div className={styles.textareaWrapper}>
                <label className={styles.label} htmlFor="text-input">
                  Document text
                </label>
                <textarea
                  id="text-input"
                  className={styles.textarea}
                  placeholder="Paste the document text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              {result && (
                <motion.div
                  className={styles.result}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className={styles.resultTitle}>Summary</h3>
                  <p className={styles.resultText}>{result}</p>
                </motion.div>
              )}
            </div>

            <div className={styles.actions}>
              {result ? (
                <button
                  className={styles.button}
                  onClick={handleReset}
                  type="button"
                >
                  Upload another
                </button>
              ) : (
                <>
                  <button
                    className={styles.button}
                    onClick={onClose}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.button} ${styles.primary}`}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    type="button"
                  >
                    {isProcessing ? 'Processing...' : 'Summarize'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
