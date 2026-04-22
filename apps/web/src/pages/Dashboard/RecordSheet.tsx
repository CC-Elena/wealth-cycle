import { useState } from 'react';
import { Popup, NumberKeyboard, Toast } from 'antd-mobile';
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
  const createTransactionOnServer = useFinanceStore((s) => s.createTransactionOnServer);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [items, setItems] = useState<Array<{ name: string; amount: string; categoryId: string; shouldInventory: boolean }>>([]);

  // 只展示活跃分类
  const activeCategories = categories.filter((c) => c.isActive);

  if (!selectedCategoryId && activeCategories.length > 0) {
    setSelectedCategoryId(activeCategories[0].id);
  }

  if (!selectedAccountId && accounts.length > 0) {
    const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
    setSelectedAccountId(defaultAcc.id);
  }

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
    setItems([...items, { name: '', amount: '', categoryId: selectedCategoryId, shouldInventory: false }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
    
    // 实时汇总金额
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setAmount(total.toFixed(2));
  };

  const handleConfirm = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Toast.show('请输入有效金额');
      return;
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
        type: 'expense',
        memo: memo || undefined,
      };

      if (isSplit && items.length > 0) {
        payload.items = items.map(it => ({
          name: it.name || '未命名项目',
          amount: parseFloat(it.amount) || 0,
          categoryId: it.categoryId,
          shouldInventory: it.shouldInventory
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
        <div className={styles.splitHeader}>
          <span className={styles.splitTitle}>{isSplit ? '拆项目明细' : '快速记账'}</span>
          <span 
            className={styles.splitToggle}
            onClick={() => setIsSplit(!isSplit)}
          >
            {isSplit ? '返回常规' : '拆分项目'}
          </span>
        </div>

        {/* 子项列表 */}
        {isSplit && (
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
                  onClick={() => updateItem(idx, 'shouldInventory', !item.shouldInventory)}
                >
                  📦
                </span>
                <span className={styles.removeBtn} onClick={() => removeItem(idx)}>✕</span>
              </div>
            ))}
            <div className={styles.addItemBtn} onClick={handleAddItem}>
              + 添加子项
            </div>
          </div>
        )}

        {/* 账户选择 */}
        <div className={styles.accountSelection}>
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

        {/* 分类网格 — 从后端拉取 */}
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
