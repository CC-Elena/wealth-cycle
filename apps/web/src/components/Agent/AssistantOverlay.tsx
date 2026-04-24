import { useEffect, useState } from 'react';
import { Badge } from 'antd-mobile';
import { Globe, MessageCircle } from 'lucide-react';
import { useFinanceStore } from '../../stores/financeStore';
import { ChatPanel } from './ChatPanel';

export const AssistantOverlay = () => {
  const [visible, setVisible] = useState(false);
  const { pendingProposals, fetchProposals, currentLedgerId } =
    useFinanceStore();
  const isGlobal = currentLedgerId === 'global';

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
          backgroundColor: isGlobal ? '#FFD700' : '#6C5DD3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isGlobal
            ? '0 4px 16px rgba(255, 215, 0, 0.4)'
            : '0 4px 16px rgba(108, 93, 211, 0.4)',
          zIndex: 2000,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: visible ? 'scale(0)' : 'scale(1)',
        }}
      >
        <Badge
          content={pendingProposals.length > 0 ? pendingProposals.length : null}
          style={{ '--right': '2px', '--top': '2px' }}
        >
          {isGlobal ? (
            <Globe size={28} color="#000" />
          ) : (
            <MessageCircle size={28} color="white" />
          )}
        </Badge>
      </div>

      <ChatPanel visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};
