import { useMemo, useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import type { Transaction } from '../../types';
import styles from './index.module.css';

const FILTERS = ['所有', '支出', '收入', '本月'];

const CATEGORY_MAP: Record<string, { name: string; icon: string }> = {
  b1: { name: '饮食', icon: '🍔' },
  b2: { name: '日用', icon: '🛒' },
  b3: { name: '交通', icon: '🚗' },
  b4: { name: '娱乐', icon: '🎉' },
  other: { name: '其他', icon: '📂' },
};

// 工具：按日期分组
const groupTransactionsByDate = (txs: Transaction[]) => {
  const groups: Record<string, Transaction[]> = {};
  for (const t of txs) {
    const d = new Date(t.date);
    const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(t);
  }
  return groups;
};

const Transactions = () => {
  const { transactions, profile } = useFinanceStore();
  const [activeFilter, setActiveFilter] = useState('所有');

  // 筛选逻辑
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (activeFilter === '支出') return t.type === 'expense';
      if (activeFilter === '收入') return t.type === 'income';
      return true; // "所有" 或暂未实现的"本月"逻辑统统放行
    });
  }, [transactions, activeFilter]);

  const groupedObj = groupTransactionsByDate(filteredTxs);
  const dateKeys = Object.keys(groupedObj);

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.headerRow}>
        <div className={styles.title}>流水账单</div>
        <img src={profile.avatarUrl} alt="avatar" className={styles.avatar} />
      </div>

      <div className={styles.filterScroll}>
        {FILTERS.map((f) => (
          <div
            key={f}
            className={`${styles.filterPill} ${activeFilter === f ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </div>
        ))}
      </div>

      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索记录..."
        />
      </div>

      <div className={styles.listArea}>
        {dateKeys.length === 0 ? (
          <div className={styles.emptyState}>
            本期暂无账单数据，快去记一笔吧！
          </div>
        ) : (
          dateKeys.map((dateKey) => (
            <div key={dateKey} className={styles.dateGroup}>
              <div className={styles.dateStickyHeader}>{dateKey}</div>
              <div className={styles.txList}>
                {groupedObj[dateKey].map((tx) => {
                  const catInfo =
                    CATEGORY_MAP[tx.categoryId] || CATEGORY_MAP.other;
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className={styles.txItem}>
                      <div className={styles.txIconBox}>{catInfo.icon}</div>
                      <div className={styles.txInfo}>
                        <div className={styles.txTitle}>{catInfo.name}</div>
                        <div className={styles.txSubtitle}>
                          {tx.memo || (isIncome ? '入账' : '日常消费')}
                        </div>
                      </div>
                      <div
                        className={`${styles.txAmount} ${isIncome ? styles.amountIncome : styles.amountExpense}`}
                      >
                        {isIncome ? '+' : '-'}¥{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;
