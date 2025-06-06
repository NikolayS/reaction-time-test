
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { submitReactionTimeInputSchema, getLeaderboardInputSchema } from './schema';
import { submitReactionTime } from './handlers/submit_reaction_time';
import { getLeaderboard } from './handlers/get_leaderboard';
import { getPersonalBest } from './handlers/get_personal_best';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  submitReactionTime: publicProcedure
    .input(submitReactionTimeInputSchema)
    .mutation(({ input }) => submitReactionTime(input)),
    
  getLeaderboard: publicProcedure
    .input(getLeaderboardInputSchema)
    .query(({ input }) => getLeaderboard(input)),
    
  getPersonalBest: publicProcedure
    .input(z.string().min(1).max(50))
    .query(({ input }) => getPersonalBest(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
