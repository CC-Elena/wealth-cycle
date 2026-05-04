import { Dialog, Popup, Stepper, Toast } from 'antd-mobile';
import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './index.module.css';

interface PayrollGuidanceProps {
  visible: boolean;
  onClose: () => void;
}

export const PayrollGuidance = ({ visible, onClose }: PayrollGuidanceProps) => {
  const store = useFinanceStore();
  const setUIBlocked = useFinanceStore((s) => s.setUIBlocked);
  useEffect(() => {
    setUIBlocked(visible);
  }, [visible, setUIBlocked]);

  const [step, setStep] = useState(1);
  const [payrollAmount, setPayrollAmount] = useState(15000);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const data = await store.getPayrollPreview(payrollAmount);
      setPreview(data);
      setStep(2);
    } catch (err) {
      Toast.show('计算失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      await store.executePayroll({ salaryAmount: payrollAmount });
      Dialog.alert({
        content: `发薪已处理！\n生成可支配资金：¥${preview?.disposableIncomeGenerated?.toLocaleString()}\n预算池已同步补足。`,
        onConfirm: () => {
          setStep(1);
          setPreview(null);
          onClose();
        },
      });
    } catch (err) {
      Toast.show('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      fetchPreview();
    } else if (step === 2) {
      setStep(3);
    } else {
      handleExecute();
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

          {step === 2 && preview && (
            <div className={styles.stepCard}>
              <div className={styles.stepEmoji}>🛡️</div>
              <h2 className={styles.stepTitle}>资金智能分配预览</h2>
              <div className={styles.previewList}>
                <div className={styles.previewItem}>
                  <span>固定账单预留：</span>
                  <span className={styles.previewValue}>
                    -¥{preview.fixedBillsTotal.toLocaleString()}
                  </span>
                </div>
                <div className={styles.previewItem}>
                  <span>预算池补足：</span>
                  <span className={styles.previewValue}>
                    -¥{preview.budgetReplenishmentTotal.toLocaleString()}
                  </span>
                </div>
                <div
                  className={styles.previewItem}
                  style={{
                    borderTop: '1px solid #EEE',
                    marginTop: 8,
                    paddingTop: 8,
                  }}
                >
                  <strong>预计生成可支配：</strong>
                  <strong
                    className={styles.previewValue}
                    style={{ color: '#6C5DD3' }}
                  >
                    ¥{preview.disposableIncomeGenerated.toLocaleString()}
                  </strong>
                </div>
              </div>
              <p
                className={styles.stepDesc}
                style={{ fontSize: '12px', marginTop: 12, opacity: 0.6 }}
              >
                注：系统将自动更新预算周期起止时间。
              </p>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepCard}>
              <div className={styles.stepEmoji}>💧</div>
              <h2 className={styles.stepTitle}>确认注入资金池？</h2>
              <p className={styles.stepDesc}>
                一旦确认，账户网值将增加 ¥{payrollAmount.toLocaleString()}
                ，且所有预算进度将进入新的周期。
              </p>
            </div>
          )}
        </div>

        <div className={styles.payrollFooter}>
          <button
            className={`${styles.btn} ${styles.btnSolid}`}
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? '处理中...' : step === 3 ? '确认执行' : '下一步'}
          </button>
        </div>
      </div>
    </Popup>
  );
};
