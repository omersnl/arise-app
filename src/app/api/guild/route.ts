import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const createSchema = z.object({ name: z.string().min(2).max(32) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name } = createSchema.parse(body)

  const existing = await db.guildMember.findUnique({ where: { userId: session.user.id } })
  if (existing) return NextResponse.json({ error: "Already in a guild" }, { status: 400 })

  const guild = await db.guild.create({
    data: {
      name,
      leaderId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "leader", weekStart: "" },
      },
    },
    include: { members: true },
  })

  return NextResponse.json(guild)
}
