import React, { useState } from 'react';
import { Switch, Toast } from 'antd-mobile';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';
import ky from 'ky';
import { UserSchema } from '@stock/shared';

const Profile = () => {
  const store = useFinanceStore();
  const [apiResult, setApiResult] = useState<string>('');

  const handleTestApi = async () => {
    try {
      const result = await ky.get('http://localhost:3000/users/test').json();
      const validUser = UserSchema.parse(result);
      Toast.show({ icon: 'success', content: 'API通信且Zod校验成功: ' + validUser.name });
      setApiResult(JSON.stringify(validUser, null, 2));
    } catch (error: any) {
      Toast.show({ icon: 'fail', content: 'API测试失败' });
      setApiResult(error.message);
    }
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.headerRow}>
        <div className={styles.iconBtn}>‹</div>
        <div className={styles.title}>我的</div>
        <div className={styles.iconBtn} onClick={handleTestApi}>⚙️API</div>
      </div>

      <div className={styles.passportCard}>
        <div className={styles.avatarRing}>
          <img
            src={store.profile.avatarUrl}
            alt="Avatar"
            className={styles.avatarImg}
          />
        </div>
        <div className={styles.passportNetWorth}>净资产 (Net Worth)</div>
        <div className={styles.passportAmount}>
          ¥{store.profile.netWorth.toLocaleString()}
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>账户与安全</div>
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>👤</div>
            <div className={styles.itemText}>个人资料</div>
            <div className={styles.itemRight}>❯</div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>🛡️</div>
            <div className={styles.itemText}>安全与隐私</div>
            <div className={styles.itemRight}>❯</div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>📄</div>
            <div className={styles.itemText}>订阅服务</div>
            <div className={styles.itemRight}>❯</div>
          </div>
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>通知与策略</div>
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>🔔</div>
            <div className={styles.itemText}>设备推送提醒</div>
            <div className={styles.itemRight}>
              <Switch
                defaultChecked
                style={{ '--checked-color': 'var(--color-accent)' }}
              />
            </div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>✉️</div>
            <div className={styles.itemText}>临期邮件周报</div>
            <div className={styles.itemRight}>
              <Switch style={{ '--checked-color': 'var(--color-accent)' }} />
            </div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>📊</div>
            <div className={styles.itemText}>开启应急资金预扣</div>
            <div className={styles.itemRight}>
              <Switch
                defaultChecked={store.profile.emergencyFundEnabled}
                style={{ '--checked-color': 'var(--color-accent)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>偏好设置</div>
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>🌐</div>
            <div className={styles.itemText}>语言</div>
            <div className={styles.itemRight}>简体中文 ❯</div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>💰</div>
            <div className={styles.itemText}>货币</div>
            <div className={styles.itemRight}>CNY ¥ ❯</div>
          </div>
          <div className={styles.listItem}>
            <div className={styles.itemIcon}>🌙</div>
            <div className={styles.itemText}>深色模式</div>
            <div className={styles.itemRight}>
              <Switch style={{ '--checked-color': 'var(--color-accent)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
