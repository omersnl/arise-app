import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { todayString } from "@/lib/quests"

const createSchema = z.object({
  email: z.string().email(),
  xpWager: z.number().min(10).max(1000).default(50),
})

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

async function resolveExpiredDuels(userId: string) {
  const today = todayString()
  const expired = await db.duel.findMany({
    where: {
      status: "active",
      endDate: { lt: today },
      OR: [{ challengerId: userId }, { challengedId: userId }],
    },
  })

  for (const duel of expired) {
    const [challengerCount, challengedCount] = await Promise.all([
      db.dailyQuest.count({
        where: { userId: duel.challengerId, date: { gte: duel.startDate, lte: duel.endDate }, completed: true },
      }),
      db.dailyQuest.count({
        where: { userId: duel.challengedId, date: { gte: duel.startDate, lte: duel.endDate }, completed: true },
      }),
    ])

    let winnerId: string | null = null
    if (challengerCount > challengedCount) winnerId = duel.challengerId
    else if (challengedCount > challengerCount) winnerId = duel.challengedId

    await db.duel.update({
      where: { id: duel.id },
      data: { status: "completed", winnerId },
    })

    if (winnerId) {
      const loserId = winnerId === duel.challengerId ? duel.challengedId : duel.challengerId
      await Promise.all([
        db.user.update({ where: { id: winnerId }, data: { xp: { increment: duel.xpWager } } }),
        db.user.update({ where: { id: loserId }, data: { xp: { decrement: duel.xpWager } } }),
      ])
    }
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await resolveExpiredDuels(session.user.id)

  const duels = await db.duel.findMany({
    where: {
      OR: [{ challengerId: session.user.id }, { challengedId: session.user.id }],
    },
    include: {
      challenger: { select: { id: true, name: true, rank: true } },
      challenged: { select: { id: true, name: true, rank: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(duels)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { email, xpWager } = createSchema.parse(body)

  const challenged = await db.user.findUnique({ where: { email } })
  if (!challenged) return NextResponse.json({ error: "Hunter not found" }, { status: 404 })
  if (challenged.id === session.user.id) return NextResponse.json({ error: "Cannot duel yourself" }, { status: 400 })

  const activeDuel = await db.duel.findFirst({
    where: {
      status: { in: ["pending", "active"] },
      OR: [
        { challengerId: session.user.id, challengedId: challenged.id },
        { challengerId: challenged.id, challengedId: session.user.id },
      ],
    },
  })
  if (activeDuel) return NextResponse.json({ error: "Active duel already exists with this hunter" }, { status: 400 })

  const startDate = todayString()
  const endDate = addDays(startDate, 6)

  const duel = await db.duel.create({
    data: {
      challengerId: session.user.id,
      challengedId: challenged.id,
      xpWager,
      startDate,
      endDate,
      status: "pending",
    },
    include: {
      challenger: { select: { id: true, name: true, rank: true } },
      challenged: { select: { id: true, name: true, rank: true } },
    },
  })

  return NextResponse.json(duel)
}
