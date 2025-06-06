
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  LeaderboardEntry, 
  TimeFilter, 
  SubmitReactionTimeInput,
  ReactionTime 
} from '../../server/src/schema';

type GameState = 'waiting' | 'ready' | 'green' | 'finished' | 'false_start';

function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all_time');
  const [personalBest, setPersonalBest] = useState<ReactionTime | null>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  
  // Game timing - use number for browser setTimeout
  const timeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    try {
      const result = await trpc.getLeaderboard.query({ filter: timeFilter, limit: 10 });
      setLeaderboard(result);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [timeFilter]);

  const loadPersonalBest = useCallback(async () => {
    if (!playerName.trim()) {
      setPersonalBest(null);
      return;
    }
    
    try {
      const result = await trpc.getPersonalBest.query(playerName.trim());
      setPersonalBest(result);
    } catch (error) {
      console.error('Failed to load personal best:', error);
      setPersonalBest(null);
    }
  }, [playerName]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const delayedLoad = setTimeout(() => {
      loadPersonalBest();
    }, 500); // Debounce personal best loading

    return () => clearTimeout(delayedLoad);
  }, [loadPersonalBest]);

  const startGame = () => {
    if (gameState !== 'waiting') return;
    
    setGameState('ready');
    setReactionTime(null);
    
    // Random delay between 2-5 seconds
    const delay = Math.random() * 3000 + 2000;
    
    timeoutRef.current = window.setTimeout(() => {
      setGameState('green');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      // Start the game
      startGame();
      return;
    }
    
    if (gameState === 'ready') {
      // False start
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setGameState('false_start');
      return;
    }
    
    if (gameState === 'green') {
      // Successful reaction
      if (startTimeRef.current) {
        const time = Date.now() - startTimeRef.current;
        setReactionTime(time);
        setGameState('finished');
      }
      return;
    }
    
    if (gameState === 'finished' || gameState === 'false_start') {
      // Reset game
      setGameState('waiting');
      setReactionTime(null);
      startTimeRef.current = null;
    }
  };

  const submitScore = async () => {
    if (!playerName.trim() || reactionTime === null || gameState !== 'finished') return;
    
    setIsSubmitting(true);
    try {
      const submitData: SubmitReactionTimeInput = {
        player_name: playerName.trim(),
        reaction_time: reactionTime,
        is_false_start: false
      };
      
      await trpc.submitReactionTime.mutate(submitData);
      
      // Reload leaderboard and personal best
      await Promise.all([loadLeaderboard(), loadPersonalBest()]);
      
      // Reset game
      setGameState('waiting');
      setReactionTime(null);
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonColor = () => {
    switch (gameState) {
      case 'waiting': return 'bg-blue-500 hover:bg-blue-600';
      case 'ready': return 'bg-red-500 hover:bg-red-600';
      case 'green': return 'bg-green-500 hover:bg-green-600';
      case 'finished': return 'bg-blue-500 hover:bg-blue-600';
      case 'false_start': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500';
    }
  };

  const getButtonText = () => {
    switch (gameState) {
      case 'waiting': return '🎯 Click to Start';
      case 'ready': return '⏳ Wait for Green...';
      case 'green': return '🟢 CLICK NOW!';
      case 'finished': return '✅ Click to Play Again';
      case 'false_start': return '❌ False Start! Click to Retry';
      default: return 'Click Me';
    }
  };

  const formatTime = (ms: number) => `${ms}ms`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          ⚡ Reaction Time Test ⚡
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">🎮 Test Your Reactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Click the button as soon as it turns green!
                </p>
                
                <Button
                  onClick={handleClick}
                  disabled={isSubmitting}
                  className={`w-full h-32 text-xl font-bold transition-all duration-200 ${getButtonColor()}`}
                >
                  {getButtonText()}
                </Button>
                
                {gameState === 'ready' && (
                  <p className="text-sm text-orange-600 font-medium">
                    🚨 Don't click yet! Wait for green...
                  </p>
                )}
                
                {gameState === 'false_start' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium">
                      ❌ False start! You clicked too early.
                    </p>
                  </div>
                )}
                
                {gameState === 'finished' && reactionTime !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        🎉 {formatTime(reactionTime)}
                      </p>
                      <p className="text-green-600">Great reaction time!</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter your name to submit score"
                        value={playerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setPlayerName(e.target.value)
                        }
                        maxLength={50}
                      />
                      <Button
                        onClick={submitScore}
                        disabled={!playerName.trim() || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? '📤 Submitting...' : '🏆 Submit to Leaderboard'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {personalBest && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    🏅 Your Personal Best
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">{personalBest.player_name}</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {formatTime(personalBest.reaction_time)}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Set on {personalBest.created_at.toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Leaderboard Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span>🏆 Leaderboard</span>
                <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_time">All Time</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboard ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">🔄 Loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    📭 No scores yet for this time period. Be the first!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry: LeaderboardEntry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={entry.rank === 1 ? "default" : "secondary"}
                          className={entry.rank === 1 ? "bg-yellow-500 text-white" : ""}
                        >
                          #{entry.rank}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-800">
                            {entry.rank === 1 && "🥇 "}
                            {entry.rank === 2 && "🥈 "}
                            {entry.rank === 3 && "🥉 "}
                            {entry.player_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800">
                          {formatTime(entry.reaction_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-8" />
        
        <div className="text-center text-gray-600 space-y-2">
          <h3 className="font-semibold">📋 How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 shadow">
              <p><span className="font-medium">1. Start:</span> Click the blue button to begin</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p><span className="font-medium">2. Wait:</span> Button turns red - don't click yet!</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p><span className="font-medium">3. React:</span> Click as soon as it turns green</p>
            </div>
          </div>
          <p className="text-xs mt-4">
            💡 Average human reaction time is around 200-300ms. Can you beat it?
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
