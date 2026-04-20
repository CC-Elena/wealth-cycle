import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  InventoryItemTemplate, 
  StockLot, 
  Station, 
  StockEvent, 
  StorageMode
} from '../types';

interface InventoryState {
  // 数据集合
  templates: InventoryItemTemplate[];
  stations: Station[];
  lots: StockLot[];
  events: StockEvent[];

  // 快捷动作 (Actions)
  addTemplate: (tpl: Omit<InventoryItemTemplate, 'id'>) => void;
  stockIn: (lotData: Omit<StockLot, 'id' | 'remainingQuantity'>) => void;
  consumeStock: (lotId: string, consumeAmount: number) => void;
  discardStock: (lotId: string, discardAmount: number, reason: string) => void;
  transferStock: (lotId: string, newStationId: string, newStorageMode: StorageMode) => void;
  
  // Dev Reset
  resetToMock: () => void;
}

// 模拟初始配置数据
const MOCK_STATIONS: Station[] = [
  { id: 's1', name: '双开门冰箱-冷藏室', recommendedMode: 'refrigerated', icon: '❄️' },
  { id: 's2', name: '双开门冰箱-冷冻抽屉', recommendedMode: 'frozen', icon: '🧊' },
  { id: 's3', name: '厨房岛台', recommendedMode: 'room_temperature', icon: '🍳' },
  { id: 's4', name: '客厅零食柜', recommendedMode: 'room_temperature', icon: '🗄️' },
];

const MOCK_TEMPLATES: InventoryItemTemplate[] = [
  { id: 't1', name: '全脂牛奶', baseUnit: 'ml', defaultStorageMode: 'refrigerated', defaultShelfLifeDays: 14, icon: '🥛' },
  { id: 't2', name: '草莓', baseUnit: 'g', defaultStorageMode: 'refrigerated', defaultShelfLifeDays: 7, icon: '🍓' },
  { id: 't3', name: '牛排', baseUnit: 'g', defaultStorageMode: 'frozen', defaultShelfLifeDays: 180, icon: '🥩' },
  { id: 't4', name: '薯片', baseUnit: 'bag', defaultStorageMode: 'room_temperature', defaultShelfLifeDays: 360, icon: '🍿' },
  { id: 't5', name: '挂面', baseUnit: 'g', defaultStorageMode: 'room_temperature', defaultShelfLifeDays: 360, icon: '🍜' },
];

const MOCK_LOTS: StockLot[] = [
  { id: 'l1', itemId: 't1', stationId: 's1', storageMode: 'refrigerated', initialQuantity: 1000, remainingQuantity: 600, purchaseDate: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString(), expireDate: new Date(Date.now() + 1000 * 3600 * 24 * 9).toISOString(), remark: '超市购买' },
  { id: 'l2', itemId: 't2', stationId: 's1', storageMode: 'refrigerated', initialQuantity: 500, remainingQuantity: 500, purchaseDate: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(), expireDate: new Date(Date.now() + 1000 * 3600 * 24 * 5).toISOString(), remark: '有机草莓' },
  { id: 'l3', itemId: 't4', stationId: 's4', storageMode: 'room_temperature', initialQuantity: 3, remainingQuantity: 2, purchaseDate: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(), expireDate: new Date(Date.now() + 1000 * 3600 * 24 * 350).toISOString(), remark: '大礼包拆分' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateTimestamp = () => new Date().toISOString();

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      templates: MOCK_TEMPLATES,
      stations: MOCK_STATIONS,
      lots: MOCK_LOTS,
      events: [],

      addTemplate: (tpl) => set((state) => ({
        templates: [...state.templates, { ...tpl, id: generateId() }]
      })),

      stockIn: (lotData) => set((state) => {
        const lotId = generateId();
        const newLot: StockLot = {
          ...lotData,
          id: lotId,
          remainingQuantity: lotData.initialQuantity
        };
        const newEvent: StockEvent = {
          id: generateId(),
          lotId,
          type: 'stock_in',
          quantityChange: lotData.initialQuantity,
          timestamp: generateTimestamp()
        };
        return {
          lots: [...state.lots, newLot],
          events: [newEvent, ...state.events]
        };
      }),

      consumeStock: (lotId, consumeAmount) => set((state) => {
        const lots = state.lots.map(l => {
          if (l.id === lotId) return { ...l, remainingQuantity: Math.max(0, l.remainingQuantity - consumeAmount) };
          return l;
        });
        const newEvent: StockEvent = {
          id: generateId(),
          lotId,
          type: 'consume',
          quantityChange: -consumeAmount,
          timestamp: generateTimestamp()
        };
        return { lots, events: [newEvent, ...state.events] };
      }),

      discardStock: (lotId, discardAmount, reason) => set((state) => {
        const lots = state.lots.map(l => {
          if (l.id === lotId) return { ...l, remainingQuantity: Math.max(0, l.remainingQuantity - discardAmount) };
          return l;
        });
        const newEvent: StockEvent = {
          id: generateId(),
          lotId,
          type: 'discard',
          quantityChange: -discardAmount,
          reason,
          timestamp: generateTimestamp()
        };
        return { lots, events: [newEvent, ...state.events] };
      }),

      transferStock: (lotId, newStationId, newStorageMode) => set((state) => {
        let prevStationId: string | undefined;
        const lots = state.lots.map(l => {
          if (l.id === lotId) {
            prevStationId = l.stationId;
            return { ...l, stationId: newStationId, storageMode: newStorageMode };
          }
          return l;
        });
        const newEvent: StockEvent = {
          id: generateId(),
          lotId,
          type: 'change_storage',
          quantityChange: 0,
          previousStationId: prevStationId,
          timestamp: generateTimestamp()
        };
        return { lots, events: [newEvent, ...state.events] };
      }),

      resetToMock: () => set({
        templates: MOCK_TEMPLATES,
        stations: MOCK_STATIONS,
        lots: MOCK_LOTS,
        events: []
      })
    }),
    {
      name: 'inventory-storage'
    }
  )
);
