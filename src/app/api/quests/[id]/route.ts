import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRankForXP } from "@/types"
import { tryUpdateStreak } from "@/lib/streak"
import { applyRaidDamage } from "@/lib/guild"

const schema = z.object({ delta: z.number() })

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { delta } = schema.parse(body)

  const quest = await db.dailyQuest.findUnique({ where: { id: params.id } })
  if (!quest || quest.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (quest.completed) {
    return NextResponse.json(quest)
  }

  const newCurrent = Math.max(0, Math.min(quest.target * 2, quest.current + delta))
  const justCompleted = !quest.completed && newCurrent >= quest.target

  const updatedQuest = await db.dailyQuest.update({
    where: { id: params.id },
    data: {
      current: newCurrent,
      completed: justCompleted || quest.completed,
      completedAt: justCompleted ? new Date() : quest.completedAt,
    },
  })

  let user = await db.user.findUnique({ where: { id: session.user.id } })
  let rankedUp = false

  if (justCompleted && user) {
    const oldRank = getRankForXP(user.xp)
    const newXP = user.xp + quest.xpReward
    const newRank = getRankForXP(newXP)
    rankedUp = newRank !== oldRank

    user = await db.user.update({
      where: { id: session.user.id },
      data: {
        xp: newXP,
        rank: newRank,
        lastActiveAt: new Date(),
      },
    })
  }

  const userId = session.user.id
  const [streakResult] = await Promise.all([
    justCompleted ? tryUpdateStreak(userId) : Promise.resolve(null),
    justCompleted ? applyRaidDamage(userId) : Promise.resolve(null),
  ])

  if (justCompleted) {
    revalidatePath("/guild")
  }

  return NextResponse.json({
    quest: updatedQuest,
    xpAwarded: justCompleted ? quest.xpReward : 0,
    totalXP: user?.xp ?? 0,
    rank: user?.rank ?? "E",
    rankedUp,
    streakUpdated: streakResult?.streakUpdated ?? false,
    streakDays: streakResult?.streakDays ?? 0,
    streakMilestone: streakResult?.milestone ?? null,
  })
}
