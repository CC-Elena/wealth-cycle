import { Outlet } from 'react-router-dom';
import TabBar from '../TabBar';
import { AssistantOverlay } from '../Agent/AssistantOverlay';
import OfflineBanner from '../Common/OfflineBanner';
import styles from './index.module.css';

const Layout = () => {
  return (
    <div className={styles.layout}>
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <AssistantOverlay />
      <TabBar />
    </div>
  );
};

export default Layout;
