import { useState, useRef, useEffect } from 'react';
import { Popup, Button, Input, TextArea, Toast, SpinLoading } from 'antd-mobile';
import { useFinanceStore } from '../../stores/financeStore';
import { X, Send, Robot, User } from 'lucide-react';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  visible: boolean;
  onClose: () => void;
}

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
    await store.askAgent(msg);
  };

  const handleAcceptProposal = async (toolCall: any) => {
    const args = JSON.parse(toolCall.function.arguments);
    try {
      await store.createTransactionOnServer({
        amount: args.amount,
        categoryId: args.categoryId,
        type: args.type,
        memo: args.memo,
      });
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
          <div className={styles.headerTitle}>TwinLedger AI 助手</div>
          <button onClick={() => store.clearChat()} className={styles.clearBtn}>
            清除
          </button>
        </header>

        <div className={styles.messageList} ref={scrollRef}>
          {store.chatMessages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🤖</div>
              <h3>我是您的财务管家</h3>
              <p>您可以试着对我说：<br/>“今天午餐花了35元”<br/>“帮我记一笔交通支出50元”</p>
            </div>
          )}

          {store.chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.messageWrapper} ${
                msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
              }`}
            >
              <div className={styles.avatar}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={styles.messageContent}>
                {msg.content && <div className={styles.bubble}>{msg.content}</div>}
                
                {msg.toolCalls?.map((tc: any) => {
                  if (tc.function.name === 'create_transaction') {
                    const args = JSON.parse(tc.function.arguments);
                    const cat = store.categories.find(c => c.id === args.categoryId);
                    return (
                        <div key={tc.id} className={styles.proposalCard}>
                          <div className={styles.proposalHeader}>
                            <span>记账提议</span>
                            <span className={args.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                              {args.type === 'expense' ? '-' : '+'}¥{args.amount}
                            </span>
                          </div>
                          <div className={styles.proposalInfo}>
                            <div>分类：{cat?.name || '未知'} {cat?.icon}</div>
                            {args.memo && <div>备注：{args.memo}</div>}
                          </div>
                          <Button
                            block
                            color="primary"
                            size="small"
                            onClick={() => handleAcceptProposal(tc)}
                          >
                            确认记录
                          </Button>
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
               placeholder="说点什么..."
               value={inputValue}
               onChange={setInputValue}
               onEnterPress={handleSend}
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
