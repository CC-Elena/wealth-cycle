import { Button, Modal } from 'antd-mobile';
import type React from 'react';
import { useEffect, useState } from 'react';
import styles from './PWAInstallGuide.module.css';

const PWAInstallGuide: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. 检测是否是 iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // 2. 检测是否已经在 Standalone 模式 (已安装)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    // 3. 只有 iOS 且非安装状态才显示引导
    if (isIOS && !isStandalone) {
      // 检查上次提醒时间，避免频繁打扰 (可选)
      const lastShown = localStorage.getItem('pwa_guide_last_shown');
      const now = Date.now();
      if (!lastShown || now - parseInt(lastShown) > 1000 * 60 * 60 * 24 * 3) {
        // 3天提醒一次
        setVisible(true);
        localStorage.setItem('pwa_guide_last_shown', now.toString());
      }
    }
  }, []);

  return (
    <Modal
      visible={visible}
      content={
        <div className={styles.container}>
          <div className={styles.icon}>📲</div>
          <h3 className={styles.title}>安装 TwinLedger</h3>
          <p className={styles.desc}>
            为了获得最佳的记账体验和离线支持，建议将应用添加到主屏幕。
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              点击浏览器底部的 <span className={styles.shareIcon}>⎋</span>{' '}
              (分享按钮)
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              向上滑动并点击 <b>“添加到主屏幕”</b>
            </div>
          </div>
          <Button
            block
            color="primary"
            onClick={() => setVisible(false)}
            className={styles.closeBtn}
          >
            我知道了
          </Button>
        </div>
      }
      onClose={() => setVisible(false)}
      bodyStyle={{
        borderRadius: '20px',
        padding: '24px',
      }}
    />
  );
};

export default PWAInstallGuide;
