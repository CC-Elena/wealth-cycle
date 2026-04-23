import ky from 'ky';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  InventoryItemTemplate,
  Station,
  StockEvent,
  StockLot,
  StorageMode,
} from '../types';

const API_BASE = 'http://localhost:3000';

interface InventoryState {
  // 数据集合
  templates: InventoryItemTemplate[];
  stations: Station[];
  lots: StockLot[];
  events: StockEvent[];

  // Backend Actions
  fetchData: () => Promise<void>;
  stockIn: (lotData: any) => Promise<void>;
  consumeStock: (lotId: string, consumeAmount: number) => Promise<void>;
  discardStock: (
    lotId: string,
    discardAmount: number,
    reason: string,
  ) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      templates: [],
      stations: [],
      lots: [],
      events: [],

      fetchData: async () => {
        try {
          // 这里的接口路径需要根据后端 Controller 实际路径调整
          const items = await ky
            .get(`${API_BASE}/inventory/items`)
            .json<any[]>();
          // 将后端数据映射回前端模型 (此处简化，实际开发需精准映射)
          set({ lots: items as any });
        } catch (error) {
          console.error('Failed to fetch inventory', error);
        }
      },

      stockIn: async (lotData) => {
        // 后端实现后对接
      },

      consumeStock: async (lotId, consumeAmount) => {
        // 对接后端
      },

      discardStock: async (lotId, discardAmount, reason) => {
        try {
          await ky
            .post(`${API_BASE}/inventory/waste`, {
              json: { itemId: lotId, quantity: discardAmount, reason },
            })
            .json();
          await get().fetchData();
        } catch (error) {
          console.error('Failed to discard stock', error);
        }
      },
    }),
    {
      name: 'inventory-storage',
    },
  ),
);
