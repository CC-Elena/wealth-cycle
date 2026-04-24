import { Inject, Injectable } from '@nestjs/common';
import { CreateCategory } from '@stock/shared';
import { and, asc, eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  getAllCategories(ledgerId?: string) {
    const filters = [eq(schema.categories.userId, DEFAULT_USER_ID)];
    if (ledgerId && ledgerId !== 'global') {
      filters.push(eq(schema.categories.ledgerId, ledgerId));
    }
    return this.db
      .select()
      .from(schema.categories)
      .where(and(...filters))
      .orderBy(asc(schema.categories.sortOrder))
      .all();
  }

  createCategory(data: CreateCategory) {
    const now = new Date();
    const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    this.db
      .insert(schema.categories)
      .values({
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
      })
      .run();

    return this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .get();
  }
}
