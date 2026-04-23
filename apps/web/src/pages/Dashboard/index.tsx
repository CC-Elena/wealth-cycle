import { Button, Modal, Toast } from 'antd-mobile';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationHub } from '../../components/Common/NotificationHub';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';
import { PayrollGuidance } from './PayrollGuidance';
import { RecordSheet } from './RecordSheet';

const Dashboard = () => {
  const store = useFinanceStore();
  const [recordVisible, setRecordVisible] = useState(false);
  const [payrollVisible, setPayrollVisible] = useState(false);
  const [healthVisible, setHealthVisible] = useState(false);
  const [ledgerVisible, setLedgerVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    store.fetchCategories();
    store.fetchBudgets();
    store.fetchTransactions();
    store.initProfile();
    store.fetchHealthStats();
    store.fetchWishlist();
    store.fetchHealthReport();
    store.fetchPredictions();
  }, []);

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
        <div
          className={styles.headerIconWrapper}
          onClick={() => navigate('/ledgers')}
        >
          <span className={styles.headerIcon}>📂</span>
        </div>
        <h1 className={styles.headerTitle}>
          {store.currentLedgerId === 'global'
            ? '🌍 全局资产视角'
            : store.ledgers.find((l) => l.id === store.currentLedgerId)?.name ||
              '您的财务报告'}
        </h1>
        <div className={styles.headerRightIcons}>
          <NotificationHub />
          <div
            className={styles.headerIconWrapper}
            onClick={() => navigate('/profile')}
          >
            <span className={styles.headerIcon}>👤</span>
          </div>
        </div>
      </header>

      <section className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>财务健康结果</h2>
        <div
          className={styles.healthShield}
          onClick={() => setHealthVisible(true)}
          title="系统健康治理"
        >
          {store.healthReport?.isHealthy ? '🛡️' : '🚨'}
        </div>
        <div
          className={styles.wishlistLink}
          onClick={() => navigate('/wishlist')}
        >
          愿望清单 →
        </div>
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
          <div className={styles.metricLabel}>账面可支配</div>
          <div className={styles.metricValue}>
            ¥{store.disposableIncome.toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>冷冻资金 (冷静期)</div>
          <div className={styles.metricValue} style={{ color: '#F6AD55' }}>
            ¥
            {store.wishlistItems
              .filter((i) => i.status === 'cooling')
              .reduce((sum, it) => sum + it.amount, 0)
              .toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>可用可支配</div>
          <div
            className={styles.metricValue}
            style={{ color: 'var(--color-accent)' }}
          >
            ¥
            {(
              store.disposableIncome -
              store.wishlistItems
                .filter((i) => i.status === 'cooling')
                .reduce((sum, it) => sum + it.amount, 0)
            ).toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>估算生存周期</div>
          <div className={styles.metricValue}>
            {store.healthStats?.survivalDays ?? 0}
            <span style={{ fontSize: '16px', marginLeft: 2 }}>天</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>应急金覆盖</div>
          <div className={styles.metricValue}>
            {Math.floor(
              (store.profile.emergencyFundAmount || 0) /
                (store.healthStats?.meanDailySpend || 1),
            )}
            <span style={{ fontSize: '16px', marginLeft: 2 }}>天</span>
          </div>
        </div>
      </div>

      <section className={styles.accountsSection}>
        <h2 className={styles.sectionTitle}>资产账户</h2>
        <div className={styles.accountsGrid}>
          {store.accounts.map((acc) => (
            <div key={acc.id} className={styles.accountCard}>
              <div className={styles.accCardHeader}>
                <span className={styles.accCardIcon}>{acc.icon}</span>
                <span className={styles.accCardName}>{acc.name}</span>
              </div>
              <div className={styles.accCardBalance}>
                ¥{acc.balance.toLocaleString()}
              </div>
            </div>
          ))}
          {store.accounts.length === 0 && (
            <p className={styles.sectionSubtitle}>
              暂无账户，记账时将自动创建默认账户
            </p>
          )}
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsHeader}>
          <h2 className={styles.sectionTitle}>预算执行统计</h2>
          <span className={styles.statsIcon}>📊</span>
        </div>

        <div className={styles.statsBody}>
          {store.predictions.some((p) => p.risk === 'high') && (
            <div className={styles.predictionWarning}>
              🚨 警告：检测到多个项目预计在本月内超支。
            </div>
          )}
          <div className={styles.progressBars}>
            {chartData.map((d) => (
              <div className={styles.progressItem} key={d.name}>
                <div className={styles.progressLabel}>
                  {d.name}
                  {store.predictions.find(
                    (p) =>
                      p.budgetId ===
                      store.budgets.find((b) => b.name === d.name)?.id,
                  )?.risk === 'high' && (
                    <span
                      style={{
                        color: '#E53E3E',
                        fontSize: '10px',
                        marginLeft: 4,
                      }}
                    >
                      [预计超支]
                    </span>
                  )}
                </div>
                <div className={styles.progressPercent}>{d.percent}%</div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${d.percent}%`,
                      backgroundColor:
                        store.predictions.find(
                          (p) =>
                            p.budgetId ===
                            store.budgets.find((b) => b.name === d.name)?.id,
                        )?.risk === 'high'
                          ? '#E53E3E'
                          : d.color,
                    }}
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

      <section className={styles.vaultSection}>
        <div className={styles.vaultHeader}>
          <div>
            <h2 className={styles.sectionTitle}>个人保险库 (Vault)</h2>
            <p className={styles.sectionSubtitle}>应急金保障进度</p>
          </div>
          <span className={styles.vaultIcon}>🛡️</span>
        </div>
        <div className={styles.vaultBody}>
          <div className={styles.vaultMain}>
            <div className={styles.vaultValue}>
              ¥{(store.profile.emergencyFundAmount || 0).toLocaleString()}
            </div>
            <div className={styles.vaultLabel}>当前应急准备金</div>
          </div>
          <div className={styles.vaultProgress}>
            <div className={styles.vaultProgressText}>
              <span>目标进度</span>
              <span>
                {Math.round(
                  ((store.profile.emergencyFundAmount || 0) /
                    (store.profile.emergencyFundGoal || 1)) *
                    100,
                )}
                %
              </span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(100, ((store.profile.emergencyFundAmount || 0) / (store.profile.emergencyFundGoal || 1)) * 100)}%`,
                  backgroundColor: '#4FD1C5',
                }}
              />
            </div>
            <div className={styles.vaultGoal}>
              目标：¥{(store.profile.emergencyFundGoal || 0).toLocaleString()}
            </div>
          </div>
          <div className={styles.savingsInfo}>
            <span>
              通用储蓄余额：¥
              {(store.profile.savingsAmount || 0).toLocaleString()}
            </span>
          </div>
        </div>
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
                    <div className={styles.txName}>
                      {cat?.name || '未知分类'}
                      {tx.memo ? ` · ${tx.memo}` : ''}
                    </div>
                    <div className={styles.txDate}>
                      {new Date(tx.date).toLocaleDateString('zh-CN')}
                    </div>
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
          disabled={store.currentLedgerId === 'global'}
        >
          发薪重配
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSolid}`}
          onClick={() => {
            if (store.currentLedgerId === 'global') {
              Toast.show('请切换至具体账本进行记账');
              return;
            }
            setRecordVisible(true);
          }}
          style={{ opacity: store.currentLedgerId === 'global' ? 0.5 : 1 }}
        >
          {store.currentLedgerId === 'global' ? '全局只读' : '记一笔'}
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

      <Modal
        visible={healthVisible}
        content={
          <div className={styles.healthModal}>
            <h3>🔍 系统运行审计</h3>
            <div className={styles.checksList}>
              {store.healthReport?.checks.map((check, idx) => (
                <div key={idx} className={styles.checkItem}>
                  <div className={styles.checkInfo}>
                    <div className={styles.checkName}>{check.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {check.details}
                    </div>
                  </div>
                  <span
                    className={`${styles.checkStatus} ${styles[check.status]}`}
                  >
                    {check.status === 'pass' ? '正常' : '异常'}
                  </span>
                </div>
              ))}
            </div>

            {!store.healthReport?.isHealthy && (
              <div className={styles.mismatchBanner}>
                检测到账面异常差额：¥
                {store.healthReport?.mismatchAmount.toFixed(2)}
                。建议执行对账校准。
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button
                block
                size="small"
                onClick={() => {
                  store.backupDatabase();
                  setHealthVisible(false);
                }}
              >
                💾 备份数据库
              </Button>
              <Button
                block
                size="small"
                onClick={() => {
                  store.exportData();
                  setHealthVisible(false);
                }}
              >
                📥 导出数据
              </Button>

              {!store.healthReport?.isHealthy && (
                <Button
                  block
                  size="small"
                  color="primary"
                  onClick={() => {
                    store.reconcileHealth();
                    setHealthVisible(false);
                  }}
                >
                  🛠️ 一键对账
                </Button>
              )}
            </div>
          </div>
        }
        closeOnMaskClick
        onClose={() => setHealthVisible(false)}
      />
    </div>
  );
};

export default Dashboard;
