import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

export const AssistantOverlay = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div 
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: '86px',
          // 逻辑：在宽屏下尽量贴合 480px 容器右侧，在窄屏下距离右边 16px
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
        <MessageCircle size={28} color="white" />
      </div>

      <ChatPanel visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};
