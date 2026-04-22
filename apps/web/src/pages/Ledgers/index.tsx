import React, { useState } from 'react';
import { NavBar, List, Modal, Input, Button, Toast, SpinLoading } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

const Ledgers = () => {
  const store = useFinanceStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (id: string) => {
    if (id === store.currentLedgerId) return;
    setIsSwitching(true);
    try {
      await store.switchLedger(id);
      Toast.show({ icon: 'success', content: '账本切换成功' });
      navigate(-1);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreate = async () => {
    if (!newLedgerName.trim()) {
      Toast.show('请输入账本名称');
      return;
    }
    setIsCreating(true);
    try {
      await store.createLedgerOnServer({ name: newLedgerName });
      Toast.show({ icon: 'success', content: '新建账本成功' });
      setIsModalOpen(false);
      setNewLedgerName('');
    } catch (error) {
      Toast.show({ icon: 'fail', content: '创建失败' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page-container">
      <NavBar onBack={() => navigate(-1)} backArrow={true}>
        账本管理
      </NavBar>

      <div className={styles.content}>
        <div className={styles.sectionTitle}>上帝视角</div>
        <div
          className={`${styles.ledgerCard} ${styles.globalCard} ${
            store.currentLedgerId === 'global' ? styles.active : ''
          }`}
          onClick={() => handleSwitch('global')}
        >
          <div className={styles.ledgerIcon}>🌍</div>
          <div className={styles.ledgerMain}>
            <div className={styles.ledgerHeader}>
              <span className={styles.name}>全局资产概览</span>
              {store.currentLedgerId === 'global' && (
                <span className={styles.badge}>当前活跃</span>
              )}
            </div>
            <div className={styles.ledgerBalance}>
              总资产估值: ¥{store.ledgers.reduce((sum, l) => sum + (l.netWorth || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className={styles.checkIcon}>
            {store.currentLedgerId === 'global' ? '✓' : '❯'}
          </div>
        </div>

        <div className={styles.sectionTitle}>独立账本</div>
        <div className={styles.ledgerList}>
          {store.ledgers.map((ledger) => (
            <div
              key={ledger.id}
              className={`${styles.ledgerCard} ${
                store.currentLedgerId === ledger.id ? styles.active : ''
              }`}
              onClick={() => handleSwitch(ledger.id)}
            >
              <div className={styles.ledgerIcon}>{ledger.icon}</div>
              <div className={styles.ledgerMain}>
                <div className={styles.ledgerHeader}>
                  <span className={styles.name}>{ledger.name}</span>
                  {store.currentLedgerId === ledger.id && (
                    <span className={styles.badge}>当前活跃</span>
                  )}
                </div>
                <div className={styles.ledgerBalance}>
                  资产: ¥{ledger.netWorth?.toLocaleString() || '0'}
                </div>
              </div>
              <div className={styles.checkIcon}>
                {store.currentLedgerId === ledger.id ? '✓' : '❯'}
              </div>
            </div>
          ))}
        </div>

        <Button
          block
          color="primary"
          className={styles.addBtn}
          onClick={() => setIsModalOpen(true)}
        >
          + 新建独立账本
        </Button>
      </div>

      <Modal
        visible={isModalOpen}
        content={
          <div className={styles.modalContent}>
            <h3>新建账本</h3>
            <Input
              placeholder="例如：装修专项、副业账本"
              value={newLedgerName}
              onChange={setNewLedgerName}
              className={styles.modalInput}
            />
          </div>
        }
        closeOnAction
        onClose={() => setIsModalOpen(false)}
        actions={[
          {
            key: 'cancel',
            text: '取消',
          },
          {
            key: 'confirm',
            text: isCreating ? <SpinLoading color="primary" /> : '确定',
            bold: true,
            onClick: handleCreate,
          },
        ]}
      />

      {isSwitching && (
        <div className={styles.loadingOverlay}>
          <SpinLoading color="white" />
          <p>正在切换上下文...</p>
        </div>
      )}
    </div>
  );
};

export default Ledgers;
