import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const schema = z.object({ action: z.enum(["accept", "decline"]) })

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action } = schema.parse(body)

  const duel = await db.duel.findUnique({ where: { id: params.id } })
  if (!duel) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (duel.challengedId !== session.user.id) return NextResponse.json({ error: "Not your duel" }, { status: 403 })
  if (duel.status !== "pending") return NextResponse.json({ error: "Duel is not pending" }, { status: 400 })

  const updated = await db.duel.update({
    where: { id: params.id },
    data: { status: action === "accept" ? "active" : "declined" },
    include: {
      challenger: { select: { id: true, name: true, rank: true } },
      challenged: { select: { id: true, name: true, rank: true } },
    },
  })

  return NextResponse.json(updated)
}
