import { db } from "./db"
import { todayString } from "./quests"

export interface StreakMilestone {
  days: number
  label: string
  color: string
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3,   label: "Iron Will",           color: "#6b7280" },
  { days: 7,   label: "Dungeon Regular",      color: "#3b82f6" },
  { days: 14,  label: "Committed Hunter",     color: "#a855f7" },
  { days: 30,  label: "Elite Hunter",         color: "#f59e0b" },
  { days: 60,  label: "S-Rank Dedication",    color: "#ef4444" },
  { days: 100, label: "Shadow Monarch's Path", color: "#7c3aed" },
]

export function getCurrentMilestone(streakDays: number): StreakMilestone | null {
  const earned = STREAK_MILESTONES.filter((m) => streakDays >= m.days)
  return earned.length > 0 ? earned[earned.length - 1] : null
}

export function getNextMilestone(streakDays: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => streakDays < m.days) ?? null
}

function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// Call on dashboard load — resets streak if a day was skipped
export async function checkStreakBreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, lastStreakDate: true },
  })
  if (!user || !user.lastStreakDate || user.streakDays === 0) return

  const yesterday = yesterdayString()
  const today = todayString()

  // lastStreakDate is before yesterday — streak is broken
  if (user.lastStreakDate !== today && user.lastStreakDate < yesterday) {
    await db.user.update({
      where: { id: userId },
      data: { streakDays: 0, lastStreakDate: null },
    })
  }
}

// Call after a quest is completed — awards streak if all quests are done for the day
export async function tryUpdateStreak(
  userId: string
): Promise<{ streakUpdated: boolean; streakDays: number; milestone: StreakMilestone | null }> {
  const today = todayString()

  const [user, quests] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, lastStreakDate: true },
    }),
    db.dailyQuest.findMany({ where: { userId, date: today } }),
  ])

  if (!user || quests.length === 0) {
    return { streakUpdated: false, streakDays: user?.streakDays ?? 0, milestone: null }
  }

  // Not all quests complete yet
  if (!quests.every((q) => q.completed)) {
    return { streakUpdated: false, streakDays: user.streakDays, milestone: null }
  }

  // Already counted today
  if (user.lastStreakDate === today) {
    return { streakUpdated: false, streakDays: user.streakDays, milestone: null }
  }

  const yesterday = yesterdayString()
  const newStreak =
    user.lastStreakDate === yesterday ? user.streakDays + 1 : 1

  await db.user.update({
    where: { id: userId },
    data: { streakDays: newStreak, lastStreakDate: today },
  })

  const prevMilestone = getCurrentMilestone(user.streakDays)
  const newMilestone = getCurrentMilestone(newStreak)
  const milestone =
    newMilestone && newMilestone !== prevMilestone ? newMilestone : null

  return { streakUpdated: true, streakDays: newStreak, milestone }
}
