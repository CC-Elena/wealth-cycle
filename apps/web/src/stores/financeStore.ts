import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ky from 'ky';
import type { BudgetBlock, Transaction, UserProfile } from '../types';

// 后端分类数据的类型
export interface BackendCategory {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  type: string;
  icon: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 后端交易数据的类型
export interface BackendTransaction {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  type: string;
  memo: string | null;
  paymentMethod: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = 'http://localhost:3000';

interface FinanceState {
  // --- 数据集合 ---
  transactions: Transaction[];
  backendTransactions: BackendTransaction[];
  budgets: BudgetBlock[];
  categories: BackendCategory[];
  profile: UserProfile;

  // --- 核心计算值 ---
  disposableIncome: number;

  // --- 方法 Actions ---
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  processPayroll: (amount: number, date: string) => void;
  updateBudget: (id: string, newTotal: number) => void;

  // Backend Integration
  initProfile: () => Promise<void>;
  updatePreferences: (data: Partial<UserProfile>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  createTransactionOnServer: (data: {
    amount: number;
    categoryId: string;
    type?: string;
    memo?: string;
  }) => Promise<void>;

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
    (set, get) => ({
      transactions: [],
      backendTransactions: [],
      budgets: MOCK_BUDGETS,
      categories: [],
      profile: MOCK_PROFILE,
      disposableIncome: 8500,

      addTransaction: (tx) => {
        set((state) => {
          const newTx = {
            ...tx,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
          };

          const newBudgets = [...state.budgets];
          if (tx.type === 'expense') {
            const b = newBudgets.find((b) => b.id === tx.categoryId);
            if (b) {
              b.spentAmount += tx.amount;
            } else {
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
        set((state) => ({
          disposableIncome: state.disposableIncome + amount,
          profile: {
            ...state.profile,
            lastPayrollDate: date,
            netWorth: state.profile.netWorth + amount,
          },
        }));
      },

      updateBudget: (id, newTotal) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, totalAmount: newTotal } : b,
          ),
        }));
      },

      // ─── Backend Integration ───

      initProfile: async () => {
        try {
          const { user, profile: backendProfile } = await ky.get(`${API_BASE}/users/me`).json<{ user: any; profile: any }>();
          set((state) => ({
            profile: {
              ...state.profile,
              ...backendProfile,
              name: user.email || user.id,
              avatarUrl: backendProfile.avatarUrl || state.profile.avatarUrl,
            },
          }));
        } catch (error) {
          console.error('Failed to init profile from backend', error);
        }
      },

      updatePreferences: async (data) => {
        try {
          const updatedProfile = await ky.put(`${API_BASE}/users/me/preferences`, { json: data }).json<any>();
          set((state) => ({
            profile: {
              ...state.profile,
              ...updatedProfile,
            },
          }));
        } catch (error) {
          console.error('Failed to update preferences', error);
          throw error;
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await ky.get(`${API_BASE}/categories`).json<BackendCategory[]>();
          set({ categories });
        } catch (error) {
          console.error('Failed to fetch categories', error);
        }
      },

      fetchTransactions: async () => {
        try {
          const backendTransactions = await ky.get(`${API_BASE}/transactions`).json<BackendTransaction[]>();
          set({ backendTransactions });
        } catch (error) {
          console.error('Failed to fetch transactions', error);
        }
      },

      createTransactionOnServer: async (data) => {
        try {
          await ky.post(`${API_BASE}/transactions`, { json: data }).json();
          // 刷新列表
          await get().fetchTransactions();
        } catch (error) {
          console.error('Failed to create transaction', error);
          throw error;
        }
      },

      resetToMock: () => {
        set({
          transactions: [],
          backendTransactions: [],
          budgets: MOCK_BUDGETS,
          categories: [],
          profile: MOCK_PROFILE,
          disposableIncome: 8500,
        });
      },
    }),
    {
      name: 'finance-storage',
    },
  ),
);
