import { Injectable, Inject } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { CreateCategory } from '@stock/shared';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  getAllCategories(ledgerId: string) {
    return this.db.select()
      .from(schema.categories)
      .where(and(
        eq(schema.categories.userId, DEFAULT_USER_ID),
        eq(schema.categories.ledgerId, ledgerId)
      ))
      .orderBy(asc(schema.categories.sortOrder))
      .all();
  }

  createCategory(data: CreateCategory) {
    const now = new Date();
    const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    this.db.insert(schema.categories).values({
      id,
      userId: DEFAULT_USER_ID,
      ledgerId: data.ledgerId,
      name: data.name,
      parentId: data.parentId ?? null,
      type: data.type ?? 'expense',
      icon: data.icon ?? '📁',
      isSystem: false,
      isActive: true,
      sortOrder: data.sortOrder ?? 99,
      createdAt: now,
      updatedAt: now,
    }).run();

    return this.db.select().from(schema.categories).where(eq(schema.categories.id, id)).get();
  }
}
