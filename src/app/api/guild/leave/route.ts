import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await db.guildMember.findUnique({
    where: { userId: session.user.id },
    include: { guild: { include: { members: true } } },
  })
  if (!membership) return NextResponse.json({ error: "Not in a guild" }, { status: 400 })

  const { guild } = membership
  const userId = session.user.id
  const remainingMembers = guild.members.filter((m) => m.userId !== userId)

  if (guild.leaderId === userId && remainingMembers.length > 0) {
    const newLeader = remainingMembers.sort(
      (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
    )[0]
    await db.guild.update({
      where: { id: guild.id },
      data: { leaderId: newLeader.userId },
    })
    await db.guildMember.update({
      where: { id: newLeader.id },
      data: { role: "leader" },
    })
  }

  await db.guildMember.delete({ where: { userId } })

  if (remainingMembers.length === 0) {
    await db.guild.delete({ where: { id: guild.id } })
  }

  return NextResponse.json({ ok: true })
}
