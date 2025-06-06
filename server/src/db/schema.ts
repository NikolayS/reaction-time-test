
import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const reactionTimesTable = pgTable('reaction_times', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  reaction_time: integer('reaction_time').notNull(), // in milliseconds
  is_false_start: boolean('is_false_start').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ReactionTime = typeof reactionTimesTable.$inferSelect;
export type NewReactionTime = typeof reactionTimesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { reactionTimes: reactionTimesTable };
