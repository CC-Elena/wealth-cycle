import { Outlet } from 'react-router-dom';
import { AssistantOverlay } from '../Agent/AssistantOverlay';
import OfflineBanner from '../Common/OfflineBanner';
import PWAInstallGuide from '../Common/PWAInstallGuide';
import TabBar from '../TabBar';
import styles from './index.module.css';

const Layout = () => {
  return (
    <div className={styles.layout}>
      <OfflineBanner />
      <PWAInstallGuide />
      <main className={styles.main}>
        <Outlet />
      </main>
      <AssistantOverlay />
      <TabBar />
    </div>
  );
};

export default Layout;
