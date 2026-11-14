import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toBadRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function toNotFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validateObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw toBadRequest(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isPlainObject(input)) {
    throw toBadRequest('Activity payload is required');
  }

  const userId = validateObjectId(input.userId, 'userId');
  const teamId = validateObjectId(input.teamId, 'teamId');
  const type = normalizeText(input.type);
  const minutesValue = Number(input.minutes);

  if (!type) {
    throw toBadRequest('Activity type is required');
  }
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw toBadRequest('Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user) {
    throw toNotFound('User not found');
  }
  if (!team) {
    throw toNotFound('Team not found');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!isPlainObject(input)) {
    throw toBadRequest('Team payload is required');
  }

  const name = normalizeText(input.name);
  const mascot = normalizeText(input.mascot);
  if (!name) {
    throw toBadRequest('Team name is required');
  }
  if (!mascot) {
    throw toBadRequest('Team mascot is required');
  }

  const members = Array.isArray(input.members) ? input.members : [];
  const memberIds = members.map((member) => validateObjectId(member, 'member')); 

  const existingUsers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  const existingIds = new Set(existingUsers.map((user) => user._id.toString()));
  const missingIds = memberIds.filter((memberId) => !existingIds.has(memberId.toString()));
  if (missingIds.length > 0) {
    throw toNotFound('One or more team members were not found');
  }

  const team = await Team.create({
    name,
    mascot,
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        teamId: '$_id',
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = normalizeText(userEmail).toLowerCase();
  if (!normalizedEmail) {
    throw toBadRequest('User email is required');
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw toNotFound('User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ? String(recentActivities[0].type) : '';
  const preferredFocus = normalizeText(user.fitnessGoal) || recentType;
  const priorityFocuses = Array.from(new Set([preferredFocus, recentType].filter(Boolean)));

  let workouts = priorityFocuses.length
    ? await Workout.find({ focus: { $in: priorityFocuses } }).sort({ minutes: -1 }).lean()
    : [];

  if (workouts.length === 0) {
    workouts = await Workout.find().sort({ minutes: -1 }).lean();
  }

  return workouts.map((workout) => {
    const focus = String(workout.focus ?? 'general');
    const supportsGoal = preferredFocus && focus === preferredFocus;
    const supportsRecentActivity = !!recentType && focus === recentType;
    const reason = supportsGoal
      ? `Your ${preferredFocus} goal matches this ${focus} workout and complements your recent ${recentType || 'activity'} pattern.`
      : supportsRecentActivity
        ? `Your recent ${recentType} activity suggests a ${focus} workout for your current training pattern.`
        : `This ${focus} workout supports your ${preferredFocus || 'overall fitness'} plan.`;

    return {
      ...workout,
      reason,
    };
  });
}

export { User };
