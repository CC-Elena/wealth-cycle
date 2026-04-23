import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Accounts from '../pages/Accounts';
import Analysis from '../pages/Analysis';
import Bills from '../pages/Bills';
import Categories from '../pages/Categories';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Ledgers from '../pages/Ledgers';
import Profile from '../pages/Profile';
import Transactions from '../pages/Transactions';
import Wishlist from '../pages/Wishlist';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'categories', element: <Categories /> },
      { path: 'profile', element: <Profile /> },
      { path: 'bills', element: <Bills /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'ledgers', element: <Ledgers /> },
      { path: 'accounts', element: <Accounts /> },
    ],
  },
]);

export default router;
