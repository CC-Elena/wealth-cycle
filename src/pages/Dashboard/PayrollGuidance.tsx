import { useState } from 'react';
import { Popup, Stepper, Dialog } from 'antd-mobile';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

interface PayrollGuidanceProps {
  visible: boolean;
  onClose: () => void;
}

export const PayrollGuidance = ({ visible, onClose }: PayrollGuidanceProps) => {
  const [step, setStep] = useState(1);
  const [payrollAmount, setPayrollAmount] = useState(15000);
  const processPayroll = useFinanceStore((s) => s.processPayroll);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      // Done - process
      processPayroll(payrollAmount, new Date().toISOString());
      Dialog.alert({
        content: '发薪已处理，资金已注入可用余额池，尽情分配吧！',
        onConfirm: () => {
          setStep(1);
          onClose();
        },
      });
    }
  };

  return (
    <Popup
      visible={visible}
      position="right"
      bodyStyle={{ width: '100vw', backgroundColor: '#F9F9FB' }}
    >
      <div className={styles.payrollContainer}>
        <div className={styles.payrollHeader}>
          <button onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
          <div className={styles.stepIndicator}>Step {step} of 3</div>
        </div>

        <div className={styles.payrollBody}>
          {step === 1 && (
            <div className={styles.stepCard}>
              <div className={styles.stepEmoji}>🎉</div>
              <h2 className={styles.stepTitle}>又发薪了！本月收入多少？</h2>
              <div className={styles.stepperWrapper}>
                <Stepper
                  value={payrollAmount}
                  onChange={(v) => setPayrollAmount(v || 0)}
                  step={100}
                  min={0}
                  style={{
                    '--button-font-size': '24px',
                    '--input-font-size': '28px',
                  }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepCard}>
              <div className={styles.stepEmoji}>🛡️</div>
              <h2 className={styles.stepTitle}>系统自动拦截预扣资源</h2>
              <p className={styles.stepDesc}>
                已按设定规则锁定应急资金：¥1,000
              </p>
              <p className={styles.stepDesc}>已预扣固定支出：无</p>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepCard}>
              <div className={styles.stepEmoji}>💧</div>
              <h2 className={styles.stepTitle}>可支配池注水完成</h2>
              <p className={styles.stepDesc}>
                剩余 ¥{(payrollAmount - 1000).toLocaleString()} <br />
                已准备好分配至各项预算容器中。
              </p>
            </div>
          )}
        </div>

        <div className={styles.payrollFooter}>
          <button
            className={`${styles.btn} ${styles.btnSolid}`}
            onClick={handleNext}
          >
            {step === 3 ? '完成注入' : '下一步'}
          </button>
        </div>
      </div>
    </Popup>
  );
};
