
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { type GetLeaderboardInput, type LeaderboardEntry } from '../schema';
import { eq, gte, and } from 'drizzle-orm';

export const getLeaderboard = async (input: GetLeaderboardInput): Promise<LeaderboardEntry[]> => {
  try {
    // Build conditions array
    const conditions = [];
    
    // Only include non-false starts
    conditions.push(eq(reactionTimesTable.is_false_start, false));

    // Apply time-based filters
    const now = new Date();
    
    if (input.filter === 'today') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      conditions.push(gte(reactionTimesTable.created_at, startOfDay));
    } else if (input.filter === 'this_week') {
      const startOfWeek = new Date(now);
      const dayOfWeek = startOfWeek.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      conditions.push(gte(reactionTimesTable.created_at, startOfWeek));
    } else if (input.filter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      conditions.push(gte(reactionTimesTable.created_at, startOfMonth));
    }
    // For 'all_time', no additional date filter needed

    // Build and execute query in one chain
    const results = await db.select()
      .from(reactionTimesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(reactionTimesTable.reaction_time)
      .limit(input.limit)
      .execute();

    // Map results to include rank
    return results.map((result, index) => ({
      id: result.id,
      player_name: result.player_name,
      reaction_time: result.reaction_time,
      created_at: result.created_at,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Get leaderboard failed:', error);
    throw error;
  }
};
