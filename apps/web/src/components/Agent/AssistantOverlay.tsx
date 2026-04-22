import { useState, useEffect } from 'react';
import { Badge } from 'antd-mobile';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { useFinanceStore } from '../../stores/financeStore';

export const AssistantOverlay = () => {
  const [visible, setVisible] = useState(false);
  const { pendingProposals, fetchProposals } = useFinanceStore();

  useEffect(() => {
    fetchProposals();
  }, []);

  return (
    <>
      <div 
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: '86px',
          right: 'max(16px, calc((100vw - 480px) / 2 + 16px))',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#6C5DD3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(108, 93, 211, 0.4)',
          zIndex: 2000,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
      >
        <Badge content={pendingProposals.length > 0 ? pendingProposals.length : null} style={{ '--right': '2px', '--top': '2px' }}>
          <MessageCircle size={28} color="white" />
        </Badge>
      </div>

      <ChatPanel visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};
