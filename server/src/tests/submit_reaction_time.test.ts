
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { type SubmitReactionTimeInput } from '../schema';
import { submitReactionTime } from '../handlers/submit_reaction_time';
import { eq } from 'drizzle-orm';

// Test input for valid reaction time
const testInput: SubmitReactionTimeInput = {
  player_name: 'TestPlayer',
  reaction_time: 250,
  is_false_start: false
};

describe('submitReactionTime', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit a reaction time successfully', async () => {
    const result = await submitReactionTime(testInput);

    // Basic field validation
    expect(result.player_name).toEqual('TestPlayer');
    expect(result.reaction_time).toEqual(250);
    expect(result.is_false_start).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save reaction time to database', async () => {
    const result = await submitReactionTime(testInput);

    // Query using proper drizzle syntax
    const records = await db.select()
      .from(reactionTimesTable)
      .where(eq(reactionTimesTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].player_name).toEqual('TestPlayer');
    expect(records[0].reaction_time).toEqual(250);
    expect(records[0].is_false_start).toEqual(false);
    expect(records[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle false start submission', async () => {
    const falseStartInput: SubmitReactionTimeInput = {
      player_name: 'FastPlayer',
      reaction_time: 100,
      is_false_start: true
    };

    const result = await submitReactionTime(falseStartInput);

    expect(result.player_name).toEqual('FastPlayer');
    expect(result.reaction_time).toEqual(100);
    expect(result.is_false_start).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle different player names and reaction times', async () => {
    const input1: SubmitReactionTimeInput = {
      player_name: 'Player1',
      reaction_time: 150,
      is_false_start: false
    };

    const input2: SubmitReactionTimeInput = {
      player_name: 'Player2',
      reaction_time: 300,
      is_false_start: false
    };

    const result1 = await submitReactionTime(input1);
    const result2 = await submitReactionTime(input2);

    expect(result1.player_name).toEqual('Player1');
    expect(result1.reaction_time).toEqual(150);
    expect(result2.player_name).toEqual('Player2');
    expect(result2.reaction_time).toEqual(300);

    // Verify both records exist in database
    const allRecords = await db.select()
      .from(reactionTimesTable)
      .execute();

    expect(allRecords).toHaveLength(2);
  });
});
