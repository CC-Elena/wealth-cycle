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
  const createTransactionOnServer = useFinanceStore((s) => s.createTransactionOnServer);

  // 只展示活跃分类
  const activeCategories = categories.filter((c) => c.isActive);

  // 首次渲染时若还没选中，则默认选第一个
  if (!selectedCategoryId && activeCategories.length > 0) {
    setSelectedCategoryId(activeCategories[0].id);
  }

  const handleInput = (v: string) => {
    if (v === 'BACKSPACE') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (v === '.') {
      // 防止重复小数点
      if (amount.includes('.')) return;
      setAmount((prev) => prev + '.');
    } else {
      setAmount((prev) => (prev === '0' ? v : prev + v));
    }
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
      await createTransactionOnServer({
        amount: num,
        categoryId: selectedCategoryId,
        type: 'expense',
        memo: memo || undefined,
      });
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
