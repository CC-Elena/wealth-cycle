import { Popup, Stepper, Toast } from 'antd-mobile';
import { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import styles from './sheets.module.css';

interface LotActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actionType: 'consume' | 'discard';
  lotId: string;
  tplName: string;
  baseUnit: string;
  maxQty: number;
}

export const LotActionSheet = ({
  visible,
  onClose,
  actionType,
  lotId,
  tplName,
  baseUnit,
  maxQty,
}: LotActionSheetProps) => {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('过期异味');
  const { consumeStock, discardStock } = useInventoryStore();

  const isConsume = actionType === 'consume';

  const handleConfirm = () => {
    if (qty <= 0) {
      Toast.show('请输入正确数量');
      return;
    }

    if (isConsume) {
      consumeStock(lotId, qty);
      Toast.show({ icon: 'success', content: '消耗已记录' });
    } else {
      discardStock(lotId, qty, reason);
      Toast.show({ icon: 'success', content: '浪费已记录，请注意适量采购' });
    }
    onClose();
    setQty(1);
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
      <div className={styles.sheetWrapper}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>
            {isConsume ? '记录消耗' : '记录浪费丢弃'}
          </div>
          <button onClick={onClose} style={{ fontSize: 24, color: '#999' }}>
            ×
          </button>
        </div>

        <div className={styles.sheetContext}>
          <div className={styles.contextIcon}>{isConsume ? '🍽️' : '🗑️'}</div>
          <div>
            正在处理：<strong>{tplName}</strong> (当前剩余 {maxQty} {baseUnit})
          </div>
        </div>

        <div className={styles.sheetFormGroup}>
          <div className={styles.sheetLabel}>
            {isConsume ? '本次消耗了多少？' : '本次扔掉了多少？'}
          </div>
          <Stepper
            value={qty}
            onChange={(v) => setQty(v || 0)}
            min={1}
            max={maxQty}
            style={{
              '--input-width': '80px',
              '--button-font-size': '24px',
              '--input-font-size': '20px',
            }}
          />
        </div>

        {!isConsume && (
          <div className={styles.sheetFormGroup} style={{ marginTop: 12 }}>
            <div className={styles.sheetLabel}>丢弃原因</div>
            <div className={styles.actionOptions}>
              {['过期异味', '长毛变质', '包装破损', '口味不佳'].map((r) => (
                <div
                  key={r}
                  className={`${styles.optionPill} ${reason === r ? styles.dangerActive : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={`${styles.btnSolid} ${!isConsume ? styles.btnDanger : ''}`}
          onClick={handleConfirm}
        >
          {isConsume ? '确认消耗' : '确认丢弃'}
        </button>
      </div>
    </Popup>
  );
};
