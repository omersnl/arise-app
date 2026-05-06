import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getOrCreateDailyQuests, todayString } from "@/lib/quests"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const quests = await getOrCreateDailyQuests(session.user.id, todayString())
  return NextResponse.json(quests)
}
