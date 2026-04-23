import {
  Button,
  Input,
  Popup,
  SpinLoading,
  TextArea,
  Toast,
} from 'antd-mobile';
import ky from 'ky';
import { Globe, Robot, Send, Star, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  visible: boolean;
  onClose: () => void;
}

const ReviewCard = ({
  taskId,
  itemName,
  onSuccess,
}: {
  taskId: string;
  itemName: string;
  onSuccess: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [freq, setFreq] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !freq || loading) return;
    setLoading(true);
    try {
      await ky.post('/api/agent/reviews', {
        json: { taskId, rating, usageFrequency: freq },
      });
      setSubmitted(true);
      onSuccess();
      Toast.show({ content: '感谢您的评价！', icon: 'success' });
    } catch (err) {
      Toast.show({ content: '提交失败，请重试', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.proposalCard} ${styles.reviewCard}`}>
        <div className={styles.processedText}>已完成评价，感谢反馈 ✨</div>
      </div>
    );
  }

  return (
    <div className={`${styles.proposalCard} ${styles.reviewCard}`}>
      <div className={styles.reviewTitle}>
        <span>满意度回访调查</span>
        <Star size={16} fill="#faad14" color="#faad14" />
      </div>
      <div className={styles.proposalInfo}>
        <div style={{ marginBottom: '12px' }}>
          您对项目 <b>{itemName}</b> 的体验如何？
        </div>

        <div className={styles.reviewField}>
          <div className={styles.fieldLabel}>星级评价</div>
          <div className={styles.ratingGroup}>
            {[1, 2, 3, 4, 5].map((num) => (
              <Star
                key={num}
                className={styles.ratingStar}
                size={24}
                fill={num <= rating ? '#faad14' : 'none'}
                color={num <= rating ? '#faad14' : '#ddd'}
                onClick={() => setRating(num)}
              />
            ))}
          </div>
        </div>

        <div className={styles.reviewField}>
          <div className={styles.fieldLabel}>使用频率</div>
          <div className={styles.freqGroup}>
            {['high', 'medium', 'low', 'never'].map((f) => (
              <div
                key={f}
                className={`${styles.freqTag} ${freq === f ? styles.freqTagActive : ''}`}
                onClick={() => setFreq(f)}
              >
                {f === 'high'
                  ? '经常'
                  : f === 'medium'
                    ? '偶尔'
                    : f === 'low'
                      ? '极少'
                      : '从不'}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button
        block
        color="primary"
        size="small"
        loading={loading}
        disabled={rating === 0 || !freq}
        onClick={handleSubmit}
      >
        提交评价
      </Button>
    </div>
  );
};

export const ChatPanel = ({ visible, onClose }: ChatPanelProps) => {
  const store = useFinanceStore();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [store.chatMessages, store.isAgentLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || store.isAgentLoading) return;
    const msg = inputValue;
    setInputValue('');

    // 隐藏键盘：在 H5/移动端环境下发送后手动失去焦点
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      (document.activeElement as HTMLElement)?.blur();
    }

    await store.askAgent(msg);
  };

  const handleAcceptProposal = async (toolCall: any) => {
    try {
      if (toolCall.proposalId) {
        await store.executeProposalOnServer(toolCall.proposalId);
      } else {
        const args = JSON.parse(toolCall.function.arguments);
        await store.createTransactionOnServer({
          amount: args.amount,
          categoryId: args.categoryId,
          type: args.type,
          memo: args.memo,
          items: args.items,
        });
      }
      Toast.show({
        icon: 'success',
        content: '记录成功！',
      });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: '操作失败',
      });
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      await store.rejectProposalOnServer(proposalId);
      Toast.show({
        content: '已忽略该提议',
      });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: '操作失败',
      });
    }
  };

  return (
    <Popup
      visible={visible}
      position="right"
      bodyStyle={{ width: '100vw', backgroundColor: '#F9F9FB' }}
    >
      <div className={styles.chatContainer}>
        <header className={styles.header}>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
          <div className={styles.headerTitle}>
            TwinLedger AI 助手
            {store.currentLedgerId === 'global' && (
              <span className={styles.globalBadge}>GLOBAL</span>
            )}
          </div>
          <button onClick={() => store.clearChat()} className={styles.clearBtn}>
            清除
          </button>
        </header>

        {store.currentLedgerId === 'global' && (
          <div className={styles.globalStatusBar}>
            <Globe size={14} className={styles.globalIcon} />
            正在以“全局视角”管理用户名下所有账本
          </div>
        )}

        <div className={styles.messageList} ref={scrollRef}>
          {store.chatMessages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🤖</div>
              <h3>我是您的财务管家</h3>
              <p>
                您可以试着对我说：
                <br />
                “今天午餐花了35元”
                <br />
                “帮我记一笔交通支出50元”
              </p>
            </div>
          )}

          {store.chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.messageWrapper} ${
                msg.role === 'user'
                  ? styles.userWrapper
                  : styles.assistantWrapper
              }`}
            >
              <div className={styles.avatar}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={styles.messageContent}>
                {msg.content && (
                  <div className={styles.bubble}>{msg.content}</div>
                )}

                {msg.toolCalls?.map((tc: any) => {
                  if (tc.function.name === 'create_transaction') {
                    const args = JSON.parse(tc.function.arguments);
                    const cat = store.categories.find(
                      (c) => c.id === args.categoryId,
                    );
                    const proposal = tc.proposalId
                      ? store.pendingProposals.find(
                          (p) => p.id === tc.proposalId,
                        )
                      : null;
                    const isProcessed = tc.proposalId && !proposal; // 如果有 ID 但不在 pending 列表中，说明已处理

                    return (
                      <div
                        key={tc.id}
                        className={`${styles.proposalCard} ${args.isImpulse ? styles.impulseCard : ''}`}
                      >
                        <div className={styles.proposalHeader}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span>
                              {tc.proposalId ? '暂存提议' : '快捷记录'}
                            </span>
                            {args.isImpulse && (
                              <span className={styles.warningBadge}>
                                冷静期建议
                              </span>
                            )}
                          </div>
                          <span
                            className={
                              args.type === 'expense'
                                ? styles.expenseText
                                : styles.incomeText
                            }
                          >
                            {args.type === 'expense' ? '-' : '+'}¥{args.amount}
                          </span>
                        </div>
                        <div className={styles.proposalInfo}>
                          <div>
                            分类：{cat?.name || '未知'} {cat?.icon}
                          </div>
                          {args.memo && <div>备注：{args.memo}</div>}

                          {args.isImpulse && (
                            <div className={styles.warningText}>
                              ⚠️ 本次支出超过您可支配资金的 80%，建议冷静。
                            </div>
                          )}

                          {args.items && args.items.length > 0 && (
                            <div className={styles.itemsList}>
                              <div className={styles.itemsHeader}>
                                包含子项：
                              </div>
                              {args.items.map((item: any, i: number) => (
                                <div key={i} className={styles.itemRow}>
                                  <span>
                                    {item.name}{' '}
                                    {item.quantity > 1
                                      ? `x${item.quantity}`
                                      : ''}
                                  </span>
                                  <span>¥{item.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {isProcessed ? (
                          <div className={styles.processedText}>已确认入账</div>
                        ) : (
                          <div className={styles.actionGroup}>
                            <Button
                              block
                              color={args.isImpulse ? 'default' : 'primary'}
                              size="small"
                              onClick={() => handleAcceptProposal(tc)}
                            >
                              {args.isImpulse ? '跳过冷静期并买入' : '确认记录'}
                            </Button>
                            {tc.proposalId && (
                              <Button
                                block
                                size="small"
                                onClick={() =>
                                  handleRejectProposal(tc.proposalId)
                                }
                              >
                                {args.isImpulse ? '暂不购买' : '忽略'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (tc.function.name === 'reallocate_budget') {
                    const args = JSON.parse(tc.function.arguments);
                    const fromBudget = store.budgets.find(
                      (b) => b.id === args.fromBudgetId,
                    );
                    const toBudget = store.budgets.find(
                      (b) => b.id === args.toBudgetId,
                    );
                    const proposal = tc.proposalId
                      ? store.pendingProposals.find(
                          (p) => p.id === tc.proposalId,
                        )
                      : null;
                    const isProcessed = tc.proposalId && !proposal;

                    return (
                      <div key={tc.id} className={styles.proposalCard}>
                        <div className={styles.proposalHeader}>
                          <span>预算调剂提议</span>
                          <span className={styles.incomeText}>
                            ¥{args.amount}
                          </span>
                        </div>
                        <div className={styles.proposalInfo}>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>从：</span>
                            <span>
                              {args.fromBudgetId
                                ? fromBudget?.name || '未知预算'
                                : '💰 可支配收入'}
                            </span>
                          </div>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>到：</span>
                            <span>{toBudget?.name || '未知预算'}</span>
                          </div>
                          {args.reason && (
                            <div className={styles.reasonText}>
                              {args.reason}
                            </div>
                          )}
                        </div>

                        {isProcessed ? (
                          <div className={styles.processedText}>已执行调剂</div>
                        ) : (
                          <div className={styles.actionGroup}>
                            <Button
                              block
                              color="primary"
                              size="small"
                              onClick={() => handleAcceptProposal(tc)}
                            >
                              确认调剂
                            </Button>
                            <Button
                              block
                              size="small"
                              onClick={() =>
                                handleRejectProposal(tc.proposalId)
                              }
                            >
                              忽略
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (tc.function.name === 'submit_review') {
                    const args = JSON.parse(tc.function.arguments);
                    return (
                      <ReviewCard
                        key={tc.id}
                        taskId={args.taskId}
                        itemName={args.itemName}
                        onSuccess={() => {}}
                      />
                    );
                  }

                  if (tc.function.name === 'consume_item') {
                    const args = JSON.parse(tc.function.arguments);
                    const proposal = tc.proposalId
                      ? store.pendingProposals.find(
                          (p) => p.id === tc.proposalId,
                        )
                      : null;
                    const isProcessed = tc.proposalId && !proposal;

                    return (
                      <div key={tc.id} className={styles.proposalCard}>
                        <div className={styles.proposalHeader}>
                          <span>库存消耗提议</span>
                          <span className={styles.expenseText}>
                            -{args.quantity}
                          </span>
                        </div>
                        <div className={styles.proposalInfo}>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>物项：</span>
                            <span>{args.itemName}</span>
                          </div>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>操作：</span>
                            <span>标记为已消耗</span>
                          </div>
                        </div>

                        {isProcessed ? (
                          <div className={styles.processedText}>已确认消耗</div>
                        ) : (
                          <div className={styles.actionGroup}>
                            <Button
                              block
                              color="primary"
                              size="small"
                              onClick={() => handleAcceptProposal(tc)}
                            >
                              确认消耗
                            </Button>
                            <Button
                              block
                              size="small"
                              onClick={() =>
                                handleRejectProposal(tc.proposalId)
                              }
                            >
                              忽略
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (tc.function.name === 'transfer_to_savings') {
                    const args = JSON.parse(tc.function.arguments);
                    const proposal = tc.proposalId
                      ? store.pendingProposals.find(
                          (p) => p.id === tc.proposalId,
                        )
                      : null;
                    const isProcessed = tc.proposalId && !proposal;

                    return (
                      <div key={tc.id} className={styles.proposalCard}>
                        <div className={styles.proposalHeader}>
                          <span>资金划转提议</span>
                          <span className={styles.incomeText}>
                            ¥{args.amount}
                          </span>
                        </div>
                        <div className={styles.proposalInfo}>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>目标：</span>
                            <span>
                              {args.category === 'emergency'
                                ? '应急金'
                                : '储蓄'}
                            </span>
                          </div>
                          {args.reason && (
                            <div className={styles.reasonText}>
                              {args.reason}
                            </div>
                          )}
                        </div>

                        {isProcessed ? (
                          <div className={styles.processedText}>已执行划转</div>
                        ) : (
                          <div className={styles.actionGroup}>
                            <Button
                              block
                              color="primary"
                              size="small"
                              onClick={() => handleAcceptProposal(tc)}
                            >
                              确认划转
                            </Button>
                            <Button
                              block
                              size="small"
                              onClick={() =>
                                handleRejectProposal(tc.proposalId)
                              }
                            >
                              忽略
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (tc.function.name === 'withdraw_emergency_fund') {
                    const args = JSON.parse(tc.function.arguments);
                    const proposal = tc.proposalId
                      ? store.pendingProposals.find(
                          (p) => p.id === tc.proposalId,
                        )
                      : null;
                    const isProcessed = tc.proposalId && !proposal;

                    return (
                      <div
                        key={tc.id}
                        className={`${styles.proposalCard} ${styles.impulseCard}`}
                      >
                        <div className={styles.proposalHeader}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span>应急金提取请求</span>
                            <span className={styles.warningBadge}>
                              风险操作
                            </span>
                          </div>
                          <span className={styles.expenseText}>
                            ¥{args.amount}
                          </span>
                        </div>
                        <div className={styles.proposalInfo}>
                          <div className={styles.warningText}>
                            ⚠️ 提取应急金将降低您的防风险能力。
                          </div>
                          <div className={styles.reallocRow}>
                            <span className={styles.reallocLabel}>理由：</span>
                            <span style={{ color: '#E53E3E', fontWeight: 600 }}>
                              {args.reason}
                            </span>
                          </div>
                        </div>

                        {isProcessed ? (
                          <div className={styles.processedText}>
                            已记录动用理由
                          </div>
                        ) : (
                          <div className={styles.actionGroup}>
                            <Button
                              block
                              color="danger"
                              size="small"
                              onClick={() => handleAcceptProposal(tc)}
                            >
                              确认提取
                            </Button>
                            <Button
                              block
                              size="small"
                              onClick={() =>
                                handleRejectProposal(tc.proposalId)
                              }
                            >
                              取消
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}

          {store.isAgentLoading && (
            <div className={styles.assistantWrapper}>
              <div className={styles.avatar}>🤖</div>
              <div className={styles.loadingBubble}>
                <SpinLoading color="primary" style={{ '--size': '20px' }} />
              </div>
            </div>
          )}
        </div>

        <footer className={styles.inputFooter}>
          <div className={styles.inputWrapper}>
            <Input
              placeholder="通过对话记账、查询..."
              value={inputValue}
              onChange={setInputValue}
              onEnterPress={handleSend}
              autoFocus={!/Mobi|Android|iPhone/i.test(navigator.userAgent)}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!inputValue.trim() || store.isAgentLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>
    </Popup>
  );
};
