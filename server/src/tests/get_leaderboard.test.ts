
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reactionTimesTable } from '../db/schema';
import { type GetLeaderboardInput } from '../schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test reaction times
  const createTestReactionTime = async (playerName: string, reactionTime: number, isFalseStart = false, createdAt?: Date) => {
    const values: any = {
      player_name: playerName,
      reaction_time: reactionTime,
      is_false_start: isFalseStart
    };
    
    if (createdAt) {
      values.created_at = createdAt;
    }

    return await db.insert(reactionTimesTable)
      .values(values)
      .returning()
      .execute();
  };

  it('should return leaderboard with fastest times first', async () => {
    // Create test data with different reaction times
    await createTestReactionTime('Alice', 250);
    await createTestReactionTime('Bob', 200);
    await createTestReactionTime('Charlie', 300);

    const input: GetLeaderboardInput = {
      filter: 'all_time',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(3);
    expect(result[0].player_name).toEqual('Bob');
    expect(result[0].reaction_time).toEqual(200);
    expect(result[0].rank).toEqual(1);
    expect(result[1].player_name).toEqual('Alice');
    expect(result[1].reaction_time).toEqual(250);
    expect(result[1].rank).toEqual(2);
    expect(result[2].player_name).toEqual('Charlie');
    expect(result[2].reaction_time).toEqual(300);
    expect(result[2].rank).toEqual(3);
  });

  it('should exclude false starts from leaderboard', async () => {
    // Create test data including false starts
    await createTestReactionTime('Alice', 250, false);
    await createTestReactionTime('Bob', 100, true); // False start
    await createTestReactionTime('Charlie', 300, false);

    const input: GetLeaderboardInput = {
      filter: 'all_time',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(2);
    expect(result[0].player_name).toEqual('Alice');
    expect(result[1].player_name).toEqual('Charlie');
    // Bob should not appear in results due to false start
    expect(result.find(entry => entry.player_name === 'Bob')).toBeUndefined();
  });

  it('should respect limit parameter', async () => {
    // Create more test data than the limit
    await createTestReactionTime('Player1', 200);
    await createTestReactionTime('Player2', 250);
    await createTestReactionTime('Player3', 300);
    await createTestReactionTime('Player4', 350);

    const input: GetLeaderboardInput = {
      filter: 'all_time',
      limit: 2
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(2);
    expect(result[0].player_name).toEqual('Player1');
    expect(result[1].player_name).toEqual('Player2');
  });

  it('should filter by today correctly', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create data for today and yesterday
    await createTestReactionTime('TodayPlayer', 200, false, today);
    await createTestReactionTime('YesterdayPlayer', 150, false, yesterday);

    const input: GetLeaderboardInput = {
      filter: 'today',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(1);
    expect(result[0].player_name).toEqual('TodayPlayer');
  });

  it('should filter by this week correctly', async () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 8); // More than a week ago

    // Create data for this week and last week
    await createTestReactionTime('ThisWeekPlayer', 200, false, today);
    await createTestReactionTime('LastWeekPlayer', 150, false, lastWeek);

    const input: GetLeaderboardInput = {
      filter: 'this_week',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(1);
    expect(result[0].player_name).toEqual('ThisWeekPlayer');
  });

  it('should filter by this month correctly', async () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Create data for this month and last month
    await createTestReactionTime('ThisMonthPlayer', 200, false, today);
    await createTestReactionTime('LastMonthPlayer', 150, false, lastMonth);

    const input: GetLeaderboardInput = {
      filter: 'this_month',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(1);
    expect(result[0].player_name).toEqual('ThisMonthPlayer');
  });

  it('should return empty array when no valid entries exist', async () => {
    // Create only false starts
    await createTestReactionTime('Player1', 200, true);
    await createTestReactionTime('Player2', 250, true);

    const input: GetLeaderboardInput = {
      filter: 'all_time',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(0);
  });

  it('should include all required fields in response', async () => {
    await createTestReactionTime('TestPlayer', 250);

    const input: GetLeaderboardInput = {
      filter: 'all_time',
      limit: 10
    };

    const result = await getLeaderboard(input);

    expect(result).toHaveLength(1);
    const entry = result[0];
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe('number');
    expect(entry.player_name).toEqual('TestPlayer');
    expect(entry.reaction_time).toEqual(250);
    expect(typeof entry.reaction_time).toBe('number');
    expect(entry.created_at).toBeInstanceOf(Date);
    expect(entry.rank).toEqual(1);
    expect(typeof entry.rank).toBe('number');
  });
});
