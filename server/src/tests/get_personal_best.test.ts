
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { getPersonalBest } from '../handlers/get_personal_best';

describe('getPersonalBest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return the best reaction time for a player', async () => {
    // Create multiple reaction times for the same player
    await db.insert(reactionTimesTable)
      .values([
        {
          player_name: 'TestPlayer',
          reaction_time: 250,
          is_false_start: false
        },
        {
          player_name: 'TestPlayer',
          reaction_time: 180,
          is_false_start: false
        },
        {
          player_name: 'TestPlayer',
          reaction_time: 300,
          is_false_start: false
        }
      ])
      .execute();

    const result = await getPersonalBest('TestPlayer');

    expect(result).not.toBeNull();
    expect(result!.player_name).toBe('TestPlayer');
    expect(result!.reaction_time).toBe(180); // Should be the lowest time
    expect(result!.is_false_start).toBe(false);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should exclude false starts from personal best', async () => {
    // Create reaction times including false starts
    await db.insert(reactionTimesTable)
      .values([
        {
          player_name: 'TestPlayer',
          reaction_time: 50, // Very fast but false start
          is_false_start: true
        },
        {
          player_name: 'TestPlayer',
          reaction_time: 200,
          is_false_start: false
        },
        {
          player_name: 'TestPlayer',
          reaction_time: 180,
          is_false_start: false
        }
      ])
      .execute();

    const result = await getPersonalBest('TestPlayer');

    expect(result).not.toBeNull();
    expect(result!.reaction_time).toBe(180); // Should ignore the 50ms false start
    expect(result!.is_false_start).toBe(false);
  });

  it('should return null for non-existent player', async () => {
    // Create some data for other players
    await db.insert(reactionTimesTable)
      .values({
        player_name: 'OtherPlayer',
        reaction_time: 200,
        is_false_start: false
      })
      .execute();

    const result = await getPersonalBest('NonExistentPlayer');

    expect(result).toBeNull();
  });

  it('should return null if player only has false starts', async () => {
    // Create only false start records for the player
    await db.insert(reactionTimesTable)
      .values([
        {
          player_name: 'TestPlayer',
          reaction_time: 50,
          is_false_start: true
        },
        {
          player_name: 'TestPlayer',
          reaction_time: 30,
          is_false_start: true
        }
      ])
      .execute();

    const result = await getPersonalBest('TestPlayer');

    expect(result).toBeNull();
  });

  it('should handle case sensitivity correctly', async () => {
    // Create reaction time with specific case
    await db.insert(reactionTimesTable)
      .values({
        player_name: 'TestPlayer',
        reaction_time: 200,
        is_false_start: false
      })
      .execute();

    // Test with different case - should not match
    const result = await getPersonalBest('testplayer');

    expect(result).toBeNull();
  });
});
