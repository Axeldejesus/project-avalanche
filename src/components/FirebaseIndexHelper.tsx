'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/FirebaseIndexHelper.module.css';

interface FirebaseIndexHelperProps {
  error: string | null;
}

const FirebaseIndexHelper: React.FC<FirebaseIndexHelperProps> = ({ error }) => {
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  useEffect(() => {
    if (error && error.includes('index')) {
      // Extract the URL from the error message if it exists
      const match = error.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      if (match) {
        setIndexUrl(match[0]);
      }
    } else {
      setIndexUrl(null);
    }
  }, [error]);

  if (!indexUrl) return null;

  return (
    <div className={styles.indexHelper}>
      <h4>Database Index Required</h4>
      <p>You need to create a database index for this query to work.</p>
      <a 
        href={indexUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.createIndexButton}
      >
        Click here to create the required index
      </a>
      <p className={styles.indexNote}>
        After creating the index, it may take a few minutes to complete building.
        Refresh this page after the index is built.
      </p>
    </div>
  );
};

export default FirebaseIndexHelper;
