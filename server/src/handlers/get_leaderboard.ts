
import { type GetLeaderboardInput, type LeaderboardEntry } from '../schema';

export declare function getLeaderboard(input: GetLeaderboardInput): Promise<LeaderboardEntry[]>;
