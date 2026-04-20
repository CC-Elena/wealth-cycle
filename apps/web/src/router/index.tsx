import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Inventory from '../pages/Inventory';
import Categories from '../pages/Categories';
import Profile from '../pages/Profile';

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
    ],
  },
]);

export default router;
