import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getOrSpawnRaidBoss, computeGuildMorale, resetWeeklyXPIfNeeded } from "@/lib/guild"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await db.guildMember.findUnique({
    where: { userId: session.user.id },
    select: { guildId: true },
  })
  if (!membership) return NextResponse.json(null)

  const { guildId } = membership

  await resetWeeklyXPIfNeeded(guildId)

  const [guild, boss, morale] = await Promise.all([
    db.guild.findUnique({
      where: { id: guildId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, rank: true, xp: true } } },
          orderBy: { weeklyXP: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { guild: { select: { name: true } } },
        },
      },
    }),
    getOrSpawnRaidBoss(guildId),
    computeGuildMorale(guildId),
  ])

  return NextResponse.json({ guild, boss, morale })
}
