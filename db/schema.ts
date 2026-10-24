import { pgTable, text, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const networkRecords = pgTable('network_records', {
  collection: text('collection').notNull(),
  id: text('id').notNull(),
  position: text('position').notNull(),
  payload: jsonb('payload').$type<Record<string, any>>().notNull(),
}, (table) => [primaryKey({ columns: [table.collection, table.id] })]);
