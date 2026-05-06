import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { todayString } from "@/lib/quests"

const createSchema = z.object({ title: z.string().min(1).max(200) })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await db.task.findMany({
    where: { userId: session.user.id, date: todayString() },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title } = createSchema.parse(body)
  const today = todayString()
  const userId = session.user.id

  const task = await db.task.create({ data: { userId, date: today, title } })

  const [totalCount, doneCount] = await Promise.all([
    db.task.count({ where: { userId, date: today } }),
    db.task.count({ where: { userId, date: today, completed: true } }),
  ])

  const quest = await db.dailyQuest.update({
    where: { userId_date_category: { userId, date: today, category: "tasks" } },
    data: { target: totalCount, current: doneCount },
  })

  return NextResponse.json({ task, quest })
}
