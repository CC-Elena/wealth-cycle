import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useFinanceStore } from './stores/financeStore';

const App = () => {
  const initProfile = useFinanceStore((state) => state.initProfile);
  const fetchCategories = useFinanceStore((state) => state.fetchCategories);
  const fetchTransactions = useFinanceStore((state) => state.fetchTransactions);
  const fetchAccounts = useFinanceStore((state) => state.fetchAccounts);
  const fetchWishlist = useFinanceStore((state) => state.fetchWishlist);
  const setIsOnline = useFinanceStore((state) => state.setIsOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    initProfile();
    fetchCategories();
    fetchTransactions();
    fetchAccounts();
    fetchWishlist();
  }, [initProfile, fetchCategories, fetchTransactions, fetchAccounts, fetchWishlist]);

  return <RouterProvider router={router} />;
};

export default App;
