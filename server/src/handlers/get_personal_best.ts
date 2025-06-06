
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { type ReactionTime } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export const getPersonalBest = async (playerName: string): Promise<ReactionTime | null> => {
  try {
    // Query for the best (lowest) reaction time for the player, excluding false starts
    const result = await db.select()
      .from(reactionTimesTable)
      .where(
        and(
          eq(reactionTimesTable.player_name, playerName),
          eq(reactionTimesTable.is_false_start, false)
        )
      )
      .orderBy(asc(reactionTimesTable.reaction_time))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the personal best record
    return result[0];
  } catch (error) {
    console.error('Get personal best failed:', error);
    throw error;
  }
};
