import { Router } from 'express';
import { createActivity, createTeam, getLeaderboard, listActivities, listTeams, suggestWorkouts } from '../services/octofitService.js';

export const apiRouter = Router();

function asyncHandler<T>(handler: (request: any, response: any, next: any) => Promise<T>) {
  return async (request: any, response: any, next: any) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

apiRouter.get('/activities', asyncHandler(async (_request, response) => {
  response.json({ activities: await listActivities() });
}));

apiRouter.post('/activities', asyncHandler(async (request, response) => {
  response.status(201).json({ activity: await createActivity(request.body) });
}));

apiRouter.get('/teams', asyncHandler(async (_request, response) => {
  response.json({ teams: await listTeams() });
}));

apiRouter.post('/teams', asyncHandler(async (request, response) => {
  response.status(201).json({ team: await createTeam(request.body) });
}));

apiRouter.get('/leaderboard', asyncHandler(async (_request, response) => {
  response.json({ leaderboard: await getLeaderboard() });
}));

apiRouter.get('/workouts/suggestions/:userEmail', asyncHandler(async (request, response) => {
  response.json({ suggestions: await suggestWorkouts(request.params.userEmail) });
}));
