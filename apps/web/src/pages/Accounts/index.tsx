import { Button, Dialog, Form, Input, Popup, Toast } from 'antd-mobile';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

export default function AccountsPage() {
  const store = useFinanceStore();
  const navigate = useNavigate();
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    store.fetchAccounts();
  }, []);

  const openForm = (acc?: any) => {
    if (acc) {
      setEditingId(acc.id);
      form.setFieldsValue(acc);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsPopupVisible(true);
  };

  const closeForm = () => {
    setIsPopupVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        balance: parseFloat(values.balance || 0),
        isDefault: values.isDefault || false,
        icon: values.icon || '🏦',
        color: values.color || '#4facfe',
        type: values.type || 'bank',
      };
      if (editingId) {
        await store.updateAccount(editingId, data);
        Toast.show({ icon: 'success', content: '更新成功' });
      } else {
        await store.createAccount(data);
        Toast.show({ icon: 'success', content: '创建成功' });
      }
      closeForm();
    } catch (e) {
      Toast.show({ icon: 'fail', content: '操作失败' });
    }
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确认删除此账户？',
      onConfirm: async () => {
        try {
          await store.deleteAccount(id);
          Toast.show({ icon: 'success', content: '已删除' });
        } catch (e) {
          Toast.show({
            icon: 'fail',
            content: '删除失败，请确保该账户下无交易',
          });
        }
      },
    });
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ‹
        </button>
        <div className={styles.title}>我的账户</div>
        <button onClick={() => openForm()} className={styles.addBtn}>
          新增
        </button>
      </div>

      <div className={styles.list}>
        {store.accounts.length === 0 && (
          <div className={styles.empty}>暂无账户，请点击新增</div>
        )}
        {store.accounts.map((acc) => (
          <div key={acc.id} className={styles.accountCard}>
            <div
              className={styles.accountIcon}
              style={{ background: acc.color }}
            >
              {acc.icon}
            </div>
            <div className={styles.accountInfo}>
              <div className={styles.accountName}>
                {acc.name}{' '}
                {acc.isDefault && <span className={styles.tag}>默认</span>}
              </div>
              <div className={styles.accountBalance}>
                ¥{acc.balance.toFixed(2)}
              </div>
            </div>
            <div className={styles.actions}>
              <button onClick={() => openForm(acc)}>编辑</button>
              <button
                onClick={() => handleDelete(acc.id)}
                className={styles.danger}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <Popup
        visible={isPopupVisible}
        onMaskClick={closeForm}
        bodyStyle={{
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          minHeight: '40vh',
        }}
      >
        <div className={styles.formContainer}>
          <h3>{editingId ? '编辑账户' : '新增账户'}</h3>
          <Form
            form={form}
            onFinish={handleSubmit}
            footer={
              <Button block type="submit" color="primary" size="large">
                保存
              </Button>
            }
          >
            <Form.Item name="name" label="名称" rules={[{ required: true }]}>
              <Input placeholder="例如：招商银行、支付宝" />
            </Form.Item>
            <Form.Item
              name="balance"
              label="当前余额"
              rules={[{ required: true }]}
            >
              <Input type="number" placeholder="0.00" />
            </Form.Item>
            <Form.Item name="icon" label="Emoji 图标">
              <Input placeholder="🏦" />
            </Form.Item>
          </Form>
        </div>
      </Popup>
    </div>
  );
}
