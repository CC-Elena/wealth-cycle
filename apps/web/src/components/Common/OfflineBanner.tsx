import React from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './OfflineBanner.module.css';

const OfflineBanner = () => {
  const isOnline = useFinanceStore((state) => state.isOnline);
  const queueLength = useFinanceStore((state) => state.offlineQueue.length);

  if (isOnline && queueLength === 0) return null;

  return (
    <div className={`${styles.banner} ${!isOnline ? styles.offline : styles.syncing}`}>
      <span className={styles.icon}>
        {!isOnline ? '📴' : '⏳'}
      </span>
      <span className={styles.text}>
        {!isOnline 
          ? `您正处于离线模式${queueLength > 0 ? ` (${queueLength} 项交易待同步)` : ''}`
          : `正在同步离线数据 (${queueLength} 项剩余)...`}
      </span>
    </div>
  );
};

export default OfflineBanner;
