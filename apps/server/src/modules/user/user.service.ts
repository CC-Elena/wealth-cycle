import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { User, UserProfile, UserPreferencesUpdate } from '@stock/shared';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

const DEFAULT_USER_ID = 'default-local-user-1';

// 12 个系统预设大类
const SYSTEM_CATEGORIES = [
  { id: 'sys-instant-food', name: '即时餐饮', icon: '🍜', sortOrder: 1 },
  { id: 'sys-grocery', name: '库存餐饮', icon: '🥬', sortOrder: 2 },
  { id: 'sys-clothing', name: '服饰', icon: '👔', sortOrder: 3 },
  { id: 'sys-transport', name: '交通', icon: '🚗', sortOrder: 4 },
  { id: 'sys-housing', name: '居住', icon: '🏠', sortOrder: 5 },
  { id: 'sys-entertainment', name: '娱乐', icon: '🎮', sortOrder: 6 },
  { id: 'sys-medical', name: '医疗', icon: '🏥', sortOrder: 7 },
  { id: 'sys-social', name: '人情', icon: '🎁', sortOrder: 8 },
  { id: 'sys-finance', name: '理财', icon: '💰', sortOrder: 9 },
  { id: 'sys-parenting', name: '育儿', icon: '👶', sortOrder: 10 },
  { id: 'sys-custom', name: '自定义', icon: '⚙️', sortOrder: 11 },
  { id: 'sys-other', name: '其他', icon: '📂', sortOrder: 12 },
];

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultUser();
    await this.ensureDefaultLedger();
    await this.ensureSystemCategories();
  }

  private async ensureDefaultUser() {
    const existing = this.db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).get();
    
    if (!existing) {
      const now = new Date();
      this.db.insert(schema.users).values({
        id: DEFAULT_USER_ID,
        email: 'local@stock.app',
        createdAt: now,
        updatedAt: now,
      }).run();
      
      this.db.insert(schema.userProfiles).values({
        userId: DEFAULT_USER_ID,
        avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Stock',
        createdAt: now,
        updatedAt: now,
      }).run();
    }
  }

  private async ensureDefaultLedger() {
    const userId = DEFAULT_USER_ID;
    const now = new Date();
    
    // 检查是否已有账本
    const existingLedger = this.db.select().from(schema.ledgers).where(eq(schema.ledgers.userId, userId)).get();
    
    if (!existingLedger) {
      const ledgerId = 'default-ledger-1';
      this.db.insert(schema.ledgers).values({
        id: ledgerId,
        userId,
        name: '我的账本',
        icon: '📗',
        isDefault: true,
        payday: 15,
        budgetMode: 'carry_over',
        disposableIncome: 0,
        savingsAmount: 0,
        emergencyFundAmount: 0,
        emergencyFundGoal: 10000,
        emergencyFundEnabled: true,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 更新 Profile 关联
      this.db.update(schema.userProfiles)
        .set({ defaultLedgerId: ledgerId, updatedAt: now })
        .where(eq(schema.userProfiles.userId, userId))
        .run();

      // 关键迁移：将所有存量数据的 ledgerId 设置为该默认账本
      const tablesToUpdate = [
        schema.accounts, schema.categories, schema.transactions, 
        schema.budgetPlans, schema.fixedBills, schema.inventoryItems, 
        schema.wishlistItems, schema.savingsLogs, schema.agentProposals
      ];

      for (const table of tablesToUpdate) {
        // Drizzle specific update to set ledgerId where it's null
        this.db.update(table as any)
          .set({ ledgerId })
          .run();
      }
    }
  }

  private async ensureSystemCategories() {
    const now = new Date();
    for (const cat of SYSTEM_CATEGORIES) {
      const existing = this.db.select().from(schema.categories).where(eq(schema.categories.id, cat.id)).get();
      if (!existing) {
        this.db.insert(schema.categories).values({
          id: cat.id,
          userId: DEFAULT_USER_ID,
          name: cat.name,
          parentId: null,
          type: 'expense',
          icon: cat.icon,
          isSystem: true,
          isActive: true,
          sortOrder: cat.sortOrder,
          createdAt: now,
          updatedAt: now,
        }).run();
      }
    }
  }

  getMyProfile(): { user: User; profile: UserProfile; ledgers: Ledger[] } {
    const user = this.db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).get();
    const profile = this.db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, DEFAULT_USER_ID)).get();
    const ledgers = this.db.select().from(schema.ledgers).where(eq(schema.ledgers.userId, DEFAULT_USER_ID)).all();
    
    if (!user || !profile) {
      throw new Error('Default user not initialized');
    }

    // 获取当前关联的账本数据
    const ledger = this.db.select().from(schema.ledgers)
      .where(eq(schema.ledgers.id, profile.defaultLedgerId || ''))
      .get();

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: {
        userId: profile.userId,
        avatarUrl: profile.avatarUrl,
        defaultLedgerId: profile.defaultLedgerId,
        // 下面字段现在从 Ledger 获取，前端 UserProfile 类型定义需要同步更新或在这里做兼容转换
        payday: ledger?.payday ?? 15,
        budgetMode: (ledger?.budgetMode as any) ?? 'carry_over',
        netWorth: ledger?.netWorth ?? 0,
        disposableIncome: ledger?.disposableIncome ?? 0,
        savingsAmount: ledger?.savingsAmount ?? 0,
        emergencyFundAmount: ledger?.emergencyFundAmount ?? 0,
        emergencyFundGoal: ledger?.emergencyFundGoal ?? 0,
        emergencyFundEnabled: ledger?.emergencyFundEnabled ?? true,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      ledgers: ledgers as Ledger[]
    };
  }

  updatePreferences(data: UserPreferencesUpdate): UserProfile {
    const now = new Date();
    // better-sqlite3 with drizzle-orm is sync.
    const profileRec = this.db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, DEFAULT_USER_ID)).get();
    
    // 更新 Profile 基础字段（如头像）
    if (data.avatarUrl) {
      this.db.update(schema.userProfiles)
        .set({ avatarUrl: data.avatarUrl, updatedAt: now })
        .where(eq(schema.userProfiles.userId, DEFAULT_USER_ID))
        .run();
    }

    // 更新当前账本字段
    if (profileRec?.defaultLedgerId) {
      const ledgerFields = ['payday', 'budgetMode', 'disposableIncome', 'savingsAmount', 'emergencyFundAmount', 'emergencyFundGoal', 'emergencyFundEnabled'];
      const ledgerUpdate: any = {};
      for (const field of ledgerFields) {
        if (field in data) {
          ledgerUpdate[field] = (data as any)[field];
        }
      }

      if (Object.keys(ledgerUpdate).length > 0) {
        this.db.update(schema.ledgers)
          .set({ ...ledgerUpdate, updatedAt: now })
          .where(eq(schema.ledgers.id, profileRec.defaultLedgerId))
          .run();
      }
    }

    return this.getMyProfile().profile;
  }
}
