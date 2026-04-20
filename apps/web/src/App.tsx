import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useFinanceStore } from './stores/financeStore';

const App = () => {
  const initProfile = useFinanceStore((state) => state.initProfile);
  const fetchCategories = useFinanceStore((state) => state.fetchCategories);
  const fetchTransactions = useFinanceStore((state) => state.fetchTransactions);

  useEffect(() => {
    initProfile();
    fetchCategories();
    fetchTransactions();
  }, [initProfile, fetchCategories, fetchTransactions]);

  return <RouterProvider router={router} />;
};

export default App;
