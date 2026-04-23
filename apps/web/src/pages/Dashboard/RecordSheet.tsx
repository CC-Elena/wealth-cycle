import { NumberKeyboard, Popup, Tabs, Toast } from 'antd-mobile';
import { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

interface RecordSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const RecordSheet = ({ visible, onClose }: RecordSheetProps) => {
  const [amount, setAmount] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [memo, setMemo] = useState('');
  const categories = useFinanceStore((s) => s.categories);
  const accounts = useFinanceStore((s) => s.accounts);
  const createTransactionOnServer = useFinanceStore(
    (s) => s.createTransactionOnServer,
  );
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [items, setItems] = useState<
    Array<{
      name: string;
      amount: string;
      categoryId: string;
      shouldInventory: boolean;
    }>
  >([]);

  const [activeTab, setActiveTab] = useState<
    'expense' | 'income' | 'transfer' | 'refund'
  >('expense');
  const tags = useFinanceStore((s) => s.tags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const transferAccounts = useFinanceStore((s) => s.transferAccounts);
  const [toAccountId, setToAccountId] = useState('');

  // 只展示活跃分类 (Transfer 时不需要展示分类)
  const activeCategories = categories.filter((c) => {
    if (!c.isActive) return false;
    if (activeTab === 'refund') return c.type === 'expense';
    return c.type === activeTab;
  });

  if (
    !selectedCategoryId &&
    activeCategories.length > 0 &&
    activeTab !== 'transfer'
  ) {
    setSelectedCategoryId(activeCategories[0].id);
  }

  if (!selectedAccountId && accounts.length > 0) {
    const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
    setSelectedAccountId(defaultAcc.id);
  }

  if (!toAccountId && accounts.length > 1) {
    const nonDefault =
      accounts.find((a) => a.id !== selectedAccountId) || accounts[1];
    setToAccountId(nonDefault.id);
  }

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleInput = (v: string) => {
    if (isSplit) return; // 拆分模式下主金额只读
    if (v === 'BACKSPACE') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (v === '.') {
      if (amount.includes('.')) return;
      setAmount((prev) => prev + '.');
    } else {
      setAmount((prev) => (prev === '0' ? v : prev + v));
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: '',
        amount: '',
        categoryId: selectedCategoryId,
        shouldInventory: false,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);

    // 实时汇总金额
    const total = newItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );
    setAmount(total.toFixed(2));
  };

  const handleConfirm = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Toast.show('请输入有效金额');
      return;
    }
    if (activeTab === 'transfer') {
      if (!selectedAccountId || !toAccountId) {
        Toast.show('请选择转出和转入账户');
        return;
      }
      if (selectedAccountId === toAccountId) {
        Toast.show('转出和转入不能是同一账户');
        return;
      }
      try {
        await transferAccounts({
          fromAccountId: selectedAccountId,
          toAccountId,
          amount: num,
          memo: memo || undefined,
        });
        Toast.show({ icon: 'success', content: '转账成功' });
        setAmount('0');
        setMemo('');
        onClose();
        return;
      } catch {
        Toast.show({ icon: 'fail', content: '转账失败' });
        return;
      }
    }

    if (!selectedCategoryId) {
      Toast.show('请选择分类');
      return;
    }

    try {
      const payload: any = {
        amount: num,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId || undefined,
        type: activeTab,
        memo: memo || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };

      if (isSplit && items.length > 0) {
        payload.items = items.map((it) => ({
          name: it.name || '未命名项目',
          amount: parseFloat(it.amount) || 0,
          categoryId: it.categoryId,
          shouldInventory: it.shouldInventory,
        }));
      }

      await createTransactionOnServer(payload);
      Toast.show({ icon: 'success', content: '记账成功' });
      setAmount('0');
      setMemo('');
      onClose();
    } catch {
      Toast.show({ icon: 'fail', content: '记账失败' });
    }
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        backgroundColor: '#fff',
      }}
    >
      <div className={styles.sheetContainer}>
        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as any)}>
          <Tabs.Tab title="支出" key="expense" />
          <Tabs.Tab title="收入" key="income" />
          <Tabs.Tab title="转账" key="transfer" />
          <Tabs.Tab title="退款" key="refund" />
        </Tabs>

        <div className={styles.amountDisplay}>
          <span className={styles.currencySymbol}>¥</span>
          <span className={styles.amountValue}>{amount}</span>
        </div>

        {/* 备注输入 */}
        <div className={styles.memoRow}>
          <input
            className={styles.memoInput}
            type="text"
            placeholder="添加备注..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {/* 拆分切换 */}
        {activeTab === 'expense' && (
          <div className={styles.splitHeader}>
            <span className={styles.splitTitle}>
              {isSplit ? '拆项目明细' : '快速记账'}
            </span>
            <span
              className={styles.splitToggle}
              onClick={() => setIsSplit(!isSplit)}
            >
              {isSplit ? '返回常规' : '拆分项目'}
            </span>
          </div>
        )}

        {/* 子项列表 */}
        {activeTab === 'expense' && isSplit && (
          <div className={styles.itemsList}>
            {items.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <input
                  className={styles.itemField}
                  placeholder="品名"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
                <input
                  className={`${styles.itemField} ${styles.itemAmount}`}
                  placeholder="金额"
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                />
                <span
                  className={`${styles.itemInventoryToggle} ${item.shouldInventory ? styles.inventoryActive : ''}`}
                  onClick={() =>
                    updateItem(idx, 'shouldInventory', !item.shouldInventory)
                  }
                >
                  📦
                </span>
                <span
                  className={styles.removeBtn}
                  onClick={() => removeItem(idx)}
                >
                  ✕
                </span>
              </div>
            ))}
            <div className={styles.addItemBtn} onClick={handleAddItem}>
              + 添加子项
            </div>
          </div>
        )}

        {/* 账户选择 */}
        <div className={styles.accountSelection}>
          <div className={styles.sectionLabel}>
            {activeTab === 'transfer' ? '转出账户' : '记账账户'}
          </div>
          <div className={styles.scrollRow}>
            {accounts.map((acc) => {
              const isAccActive = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`${styles.accountPill} ${isAccActive ? styles.activeAccount : ''}`}
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  <span className={styles.accIcon}>{acc.icon}</span>
                  <span className={styles.accName}>{acc.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {activeTab === 'transfer' && (
          <div className={styles.accountSelection}>
            <div className={styles.sectionLabel}>转入账户</div>
            <div className={styles.scrollRow}>
              {accounts.map((acc) => {
                const isAccActive = toAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    className={`${styles.accountPill} ${isAccActive ? styles.activeAccount : ''}`}
                    onClick={() => setToAccountId(acc.id)}
                  >
                    <span className={styles.accIcon}>{acc.icon}</span>
                    <span className={styles.accName}>{acc.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 标签选择 */}
        {activeTab !== 'transfer' && tags.length > 0 && (
          <div className={styles.tagSelection}>
            <div className={styles.scrollRow}>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className={`${styles.tagPill} ${selectedTagIds.includes(tag.id) ? styles.activeTag : ''}`}
                  style={{
                    borderColor: tag.color,
                    color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
                    backgroundColor: selectedTagIds.includes(tag.id)
                      ? tag.color
                      : 'transparent',
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分类网格 — 从后端拉取 */}
        {activeTab !== 'transfer' && (
          <div className={styles.categoryScroll}>
            {activeCategories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`${styles.categoryPill} ${isActive ? styles.activePill : ''}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <div className={styles.categoryIcon}>{cat.icon}</div>
                  <div className={styles.categoryName}>{cat.name}</div>
                </div>
              );
            })}
          </div>
        )}

        <NumberKeyboard
          visible={true}
          customKey={'.'}
          confirmText="完成"
          onClose={handleConfirm}
          onInput={handleInput}
          onDelete={() => handleInput('BACKSPACE')}
          className={styles.customKeyboard}
        />
      </div>
    </Popup>
  );
};
