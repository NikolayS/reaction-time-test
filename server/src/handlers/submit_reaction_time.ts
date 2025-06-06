
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { type SubmitReactionTimeInput, type ReactionTime } from '../schema';

export const submitReactionTime = async (input: SubmitReactionTimeInput): Promise<ReactionTime> => {
  try {
    // Insert reaction time record
    const result = await db.insert(reactionTimesTable)
      .values({
        player_name: input.player_name,
        reaction_time: input.reaction_time,
        is_false_start: input.is_false_start
      })
      .returning()
      .execute();

    // Return the created record
    const reactionTime = result[0];
    return reactionTime;
  } catch (error) {
    console.error('Reaction time submission failed:', error);
    throw error;
  }
};
