import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { calculateDailyCalories } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(13).max(120),
  height: z.number().min(50).max(300),
  weight: z.number().min(20).max(500),
  goalType: z.enum(["lose", "maintain", "gain"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 })
    }

    const hashed = await bcrypt.hash(data.password, 12)
    const dailyCalories = calculateDailyCalories(
      data.weight,
      data.height,
      data.age,
      data.gender,
      data.goalType
    )

    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        goalType: data.goalType,
        dailyCalories,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
