
import { z } from 'zod';

// Time filter enum for leaderboard
export const timeFilterSchema = z.enum(['all_time', 'this_month', 'this_week', 'today']);
export type TimeFilter = z.infer<typeof timeFilterSchema>;

// Reaction time record schema
export const reactionTimeSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  reaction_time: z.number(), // in milliseconds
  is_false_start: z.boolean(),
  created_at: z.coerce.date()
});

export type ReactionTime = z.infer<typeof reactionTimeSchema>;

// Input schema for submitting reaction time
export const submitReactionTimeInputSchema = z.object({
  player_name: z.string().min(1).max(50),
  reaction_time: z.number().positive(), // in milliseconds
  is_false_start: z.boolean()
});

export type SubmitReactionTimeInput = z.infer<typeof submitReactionTimeInputSchema>;

// Input schema for getting leaderboard
export const getLeaderboardInputSchema = z.object({
  filter: timeFilterSchema,
  limit: z.number().int().positive().optional().default(10)
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardInputSchema>;

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  id: z.number(),
  player_name: z.string(),
  reaction_time: z.number(),
  created_at: z.coerce.date(),
  rank: z.number()
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
