import { db } from "./db"

export const QUEST_TEMPLATES = [
  {
    category: "calories",
    title: "[ ENERGY MANAGEMENT ]",
    description: "Consume your daily caloric objective. Fuel the hunt.",
    unit: "kcal",
    xpReward: 100,
    difficulty: "D",
    step: 50,
    icon: "🍖",
    getTarget: (dailyCalories: number | null) => dailyCalories ?? 2000,
  },
  {
    category: "water",
    title: "[ HYDRATION PROTOCOL ]",
    description: "Maintain optimal hydration levels. 8 glasses minimum.",
    unit: "glasses",
    xpReward: 50,
    difficulty: "E",
    step: 1,
    icon: "💧",
    getTarget: () => 8,
  },
  {
    category: "workout",
    title: "[ COMBAT TRAINING ]",
    description: "Complete your training regimen. Pain forges power.",
    unit: "min",
    xpReward: 150,
    difficulty: "C",
    step: 10,
    icon: "⚔️",
    getTarget: () => 30,
  },
  {
    category: "sleep",
    title: "[ RECOVERY PHASE ]",
    description: "Achieve full system recovery. Strength is rebuilt in rest.",
    unit: "hrs",
    xpReward: 75,
    difficulty: "E",
    step: 0.5,
    icon: "🌙",
    getTarget: () => 8,
  },
  {
    category: "tasks",
    title: "[ MISSION OBJECTIVES ]",
    description: "Complete your daily assignments. Every victory counts.",
    unit: "tasks",
    xpReward: 80,
    difficulty: "D",
    step: 1,
    icon: "📋",
    getTarget: () => 0,
  },
] as const

export type QuestCategory = (typeof QUEST_TEMPLATES)[number]["category"]

export async function getOrCreateDailyQuests(userId: string, date: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  const existing = await db.dailyQuest.findMany({
    where: { userId, date },
    orderBy: { category: "asc" },
  })

  if (existing.length === QUEST_TEMPLATES.length) return existing

  const existingCategories = new Set(existing.map((q) => q.category))
  const toCreate = QUEST_TEMPLATES.filter((t) => !existingCategories.has(t.category))

  await db.dailyQuest.createMany({
    data: toCreate.map((t) => ({
      userId,
      date,
      category: t.category,
      title: t.title,
      description: t.description,
      target: t.getTarget(user.dailyCalories),
      unit: t.unit,
      xpReward: t.xpReward,
      difficulty: t.difficulty,
    })),
  })

  return db.dailyQuest.findMany({
    where: { userId, date },
    orderBy: { category: "asc" },
  })
}

export function getTemplate(category: string) {
  return QUEST_TEMPLATES.find((t) => t.category === category)
}

export function todayString() {
  return new Date().toISOString().slice(0, 10)
}
