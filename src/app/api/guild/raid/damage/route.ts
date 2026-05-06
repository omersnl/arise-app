import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { applyRaidDamage } from "@/lib/guild"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await applyRaidDamage(session.user.id)
  return NextResponse.json({ ok: true })
}
