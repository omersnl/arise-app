import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toString()
}

export function calculateDailyCalories(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female",
  goalType: "lose" | "maintain" | "gain"
): number {
  // Mifflin-St Jeor equation (weight kg, height cm)
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161

  const tdee = bmr * 1.55 // moderate activity

  if (goalType === "lose") return Math.round(tdee - 500)
  if (goalType === "gain") return Math.round(tdee + 300)
  return Math.round(tdee)
}
