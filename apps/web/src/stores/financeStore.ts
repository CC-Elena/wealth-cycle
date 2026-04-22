import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ky from 'ky';
import { Toast } from 'antd-mobile';
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

export interface FixedBill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string | null;
  type: string;
  isActive: boolean;
  dueDateNext: string | null;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  status: 'cooling' | 'approved' | 'rejected' | 'bought';
  coolingEnd: string;
  reason?: string;
  createdAt: string;
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'warning' | 'error';
  details: string;
}

export interface HealthReport {
  isHealthy: boolean;
  checks: HealthCheckItem[];
  mismatchAmount: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: any[];
}

export interface AgentProposal {
  id: string;
  userId: string;
  toolName: string;
  arguments: any;
  status: 'pending' | 'accepted' | 'rejected';
  summary: string | null;
  createdAt: string;
}

const API_BASE = 'http://localhost:3000';

export interface HealthStats {
  totalSpent30d: number;
  meanDailySpend: number;
  disposableIncome: number;
  survivalDays: number;
}

export interface Ledger {
  id: string;
  userId: string;
  name: string;
  icon: string;
  netWorth: number;
  disposableIncome: number;
  savingsAmount: number;
  emergencyFundAmount: number;
  emergencyFundGoal: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FinanceState {
  // --- 数据集合 ---
  transactions: Transaction[];
  backendTransactions: BackendTransaction[];
  accounts: Account[];
  wishlistItems: WishlistItem[];
  budgets: BudgetBlock[];
  categories: BackendCategory[];
  fixedBills: FixedBill[]; 
  profile: UserProfile;
  healthStats: HealthStats | null;
  healthReport: HealthReport | null;
  chatMessages: ChatMessage[]; 
  isAgentLoading: boolean; 
  pendingProposals: AgentProposal[];
  ledgers: Ledger[];
  currentLedgerId: string | 'global' | null;
  isOnline: boolean;
  offlineQueue: any[];

  // --- 核心计算值 ---
  disposableIncome: number;

  // --- 方法 Actions ---
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  processPayroll: (amount: number, date: string) => void;
  updateBudget: (id: string, newTotal: number) => void;
  askAgent: (message: string) => Promise<void>; 
  clearChat: () => void; 

  // Backend Integration
  initProfile: () => Promise<void>;
  fetchLedgers: () => Promise<void>;
  switchLedger: (id: string) => Promise<void>;
  updatePreferences: (data: Partial<UserProfile>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  updateWishlistStatus: (id: string, status: WishlistItem['status']) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchFixedBills: () => Promise<void>;
  fetchHealthStats: () => Promise<void>;
  fetchHealthReport: () => Promise<void>;
  reconcileHealth: () => Promise<void>;
  backupDatabase: () => Promise<void>;
  createFixedBillOnServer: (data: {
    name: string;
    amount: number;
    categoryId?: string;
    type: string;
  }) => Promise<void>; // Added
  deleteFixedBillOnServer: (id: string) => Promise<void>; // Added
  getPayrollPreview: (salary: number) => Promise<any>;
  executePayroll: (data: { salaryAmount: number }) => Promise<void>;
  createTransactionOnServer: (data: {
    amount: number;
    categoryId: string;
    accountId?: string;
    type?: string;
    memo?: string;
    items?: any[]; // Sync with implementation
  }) => Promise<void>;
  createLedgerOnServer: (data: { name: string; icon?: string }) => Promise<void>;
  fetchProposals: () => Promise<void>;
  executeProposalOnServer: (id: string) => Promise<void>;
  rejectProposalOnServer: (id: string) => Promise<void>;
  fetchTrend: (months?: number) => Promise<any[]>;
  fetchCategoryDist: (start?: string, end?: string) => Promise<any[]>;
  setIsOnline: (status: boolean) => void;
  syncOfflineQueue: () => Promise<void>;
  getLedgerHeader: () => Record<string, string>;

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
      fixedBills: [],
      profile: MOCK_PROFILE,
      healthStats: null,
      disposableIncome: 8500,
      chatMessages: [],
      isAgentLoading: false,
      pendingProposals: [],
      accounts: [],
      wishlistItems: [],
      healthReport: null,
      ledgers: [],
      currentLedgerId: null,
      isOnline: navigator.onLine,
      offlineQueue: [],

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
              set((state) => ({ disposableIncome: state.disposableIncome - tx.amount }));
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

      askAgent: async (message: string) => {
        const currentMessages = get().chatMessages;
        const newMessages: ChatMessage[] = [
          ...currentMessages,
          { role: 'user', content: message }
        ];

        set({ chatMessages: newMessages, isAgentLoading: true });

        try {
          const response = await ky.post(`${API_BASE}/agent/chat`, {
            json: { messages: newMessages },
            headers: { 'x-ledger-id': get().currentLedgerId || '' },
            timeout: 60000
          }).json<any>();

          const assistantMsg = response.choices[0].message;
          const toolCalls = assistantMsg.tool_calls;

          set((state) => ({
            chatMessages: [
              ...state.chatMessages,
              { 
                role: 'assistant', 
                content: assistantMsg.content || '', 
                toolCalls 
              }
            ],
            isAgentLoading: false
          }));

          // 如果有提议，刷新提议列表
          if (toolCalls?.some((tc: any) => tc.proposalId)) {
            await get().fetchProposals();
          }
        } catch (error) {
          console.error('Failed to ask agent', error);
          set({ isAgentLoading: false });
          set((state) => ({
            chatMessages: [
              ...state.chatMessages,
              { role: 'assistant', content: '抱歉，我现在无法处理您的请求。' }
            ]
          }));
        }
      },

      clearChat: () => {
        set({ chatMessages: [] });
      },

      // ─── Backend Integration ───

      initProfile: async () => {
        try {
          const { user, profile: backendProfile, ledgers } = await ky.get(`${API_BASE}/users/me`).json<{ user: any; profile: any; ledgers: Ledger[] }>();
          
          let activeLedgerId = get().currentLedgerId;
          if (!activeLedgerId || !ledgers.find(l => l.id === activeLedgerId)) {
            activeLedgerId = backendProfile.defaultLedgerId || (ledgers.length > 0 ? ledgers[0].id : null);
          }

          set((state) => ({
            profile: {
              ...state.profile,
              ...backendProfile,
              name: user.email || user.id,
              avatarUrl: backendProfile.avatarUrl || state.profile.avatarUrl,
            },
            ledgers,
            currentLedgerId: activeLedgerId,
            disposableIncome: ledgers.find(l => l.id === activeLedgerId)?.disposableIncome || 0,
          }));
        } catch (error) {
          console.error('Failed to init profile from backend', error);
        }
      },

      fetchLedgers: async () => {
        try {
          const ledgers = await ky.get(`${API_BASE}/finance/ledgers`).json<Ledger[]>();
          set({ ledgers });
        } catch (error) {
          console.error('Failed to fetch ledgers', error);
        }
      },

      createLedgerOnServer: async (data: { name: string; icon?: string }) => {
        try {
          await ky.post(`${API_BASE}/finance/ledgers`, { json: data }).json();
          await get().fetchLedgers();
        } catch (error) {
          console.error('Failed to create ledger', error);
          throw error;
        }
      },

      switchLedger: async (id: string) => {
        try {
          if (id !== 'global') {
            await ky.post(`${API_BASE}/finance/ledgers/switch`, { json: { ledgerId: id } }).json();
          }
          
          set({ currentLedgerId: id });
          
          // 切换后刷新所有数据
          await Promise.all([
            get().fetchCategories(),
            get().fetchBudgets(),
            get().fetchTransactions(),
            get().fetchAccounts(),
            get().fetchFixedBills(),
            get().fetchHealthStats(),
            get().fetchWishlist(),
            get().fetchProposals(),
          ]);

          if (id === 'global') {
            // 全局视角下，可支配收入为所有账本之和
            const totalDisposable = get().ledgers.reduce((sum, l) => sum + (l.disposableIncome || 0), 0);
            set({ disposableIncome: totalDisposable });
          } else {
            const currentLedger = get().ledgers.find(l => l.id === id);
            if (currentLedger) {
              set({ disposableIncome: currentLedger.disposableIncome });
            }
          }
          
          Toast.show({
            content: id === 'global' ? '已切至全局视角' : '账本切换成功',
            duration: 1000,
          });
        } catch (error) {
          console.error('Failed to switch ledger', error);
        }
      },

      getLedgerHeader: () => {
        const id = get().currentLedgerId;
        if (!id) return {};
        // 如果是 global，Header 传 global，后端 Controller 已处理对接
        return { 'x-ledger-id': id };
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
          const categories = await ky.get(`${API_BASE}/categories`, {
            headers: get().getLedgerHeader()
          }).json<BackendCategory[]>();
          set({ categories });
        } catch (error) {
          console.error('Failed to fetch categories', error);
        }
      },

      fetchBudgets: async () => {
        try {
          const budgets = await ky.get(`${API_BASE}/budgets`, {
            headers: { 'x-ledger-id': get().currentLedgerId || '' }
          }).json<BudgetBlock[]>();
          set({ budgets });
        } catch (error) {
          console.error('Failed to fetch budgets', error);
        }
      },

      fetchFixedBills: async () => {
        try {
          const fixedBills = await ky.get(`${API_BASE}/fixed-bills`, {
            headers: { 'x-ledger-id': get().currentLedgerId || '' }
          }).json<FixedBill[]>();
          set({ fixedBills });
        } catch (error) {
          console.error('Failed to fetch fixed bills', error);
        }
      },

      fetchHealthStats: async () => {
        try {
          const healthStats = await ky.get(`${API_BASE}/health/stats`, {
            headers: get().getLedgerHeader()
          }).json<HealthStats>();
          set({ healthStats });
        } catch (error) {
          console.error('Failed to fetch health stats', error);
        }
      },

      createFixedBillOnServer: async (data) => {
        try {
          await ky.post(`${API_BASE}/fixed-bills`, { 
            json: data,
            headers: get().getLedgerHeader()
          }).json();
          await get().fetchFixedBills();
        } catch (error) {
          console.error('Failed to create fixed bill', error);
          throw error;
        }
      },

      deleteFixedBillOnServer: async (id) => {
        try {
          await ky.delete(`${API_BASE}/fixed-bills/${id}`).json();
          await get().fetchFixedBills();
        } catch (error) {
          console.error('Failed to delete fixed bill', error);
          throw error;
        }
      },

      getPayrollPreview: async (salary: number) => {
        return ky.post(`${API_BASE}/payroll/preview`, { 
          json: { salary },
          headers: get().getLedgerHeader()
        }).json();
      },

      executePayroll: async (data: { salaryAmount: number }) => {
        try {
          await ky.post(`${API_BASE}/payroll/execute`, { 
            json: data,
            headers: get().getLedgerHeader()
          }).json();
          // 刷新全量数据以反映资金变化和时间周期变化
          await Promise.all([
            get().initProfile(),
            get().fetchBudgets(),
            get().fetchTransactions(),
          ]);
        } catch (error) {
          console.error('Failed to execute payroll', error);
          throw error;
        }
      },

      fetchTransactions: async () => {
        try {
          const backendTransactions = await ky.get(`${API_BASE}/transactions`, {
            headers: get().getLedgerHeader()
          }).json<BackendTransaction[]>();
          set({ backendTransactions });
        } catch (error) {
          console.error('Failed to fetch transactions', error);
        }
      },

      fetchAccounts: async () => {
        try {
          const accounts = await ky.get(`${API_BASE}/accounts`, {
            headers: get().getLedgerHeader()
          }).json<Account[]>();
          set({ accounts });
        } catch (error) {
          console.error('Failed to fetch accounts', error);
        }
      },

      fetchWishlist: async () => {
        try {
          const items = await ky.get(`${API_BASE}/finance/wishlist`, {
            headers: get().getLedgerHeader()
          }).json<WishlistItem[]>();
          set({ wishlistItems: items });
        } catch (error) {
          console.error('Failed to fetch wishlist', error);
        }
      },

      updateWishlistStatus: async (id, status) => {
        try {
          await ky.post(`${API_BASE}/finance/wishlist/${id}/status`, { json: { status } });
          await get().fetchWishlist();
          if (status === 'bought') {
            await get().fetchAccounts();
          }
        } catch (error) {
          console.error('Failed to update wishlist status', error);
        }
      },

      fetchHealthReport: async () => {
        try {
          const report = await ky.get(`${API_BASE}/finance/health/report`, {
            headers: { 'x-ledger-id': get().currentLedgerId || '' }
          }).json<HealthReport>();
          set({ healthReport: report });
        } catch (error) {
          console.error('Failed to fetch health report', error);
        }
      },

      reconcileHealth: async () => {
        try {
          await ky.post(`${API_BASE}/finance/health/reconcile`, {
            headers: { 'x-ledger-id': get().currentLedgerId || '' }
          }).json();
          await get().fetchHealthReport();
          await get().initProfile();
          Toast.show({ icon: 'success', content: '对账校准完成' });
        } catch (error) {
          console.error('Failed to reconcile health', error);
        }
      },

      backupDatabase: async () => {
        try {
          await ky.post(`${API_BASE}/finance/health/backup`).json();
          Toast.show({ icon: 'success', content: '数据库备份成功' });
        } catch (error) {
          Toast.show({ icon: 'fail', content: '备份失败' });
        }
      },

      setIsOnline: (status) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: status });
        if (wasOffline && status) {
          get().syncOfflineQueue();
        }
      },

      syncOfflineQueue: async () => {
        const queue = get().offlineQueue;
        if (queue.length === 0) return;

        Toast.show({ icon: 'loading', content: '同步离线数据...', duration: 0 });
        
        const remaining: any[] = [];
        for (const action of queue) {
          try {
            if (action.type === 'create_transaction') {
              await ky.post(`${API_BASE}/transactions`, { 
                json: action.payload,
                headers: { 'x-ledger-id': action.ledgerId || '' }
              }).json();
            }
            // 可以扩展其他类型
          } catch (error) {
            console.error('Failed to sync offline action', action, error);
            remaining.push(action);
          }
        }

        set({ offlineQueue: remaining });
        Toast.clear();
        
        if (remaining.length > 0) {
          Toast.show({ icon: 'fail', content: `${remaining.length} 项数据同步失败` });
        } else {
          Toast.show({ icon: 'success', content: '所有离线数据已同步' });
          // 同步成功后全面刷新，确保数据一致
          get().initProfile();
          get().fetchTransactions();
          get().fetchBudgets();
        }
      },

      createTransactionOnServer: async (data: {
        amount: number;
        categoryId: string;
        type?: string;
        memo?: string;
        items?: any[];
      }) => {
        const ledgerId = get().currentLedgerId || '';
        
        // 1. 立即执行乐观更新 (Optimistic UI)
        const optimisticTx: BackendTransaction = {
          id: `opt-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'local',
          amount: data.amount,
          categoryId: data.categoryId,
          type: data.type || 'expense',
          memo: data.memo || null,
          paymentMethod: null,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          backendTransactions: [optimisticTx, ...state.backendTransactions],
        }));

        // 2. 环境判断
        if (!navigator.onLine) {
          set((state) => ({
            offlineQueue: [
              ...state.offlineQueue,
              { type: 'create_transaction', payload: data, ledgerId, timestamp: Date.now() },
            ],
          }));
          Toast.show('离线状态：交易已暂存');
          return;
        }

        // 3. 在线执行
        try {
          await ky.post(`${API_BASE}/transactions`, { 
            json: data,
            headers: { 'x-ledger-id': ledgerId }
          }).json();
          
          // 刷新全量数据
          await Promise.all([
            get().fetchTransactions(),
            get().fetchBudgets(),
            get().initProfile(),
          ]);
        } catch (error) {
          console.error('Failed to create transaction', error);
          // 如果失败（且不是网络断开导致的），回滚乐观更新
          set((state) => ({
            backendTransactions: state.backendTransactions.filter(tx => tx.id !== optimisticTx.id),
          }));
          throw error;
        }
      },

      fetchProposals: async () => {
        try {
          const proposals = await ky.get(`${API_BASE}/agent/proposals`, {
            headers: get().getLedgerHeader()
          }).json<AgentProposal[]>();
          set({ pendingProposals: proposals });
        } catch (error) {
          console.error('Failed to fetch proposals', error);
        }
      },

      executeProposalOnServer: async (id: string) => {
        try {
          await ky.post(`${API_BASE}/agent/proposals/${id}/execute`, {
            headers: get().getLedgerHeader()
          }).json();
          await Promise.all([
            get().fetchProposals(),
            get().fetchTransactions(),
            get().fetchBudgets(),
            get().initProfile(),
          ]);
        } catch (error) {
          console.error('Failed to execute proposal', error);
          throw error;
        }
      },

      rejectProposalOnServer: async (id: string) => {
        try {
          await ky.delete(`${API_BASE}/agent/proposals/${id}`).json();
          await get().fetchProposals();
        } catch (error) {
          console.error('Failed to reject proposal', error);
          throw error;
        }
      },

      fetchTrend: async (months = 6) => {
        try {
          return await ky.get(`${API_BASE}/finance/stats/trend`, { 
            searchParams: { months },
            headers: get().getLedgerHeader()
          }).json<any[]>();
        } catch (error) {
          console.error('Failed to fetch trend', error);
          return [];
        }
      },

      fetchCategoryDist: async (start, end) => {
        try {
          return await ky.get(`${API_BASE}/finance/stats/categories`, { 
            searchParams: { 
              ...(start && { start }), 
              ...(end && { end }) 
            },
            headers: get().getLedgerHeader()
          }).json<any[]>();
        } catch (error) {
          console.error('Failed to fetch category distribution', error);
          return [];
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
          pendingProposals: [],
        });
      },
    }),
    {
      name: 'finance-storage',
    },
  ),
);
