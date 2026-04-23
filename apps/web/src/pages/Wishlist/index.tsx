import { Button, ProgressBar, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore, type WishlistItem } from '../../stores/financeStore';
import styles from './index.module.css';

const Wishlist = () => {
  const { wishlistItems, updateWishlistStatus, categories } = useFinanceStore();
  const navigate = useNavigate();

  const coolingItems = wishlistItems.filter((i) => i.status === 'cooling');
  const pastItems = wishlistItems.filter((i) => i.status !== 'cooling');

  const handleAction = async (id: string, status: WishlistItem['status']) => {
    try {
      await updateWishlistStatus(id, status);
      Toast.show({ icon: 'success', content: '已更新状态' });
    } catch {
      Toast.show({ icon: 'fail', content: '更新失败' });
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const remaining = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <header className={styles.header}>
        <Button
          onClick={() => navigate(-1)}
          fill="none"
          className={styles.backBtn}
        >
          ← 返回
        </Button>
        <h1 className={styles.title}>愿望清单</h1>
        <p className={styles.subtitle}>冷静期是冲动消费的终结者</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          冷静期执行中 ({coolingItems.length})
        </h2>
        <div className={styles.itemsList}>
          {coolingItems.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const daysLeft = getDaysRemaining(item.coolingEnd);
            const progress = Math.min(
              100,
              Math.max(
                0,
                ((Date.now() - new Date(item.createdAt).getTime()) /
                  (new Date(item.coolingEnd).getTime() -
                    new Date(item.createdAt).getTime())) *
                  100,
              ),
            );

            return (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.itemIcon}>{cat?.icon || '🎁'}</span>
                  <div className={styles.itemMeta}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemAmount}>
                      ¥{item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.countdown}>
                    {daysLeft > 0 ? `${daysLeft}天后可谈` : '🎉 已冷静'}
                  </div>
                </div>

                <div className={styles.reasonBox}>
                  <strong>购买动机：</strong>
                  {item.reason || '未填写理由'}
                </div>

                <div className={styles.progressSection}>
                  <ProgressBar
                    percent={progress}
                    style={{ '--track-width': '6px' }}
                  />
                </div>

                <div className={styles.actions}>
                  <Button
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={() => handleAction(item.id, 'rejected')}
                  >
                    放弃购买
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    disabled={daysLeft > 0}
                    onClick={() => handleAction(item.id, 'bought')}
                  >
                    冷静后买入
                  </Button>
                </div>
              </div>
            );
          })}
          {coolingItems.length === 0 && (
            <div className={styles.emptyState}>
              ☕ 目前没有正在冷静的项目，您的财务很自律。
            </div>
          )}
        </div>
      </section>

      {pastItems.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>历史决策</h2>
          <div className={styles.historyList}>
            {pastItems.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyName}>{item.name}</span>
                <span className={`${styles.statusPill} ${styles[item.status]}`}>
                  {item.status === 'bought' ? '✅ 已购' : '❌ 已省下'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Wishlist;
