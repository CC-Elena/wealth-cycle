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
        payday: 15,
        budgetMode: 'carry_over',
        netWorth: 10000,
        emergencyFundEnabled: true,
        avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Stock',
        createdAt: now,
        updatedAt: now,
      }).run();
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

  getMyProfile(): { user: User; profile: UserProfile } {
    const user = this.db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).get();
    const profile = this.db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, DEFAULT_USER_ID)).get();

    if (!user || !profile) {
      throw new Error('Default user not initialized');
    }

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
        payday: profile.payday,
        budgetMode: profile.budgetMode as any,
        netWorth: profile.netWorth ?? 0,
        emergencyFundEnabled: profile.emergencyFundEnabled ?? true,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }
    };
  }

  updatePreferences(data: UserPreferencesUpdate): UserProfile {
    const now = new Date();
    // better-sqlite3 with drizzle-orm is sync.
    this.db.update(schema.userProfiles)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(schema.userProfiles.userId, DEFAULT_USER_ID))
      .run();

    return this.getMyProfile().profile;
  }
}
