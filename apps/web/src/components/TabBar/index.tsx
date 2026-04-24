import {
  BarChart3,
  LayoutDashboard,
  Package,
  ReceiptText,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './index.module.css';

const ICON_SIZE = 22;
const ICON_STROKE = 1.8;

const tabs = [
  { key: '/', label: '控制台', Icon: LayoutDashboard },
  { key: '/analysis', label: '分析', Icon: BarChart3 },
  { key: '/transactions', label: '流水', Icon: ReceiptText },
  { key: '/inventory', label: '库存', Icon: Package },
  { key: '/profile', label: '我的', Icon: UserRound },
];

const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.tabbar}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.key;
        return (
          <button
            type="button"
            key={tab.key}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => navigate(tab.key)}
          >
            <span className={styles.icon}>
              <tab.Icon
                size={ICON_SIZE}
                strokeWidth={isActive ? 2.2 : ICON_STROKE}
              />
            </span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
