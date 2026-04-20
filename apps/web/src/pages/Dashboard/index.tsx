import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFinanceStore } from '../../stores/financeStore';
import { RecordSheet } from './RecordSheet';
import { PayrollGuidance } from './PayrollGuidance';
import styles from './index.module.css';

const Dashboard = () => {
  const store = useFinanceStore();
  const [recordVisible, setRecordVisible] = useState(false);
  const [payrollVisible, setPayrollVisible] = useState(false);

  // 组装给 ECharts 的数据集
  const chartData = store.budgets.map((b) => ({
    name: b.name,
    value: b.spentAmount,
    color: b.color,
    percent: Math.min(100, Math.round((b.spentAmount / b.totalAmount) * 100)),
  }));

  const ringChartOption = {
    color: chartData.map((d) => d.color),
    series: chartData.map((d, idx) => {
      // 动态分布多层圆环的半径
      const outRadius = 85 - idx * 18;
      const inRadius = outRadius - 10;
      return {
        type: 'pie',
        radius: [`${inRadius}%`, `${outRadius}%`],
        center: ['50%', '50%'],
        startAngle: 90,
        label: { show: false },
        data: [
          { value: d.percent, name: d.name, itemStyle: { borderRadius: 10 } },
          { value: 100 - d.percent, itemStyle: { color: '#EFEFEF' } },
        ],
      };
    }),
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <header className={styles.header}>
        <div className={styles.headerIconWrapper}>
          <span className={styles.headerIcon}>⚙️</span>
        </div>
        <h1 className={styles.headerTitle}>您的财务报告</h1>
        <div className={styles.headerIconWrapper}>
          <span className={styles.headerIcon}>📤</span>
        </div>
      </header>

      <section className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>财务健康结果</h2>
        <p className={styles.sectionSubtitle}>
          财务状况通过记账数据的分析揭示健康财富流
        </p>
      </section>

      <div className={styles.scoreRow}>
        <div className={styles.scoreIconBox}>
          <span className={styles.scoreIcon}>🌿</span>
        </div>
        <div className={styles.scoreTextCol}>
          <div className={styles.scoreTextTitle}>为您的财务状况评分</div>
          <div className={styles.scoreTextDate}>
            最近发薪：
            {new Date(store.profile.lastPayrollDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>可支配资金</div>
          <div className={styles.metricValue}>
            ¥{store.disposableIncome.toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>估算生存周期</div>
          <div className={styles.metricValue}>
            {Math.floor(store.disposableIncome / 200)}
            <span style={{ fontSize: '16px', marginLeft: 2 }}>天</span>
          </div>
        </div>
      </div>

      <section className={styles.statsSection}>
        <div className={styles.statsHeader}>
          <h2 className={styles.sectionTitle}>预算执行统计</h2>
          <span className={styles.statsIcon}>📊</span>
        </div>

        <div className={styles.statsBody}>
          <div className={styles.progressBars}>
            {chartData.map((d) => (
              <div className={styles.progressItem} key={d.name}>
                <div className={styles.progressLabel}>{d.name}</div>
                <div className={styles.progressPercent}>{d.percent}%</div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${d.percent}%`, backgroundColor: d.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.ringChartContainer}>
            <ReactECharts
              option={ringChartOption}
              style={{ height: '200px', width: '200px' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </section>

      <section className={styles.overviewSection}>
        <h2 className={styles.sectionTitle}>您的财务概览</h2>
        <p className={styles.overviewText}>
          健康的财务不仅仅是账面的数字，还反映了整体的生活质量。它的特点是现金流稳定、预算分配合理、浪费率低。您当前的净资产预估为{' '}
          <strong>¥{store.profile.netWorth.toLocaleString()}</strong>。
        </p>
      </section>

      {/* 近期流水 */}
      {store.backendTransactions.length > 0 && (
        <section className={styles.overviewSection}>
          <h2 className={styles.sectionTitle}>近期流水</h2>
          <div className={styles.txList}>
            {store.backendTransactions.slice(0, 10).map((tx) => {
              const cat = store.categories.find((c) => c.id === tx.categoryId);
              return (
                <div key={tx.id} className={styles.txItem}>
                  <div className={styles.txIcon}>{cat?.icon || '📝'}</div>
                  <div className={styles.txInfo}>
                    <div className={styles.txName}>{cat?.name || '未知分类'}{tx.memo ? ` · ${tx.memo}` : ''}</div>
                    <div className={styles.txDate}>{new Date(tx.date).toLocaleDateString('zh-CN')}</div>
                  </div>
                  <div className={styles.txAmount}>
                    {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.actionButtons}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={() => setPayrollVisible(true)}
        >
          发薪重配
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSolid}`}
          onClick={() => setRecordVisible(true)}
        >
          记一笔
        </button>
      </div>

      {/* 挂载交互弹窗 */}
      <RecordSheet
        visible={recordVisible}
        onClose={() => setRecordVisible(false)}
      />
      <PayrollGuidance
        visible={payrollVisible}
        onClose={() => setPayrollVisible(false)}
      />
    </div>
  );
};

export default Dashboard;

