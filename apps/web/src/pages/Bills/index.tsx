import { useState, useEffect } from 'react';
import { Modal, Toast, Dialog } from 'antd-mobile';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

const Bills = () => {
  const store = useFinanceStore();
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'monthly',
  });

  useEffect(() => {
    store.fetchFixedBills();
    store.fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!formData.name || !formData.amount) {
      Toast.show('请填写完整信息');
      return;
    }

    try {
      await store.createFixedBillOnServer({
        name: formData.name,
        amount: parseFloat(formData.amount),
        type: formData.type,
      });
      Toast.show({ icon: 'success', content: '添加成功' });
      setIsAddVisible(false);
      setFormData({ name: '', amount: '', type: 'monthly' });
    } catch (error) {
      Toast.show({ icon: 'fail', content: '添加失败' });
    }
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定要删除这笔固定账单吗？',
      onConfirm: async () => {
        try {
          await store.deleteFixedBillOnServer(id);
          Toast.show({ icon: 'success', content: '已删除' });
        } catch (error) {
          Toast.show({ icon: 'fail', content: '删除失败' });
        }
      },
    });
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>固定账单</h1>
        <div className={styles.addBtn} onClick={() => setIsAddVisible(true)}>+</div>
      </header>

      <div className={styles.billList}>
        {store.fixedBills.length === 0 ? (
          <div className={styles.emptyState}>暂无固定账单，点击右上角添加</div>
        ) : (
          store.fixedBills.map((bill) => (
            <div key={bill.id} className={styles.billCard}>
              <div className={styles.billInfo}>
                <div className={styles.billName}>{bill.name}</div>
                <div className={styles.billType}>
                  {bill.type === 'monthly' ? '按月' : '按年'}
                </div>
              </div>
              <div className={styles.billRight}>
                <div className={styles.billAmount}>¥{bill.amount.toLocaleString()}</div>
                <div className={styles.deleteBtn} onClick={() => handleDelete(bill.id)}>删除</div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        visible={isAddVisible}
        content={
          <div className={styles.modalContent}>
            <div className={styles.field}>
              <label>账单名称</label>
              <input
                className={styles.input}
                placeholder="例如：房租、网费"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>金额</label>
              <input
                className={styles.input}
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>计费周期</label>
              <select
                className={styles.select}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="monthly">按月</option>
                <option value="yearly">按年</option>
              </select>
            </div>
            <button className={styles.submitBtn} onClick={handleAdd}>确认添加</button>
          </div>
        }
        closeOnAction
        onClose={() => setIsAddVisible(false)}
        showCloseButton
        title="添加固定支出"
      />
    </div>
  );
};

export default Bills;
