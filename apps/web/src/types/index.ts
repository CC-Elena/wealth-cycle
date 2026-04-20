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

// --- Inventory 模块重构的新实体 ---

export type StorageMode = 'room_temperature' | 'refrigerated' | 'frozen';
export type StockEventType = 'stock_in' | 'consume' | 'discard' | 'change_storage';

export interface Station {
  id: string;
  name: string;
  recommendedMode: StorageMode;
  icon: string;
}

export interface InventoryItemTemplate {
  id: string;
  name: string;
  baseUnit: string; // 基础单位如 ml, g, piece
  defaultStorageMode: StorageMode;
  defaultShelfLifeDays: number; // 默认保质期
  icon: string;
}

export interface StockLot {
  id: string;
  itemId: string;        // 关联到模板
  stationId: string;     // 关联到物理存放区域
  storageMode: StorageMode; // 最终该批次的实际存放方式
  initialQuantity: number;
  remainingQuantity: number;
  purchaseDate: string;  // ISO Date
  expireDate: string;    // ISO Date
  remark: string;
}

export interface StockEvent {
  id: string;
  lotId: string;
  type: StockEventType;
  quantityChange: number; // 改变了多少数量
  previousStationId?: string; // 转移时的原区域
  timestamp: string;      // ISO String
  reason?: string;        // discard 等的理由
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
