import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetBlock, Transaction, UserProfile } from '../types';

interface FinanceState {
  // --- 数据集合 ---
  transactions: Transaction[];
  budgets: BudgetBlock[];
  profile: UserProfile;

  // --- 核心计算值 (作为 getters 存在时可通过 hooks 取，这里保存为普通库状态) ---
  disposableIncome: number; // 可支配资金 (总入账 - 预分配/冻结)

  // --- 方法 Actions ---
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  processPayroll: (amount: number, date: string) => void;
  updateBudget: (id: string, newTotal: number) => void;

  // 初始化 Mock
  resetToMock: () => void;
}

// 模拟初始状态（让原型展现有意义的数据）
const MOCK_PROFILE: UserProfile = {
  name: 'Cc',
  avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Cc',
  netWorth: 10000,
  payrollCycleDays: 30,
  monthlyIncomePrediction: 15000,
  lastPayrollDate: new Date().toISOString(),
  emergencyFundEnabled: true,
};

const MOCK_BUDGETS: BudgetBlock[] = [
  {
    id: 'b1',
    name: '饮食总计',
    totalAmount: 2000,
    spentAmount: 1780,
    icon: '🍔',
    color: '#6C5DD3',
  },
  {
    id: 'b2',
    name: '日用消耗',
    totalAmount: 800,
    spentAmount: 600,
    icon: '🛒',
    color: '#8B80F9',
  },
  {
    id: 'b3',
    name: '交通出行',
    totalAmount: 500,
    spentAmount: 300,
    icon: '🚗',
    color: '#BDB2FF',
  },
  {
    id: 'b4',
    name: '聚会娱乐',
    totalAmount: 1000,
    spentAmount: 400,
    icon: '🎉',
    color: '#D8D0FF',
  },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      transactions: [],
      budgets: MOCK_BUDGETS,
      profile: MOCK_PROFILE,
      disposableIncome: 8500,

      addTransaction: (tx) => {
        set((state) => {
          const newTx = {
            ...tx,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
          };

          // 扣减预算或改变可支配资金
          const newBudgets = [...state.budgets];
          if (tx.type === 'expense') {
            const b = newBudgets.find((b) => b.id === tx.categoryId);
            if (b) {
              b.spentAmount += tx.amount;
            } else {
              // 预算外开销扣自身净额
              state.disposableIncome -= tx.amount;
            }
          }

          return {
            transactions: [newTx, ...state.transactions],
            budgets: newBudgets,
            disposableIncome: state.disposableIncome,
          };
        });
      },

      processPayroll: (amount, date) => {
        set((state) => {
          // 极简薪水入账重配模型：增加可支配资金
          return {
            disposableIncome: state.disposableIncome + amount,
            profile: {
              ...state.profile,
              lastPayrollDate: date,
              netWorth: state.profile.netWorth + amount,
            },
          };
        });
      },

      updateBudget: (id, newTotal) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, totalAmount: newTotal } : b,
          ),
        }));
      },

      resetToMock: () => {
        set({
          transactions: [],
          budgets: MOCK_BUDGETS,
          profile: MOCK_PROFILE,
          disposableIncome: 8500,
        });
      },
    }),
    {
      name: 'finance-storage', // local storage key
    },
  ),
);
