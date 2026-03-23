import { useState } from 'react';
import { Popup, NumberKeyboard, Toast } from 'antd-mobile';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

interface RecordSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'b1', name: '饮食', icon: '🍔' },
  { id: 'b2', name: '日用', icon: '🛒' },
  { id: 'b3', name: '交通', icon: '🚗' },
  { id: 'b4', name: '娱乐', icon: '🎉' },
  { id: 'other', name: '其他', icon: '📂' },
];

export const RecordSheet = ({ visible, onClose }: RecordSheetProps) => {
  const [amount, setAmount] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    CATEGORIES[0].id,
  );
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const handleInput = (v: string) => {
    if (v === 'BACKSPACE') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else {
      setAmount((prev) => (prev === '0' ? v : prev + v));
    }
  };

  const handleConfirm = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Toast.show('请输入有效金额');
      return;
    }

    addTransaction({
      type: 'expense',
      amount: num,
      categoryId: selectedCategoryId,
      date: new Date().toISOString(),
      memo: '',
      tags: [],
      subItems: [],
    });

    Toast.show({ icon: 'success', content: '记账成功' });
    setAmount('0');
    onClose();
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

        <div className={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
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
