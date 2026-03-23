import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

// 页面级的 Mock 数据以匹配设计图原型
const MOCK_INVENTORY_ITEMS = [
  {
    id: '1',
    name: '全脂牛奶',
    icon: '🥛',
    purchaseDate: '2026-06-01',
    expireDate: '2026-06-28',
    status: 'warning',
    percent: 80,
  },
  {
    id: '2',
    name: '新鲜鸡蛋',
    icon: '🥚',
    purchaseDate: '2026-06-10',
    expireDate: '2026-07-05',
    status: 'healthy',
    percent: 30,
  },
  {
    id: '3',
    name: '葡萄',
    icon: '🍇',
    purchaseDate: '2026-06-12',
    expireDate: '2026-06-26',
    status: 'healthy',
    percent: 45,
  },
  {
    id: '4',
    name: '西兰花',
    icon: '🥦',
    purchaseDate: '2026-06-11',
    expireDate: '2026-06-24',
    status: 'warning',
    percent: 85,
  },
  {
    id: '5',
    name: '法棍面包',
    icon: '🥖',
    purchaseDate: '2026-06-12',
    expireDate: '2026-06-15',
    status: 'danger',
    percent: 95,
  },
  {
    id: '6',
    name: '切达干酪',
    icon: '🧀',
    purchaseDate: '2026-05-20',
    expireDate: '2026-08-15',
    status: 'healthy',
    percent: 20,
  },
];

const Inventory = () => {
  const store = useFinanceStore();
  const [activeTab, setActiveTab] = useState('消耗品');

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.headerRow}>
        <div className={styles.title}>库存概览</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '24px' }}>
          👤
        </div>
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索物品..."
        />
      </div>

      <div className={styles.grid}>
        {MOCK_INVENTORY_ITEMS.map((item) => {
          let fillClass = styles.statusHealthy;
          if (item.status === 'warning') fillClass = styles.statusWarning;
          if (item.status === 'danger') fillClass = styles.statusDanger;

          return (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.iconWrapper}>{item.icon}</div>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.expireDate}>
                过期日 {item.expireDate.slice(5)}
              </div>

              <div className={styles.uBarContainer}>
                <div
                  className={`${styles.uBarFill} ${fillClass}`}
                  style={{ width: `${100 - item.percent}%` }}
                />
              </div>

              <div className={styles.daysLeft}>
                剩余 {Math.floor((100 - item.percent) / 5)} 天
              </div>

              <div
                className={`${styles.statusLabel} ${item.status === 'danger' ? styles.labelDanger : ''}`}
              >
                {item.status === 'danger' ? '即将过期！' : '安全可食用'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;
