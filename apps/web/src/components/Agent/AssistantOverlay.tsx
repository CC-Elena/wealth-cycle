import { useState } from 'react';
import { FloatingBubble } from 'antd-mobile';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

export const AssistantOverlay = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <FloatingBubble
        style={{
          '--initial-side-distance': '24px',
          '--initial-bottom-distance': '100px',
          '--z-index': '1000',
        }}
        onClick={() => setVisible(true)}
      >
        <MessageCircle size={32} color="white" />
      </FloatingBubble>

      <ChatPanel visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};
