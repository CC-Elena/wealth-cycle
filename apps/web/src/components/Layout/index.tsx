import { Outlet } from 'react-router-dom';
import TabBar from '../TabBar';
import styles from './index.module.css';

const Layout = () => {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
};

export default Layout;
