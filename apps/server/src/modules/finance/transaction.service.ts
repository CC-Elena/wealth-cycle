import { Injectable, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { CreateTransaction } from '@stock/shared';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  getTransactions(limit = 50) {
    return this.db.select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, DEFAULT_USER_ID))
      .orderBy(desc(schema.transactions.date))
      .limit(limit)
      .all();
  }

  createTransaction(data: CreateTransaction) {
    const now = new Date();
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionDate = data.date ? new Date(data.date) : now;

    this.db.insert(schema.transactions).values({
      id,
      userId: DEFAULT_USER_ID,
      amount: data.amount,
      categoryId: data.categoryId,
      type: data.type ?? 'expense',
      memo: data.memo ?? null,
      paymentMethod: data.paymentMethod ?? null,
      date: transactionDate,
      createdAt: now,
      updatedAt: now,
    }).run();

    // Handle tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        this.db.insert(schema.transactionTags).values({
          transactionId: id,
          tagId,
        }).run();
      }
    }

    return this.db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).get();
  }
}
