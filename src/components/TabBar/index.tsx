import { useLocation, useNavigate } from 'react-router-dom';
import styles from './index.module.css';

const tabs = [
  { key: '/', label: '控制台', icon: '📊' },
  { key: '/transactions', label: '流水', icon: '📝' },
  { key: '/inventory', label: '库存', icon: '📦' },
  { key: '/categories', label: '分类', icon: '🏷️' },
  { key: '/profile', label: '我的', icon: '👤' },
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
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
