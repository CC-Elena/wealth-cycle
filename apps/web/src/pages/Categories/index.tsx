import { useMemo } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

const Categories = () => {
  const budgets = useFinanceStore((s) => s.budgets);

  const { totalLimit, totalSpent } = useMemo(() => {
    let limit = 0;
    let spent = 0;
    for (const b of budgets) {
      limit += b.totalAmount;
      spent += b.spentAmount;
    }
    return { totalLimit: limit, totalSpent: spent };
  }, [budgets]);

  const masterPercent =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>本期预算健康度</div>
        <div className={styles.pageDate}>
          {new Date().toLocaleString('zh-CN', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className={styles.masterCard}>
        {/* 用极其简单的纯 CSS/SVG 实现一个平滑波浪背景替代未安装的 chart */}
        <div className={styles.waveBg}>
          <svg
            viewBox="0 0 1440 320"
            style={{
              position: 'absolute',
              bottom: 0,
              width: '200%',
              transform: 'translateX(-20%)',
            }}
          >
            <path
              fill="var(--color-accent)"
              fillOpacity="1"
              d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,202.7C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div className={styles.masterLabel}>已消耗预算水位</div>
        <div className={styles.masterPercent}>{masterPercent}%</div>
        <div className={styles.masterSub}>
          ¥{totalSpent.toLocaleString()} / ¥{totalLimit.toLocaleString()} 总计
        </div>
      </div>

      <div className={styles.budgetList}>
        {budgets.map((b) => {
          const percent = Math.min(
            100,
            Math.round((b.spentAmount / b.totalAmount) * 100),
          );
          const isWarning = percent > 80;
          const isDanger = percent >= 100;

          let ringColor = b.color;
          if (isDanger) ringColor = 'var(--color-danger)';
          else if (isWarning) ringColor = 'var(--color-warning)';

          // 计算 SVG ring 的 dasharray (圈长)
          const radius = 26;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percent / 100) * circumference;

          return (
            <div key={b.id} className={styles.budgetCard}>
              <div className={styles.ringWrapper}>
                <svg className={styles.ringChart} width="56" height="56">
                  <circle
                    className={styles.ringCircleBg}
                    cx="28"
                    cy="28"
                    r={radius}
                  />
                  <circle
                    className={styles.ringCircleProgress}
                    cx="28"
                    cy="28"
                    r={radius}
                    stroke={ringColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className={styles.iconInner}>{b.icon}</div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <div className={styles.catName}>{b.name}</div>
                  <div className={styles.amountStr}>
                    ¥{b.spentAmount.toLocaleString()} / ¥
                    {b.totalAmount.toLocaleString()} ({percent}%)
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percent}%`, backgroundColor: ringColor }}
                  />
                </div>

                <div className={styles.remainingText}>
                  剩余: ¥
                  {Math.max(0, b.totalAmount - b.spentAmount).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
