import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

const Analysis = () => {
  const store = useFinanceStore();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [trend, dist] = await Promise.all([
        store.fetchTrend(6),
        store.fetchCategoryDist(),
      ]);
      setTrendData(trend);
      setCategoryDist(dist);
      setLoading(false);
    };
    loadData();
  }, []);

  // 处理趋势数据以供 ECharts 使用
  const months = Array.from(new Set(trendData.map(d => d.month))).sort();
  const incomeData = months.map(m => {
    const item = trendData.find(d => d.month === m && d.type === 'income');
    return item ? item.total : 0;
  });
  const expenseData = months.map(m => {
    const item = trendData.find(d => d.month === m && d.type === 'expense');
    return item ? item.total : 0;
  });

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLine: { lineStyle: { color: '#BDB2FF' } },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: incomeData,
        itemStyle: { color: '#4FD1C5' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(79, 209, 197, 0.3)' }, { offset: 1, color: 'rgba(79, 209, 197, 0)' }]
          }
        }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        itemStyle: { color: '#F56565' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245, 101, 101, 0.3)' }, { offset: 1, color: 'rgba(245, 101, 101, 0)' }]
          }
        }
      }
    ]
  };

  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: categoryDist.map(d => ({
          value: d.total,
          name: d.categoryName,
          itemStyle: { color: d.categoryColor }
        }))
      }
    ]
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          财务趋势分析 
          {store.currentLedgerId === 'global' && <span className={styles.globalBadge}>Global</span>}
        </h1>
        <p className={styles.subtitle}>
          {store.currentLedgerId === 'global' ? '当前显示所有账本聚合数据' : '基于历史数据的深度洞察'}
        </p>
      </header>

      <section className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <h3>收支趋势 (近6个月)</h3>
          <span className={styles.badge}>趋势</span>
        </div>
        <div className={styles.chartWrapper}>
          <ReactECharts option={trendOption} style={{ height: '300px' }} />
        </div>
      </section>

      <div className={styles.gridRow}>
        <section className={`${styles.chartCard} ${styles.halfCard}`}>
          <div className={styles.cardHeader}>
            <h3>消费构成</h3>
          </div>
          <div className={styles.chartWrapper}>
             <ReactECharts option={pieOption} style={{ height: '250px' }} />
          </div>
        </section>

        <section className={`${styles.chartCard} ${styles.halfCard}`}>
          <div className={styles.cardHeader}>
            <h3>排行前三</h3>
          </div>
          <div className={styles.rankList}>
            {categoryDist.slice(0, 3).map((d, i) => (
              <div key={d.categoryId} className={styles.rankItem}>
                <div className={styles.rankInfo}>
                   <span className={styles.rankNumber}>{i + 1}</span>
                   <span className={styles.rankIcon}>{d.categoryIcon || '🏷️'}</span>
                   <span className={styles.rankName}>{d.categoryName}</span>
                </div>
                <div className={styles.rankValue}>¥{d.total.toLocaleString()}</div>
              </div>
            ))}
            {categoryDist.length === 0 && <div className={styles.empty}>暂无数据</div>}
          </div>
        </section>
      </div>

      <section className={styles.insightCard}>
         <div className={styles.insightTitle}>
            <span>💡 智能分析建议</span>
         </div>
         <div className={styles.insightContent}>
            {expenseData[expenseData.length - 1] > (expenseData[expenseData.length - 2] || 0) ? (
              <p>您的本月支出较上月有所上升，建议检查是否有非必要的冲动消费项。</p>
            ) : (
              <p>您的财务控制状况良好，本月支出保持在健康水平，可以考虑增加应急金划转。</p>
            )}
            <p className={styles.insightHint}>向 TwinLedger 提问以获取更深度的复盘建议。</p>
         </div>
      </section>
    </div>
  );
};

export default Analysis;
