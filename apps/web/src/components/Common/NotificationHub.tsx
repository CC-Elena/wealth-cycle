import { Badge, Button, List, Popover, Space } from 'antd-mobile';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckSquare,
  ChevronRight,
  Info,
  Package,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import {
  type Notification,
  useNotificationStore,
} from '../../stores/notificationStore';

export const NotificationHub = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const { currentLedgerId } = useFinanceStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchNotifications(currentLedgerId);
    // 轮询：每 2 分钟更新一次
    const interval = setInterval(
      () => fetchNotifications(currentLedgerId),
      120000,
    );
    return () => clearInterval(interval);
  }, [currentLedgerId, fetchNotifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'budget_overdraft':
        return <AlertTriangle size={18} color="#ff4d4f" />;
      case 'inventory_alert':
        return <Package size={18} color="#fa8c16" />;
      case 'payroll_reminder':
        return <Calendar size={18} color="#1677ff" />;
      default:
        return <Info size={18} color="#999" />;
    }
  };

  const content = (
    <div
      style={{
        width: '300px',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>通知中心</span>
        {unreadCount > 0 && (
          <Button
            fill="none"
            size="mini"
            onClick={() => markAllAsRead(currentLedgerId)}
            style={{ fontSize: '12px', padding: '0 4px', color: '#666' }}
          >
            全部忽略
          </Button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
            }}
          >
            暂无通知
          </div>
        ) : (
          <List>
            {notifications.map((n) => (
              <List.Item
                key={n.id}
                prefix={getIcon(n.type)}
                onClick={() => {
                  if (!n.isRead) markAsRead(n.id);
                  // Optional: navigate to relevant page based on n.data
                }}
                style={{
                  backgroundColor: n.isRead
                    ? 'transparent'
                    : 'rgba(22, 119, 255, 0.05)',
                  '--padding-left': '12px',
                }}
                description={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        lineHeight: '1.4',
                      }}
                    >
                      {n.message}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#999',
                        whiteSpace: 'nowrap',
                        marginLeft: '8px',
                      }}
                    >
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                }
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: n.isRead ? 'normal' : 'bold',
                  }}
                >
                  {n.title}
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      visible={visible}
      onVisibleChange={setVisible}
    >
      <div style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}>
        <Bell size={24} />
        {unreadCount > 0 && (
          <Badge
            content={unreadCount > 99 ? '99+' : unreadCount}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              '--z-index': '10',
            }}
          />
        )}
      </div>
    </Popover>
  );
};
