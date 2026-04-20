import { useState } from 'react';
import { Popup, Toast, Stepper } from 'antd-mobile';
import { useInventoryStore } from '../../stores/inventoryStore';
import type { StorageMode } from '../../types';
import styles from './sheets.module.css';

interface StockInSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const StockInSheet = ({ visible, onClose }: StockInSheetProps) => {
  const { templates, stations, stockIn } = useInventoryStore();
  const [selectedTplId, setSelectedTplId] = useState(templates[0]?.id || '');
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [storageMode, setStorageMode] = useState<StorageMode>('refrigerated');

  const selectedTpl = templates.find(t => t.id === selectedTplId);

  const handleConfirm = () => {
    if (!selectedTplId || !selectedStationId || qty <= 0) {
      Toast.show('请完善入库信息');
      return;
    }

    // 自动推算过期日 (当前简易处理：当日 + 默认保质期天数)
    const shelfLife = selectedTpl?.defaultShelfLifeDays || 7;
    const expireDateIso = new Date(Date.now() + 1000 * 3600 * 24 * shelfLife).toISOString();

    stockIn({
      itemId: selectedTplId,
      stationId: selectedStationId,
      storageMode,
      initialQuantity: qty,
      purchaseDate: new Date().toISOString(),
      expireDate: expireDateIso,
      remark: '快捷入库'
    });

    Toast.show({ icon: 'success', content: '入库成功' });
    onClose();
  };

  return (
    <Popup visible={visible} onMaskClick={onClose} bodyStyle={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px', backgroundColor: '#fff', height: '80vh' }}>
      <div className={styles.sheetWrapper} style={{ height: '100%', overflowY: 'auto' }}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>快速入库</div>
          <button onClick={onClose} style={{fontSize: 24, color: '#999'}}>×</button>
        </div>

        <div className={styles.sheetFormGroup}>
          <div className={styles.sheetLabel}>选择物品模板</div>
          <div className={styles.actionOptions}>
            {templates.map(t => (
              <div 
                key={t.id}
                className={`${styles.optionPill} ${selectedTplId === t.id ? styles.optionActive : ''}`}
                onClick={() => {
                  setSelectedTplId(t.id);
                  setStorageMode(t.defaultStorageMode); // 自动带出默认储存方式
                }}
              >
                {t.icon} {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sheetFormGroup}>
          <div className={styles.sheetLabel}>入库数量 ({selectedTpl?.baseUnit || '份'})</div>
          <Stepper 
            value={qty} 
            onChange={v => setQty(v || 0)} 
            min={1} 
            style={{ '--button-font-size': '24px', '--input-font-size': '20px' }}
          />
        </div>

        <div className={styles.sheetFormGroup}>
          <div className={styles.sheetLabel}>实际存放形态</div>
          <div className={styles.actionOptions}>
            {[
              { val: 'room_temperature', label: '常温' },
              { val: 'refrigerated', label: '冷藏' },
              { val: 'frozen', label: '冷冻' }
            ].map(m => (
              <div 
                key={m.val}
                className={`${styles.optionPill} ${storageMode === m.val ? styles.optionActive : ''}`}
                onClick={() => setStorageMode(m.val as StorageMode)}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sheetFormGroup}>
          <div className={styles.sheetLabel}>选择存放区域</div>
          <div className={styles.actionOptions}>
            {stations.map(s => (
              <div 
                key={s.id}
                className={`${styles.optionPill} ${selectedStationId === s.id ? styles.optionActive : ''}`}
                onClick={() => setSelectedStationId(s.id)}
              >
                {s.icon} {s.name}
              </div>
            ))}
          </div>
        </div>

        <button className={styles.btnSolid} onClick={handleConfirm} style={{marginTop: 'auto'}}>
          确认生成批次
        </button>
      </div>
    </Popup>
  );
};
