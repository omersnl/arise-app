import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getWeekStart } from "@/lib/guild"

const schema = z.object({ inviteCode: z.string() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { inviteCode } = schema.parse(body)

  const existing = await db.guildMember.findUnique({ where: { userId: session.user.id } })
  if (existing) return NextResponse.json({ error: "Already in a guild" }, { status: 400 })

  const guild = await db.guild.findUnique({
    where: { inviteCode },
    include: { members: true },
  })
  if (!guild) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
  if (guild.members.length >= 6) return NextResponse.json({ error: "Guild is full (max 6)" }, { status: 400 })

  const member = await db.guildMember.create({
    data: { guildId: guild.id, userId: session.user.id, weekStart: getWeekStart() },
  })

  return NextResponse.json({ guild, member })
}
