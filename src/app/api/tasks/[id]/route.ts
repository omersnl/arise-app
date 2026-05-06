import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { todayString } from "@/lib/quests"
import { getRankForXP } from "@/types"
import { tryUpdateStreak } from "@/lib/streak"
import { applyRaidDamage } from "@/lib/guild"

async function syncQuestProgress(userId: string, date: string) {
  const [totalCount, doneCount] = await Promise.all([
    db.task.count({ where: { userId, date } }),
    db.task.count({ where: { userId, date, completed: true } }),
  ])

  const nowComplete = totalCount > 0 && doneCount >= totalCount

  const quest = await db.dailyQuest.update({
    where: { userId_date_category: { userId, date, category: "tasks" } },
    data: {
      target: totalCount,
      current: doneCount,
      completed: nowComplete,
      completedAt: nowComplete ? new Date() : null,
    },
  })

  return { quest, justCompleted: nowComplete }
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const today = todayString()
  const userId = session.user.id

  const prevQuest = await db.dailyQuest.findUnique({
    where: { userId_date_category: { userId, date: today, category: "tasks" } },
  })
  const wasComplete = prevQuest?.completed ?? false

  const updatedTask = await db.task.update({
    where: { id: params.id },
    data: { completed: !task.completed },
  })

  const { quest, justCompleted } = await syncQuestProgress(userId, today)

  let xpAwarded = 0
  let streakResult = null
  let rankedUp = false

  if (!wasComplete && justCompleted) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user && quest.xpReward > 0) {
      const oldRank = getRankForXP(user.xp)
      const newXP = user.xp + quest.xpReward
      const newRank = getRankForXP(newXP)
      rankedUp = newRank !== oldRank
      xpAwarded = quest.xpReward

      await db.user.update({
        where: { id: userId },
        data: { xp: newXP, rank: newRank, lastActiveAt: new Date() },
      })
    }

    const [s] = await Promise.allSettled([
      tryUpdateStreak(userId),
      applyRaidDamage(userId),
    ])
    if (s.status === "fulfilled") streakResult = s.value
    revalidatePath("/guild")
  }

  return NextResponse.json({ task: updatedTask, quest, xpAwarded, rankedUp, streakResult })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const today = todayString()
  const userId = session.user.id

  await db.task.delete({ where: { id: params.id } })

  const { quest } = await syncQuestProgress(userId, today)

  return NextResponse.json({ quest })
}
