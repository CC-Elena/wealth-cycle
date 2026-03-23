export type TransactionType =
  | 'income'
  | 'expense'
  | 'refund'
  | 'budget_overflow';

export interface SubItem {
  id: string;
  name: string;
  amount: number;
  isInventory: boolean;
  isConsumable: boolean;
  shelfLifeDays?: number; // 对于消耗品的保质期（天）
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO string 留存
  timestamp: number;
  memo: string;
  tags: string[];
  subItems: SubItem[];
}

export interface BudgetBlock {
  id: string;
  name: string;
  totalAmount: number; // 目标额度
  spentAmount: number; // 已消耗额度
  icon: string;
  color: string;
  isEmergency?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  purchaseDate: string;
  shelfLifeDays: number; // 总保质时长
  isConsumable: boolean;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  netWorth: number;
  payrollCycleDays: number;
  monthlyIncomePrediction: number; // 预估月薪
  lastPayrollDate: string;
  emergencyFundEnabled: boolean;
}
