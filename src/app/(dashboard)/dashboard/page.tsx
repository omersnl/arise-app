import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getRankForXP, getXPProgress, RANKS } from "@/types"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/login")

  const rank = getRankForXP(user.xp)
  const progress = getXPProgress(user.xp)
  const rankConfig = RANKS.find((r) => r.rank === rank)!

  return (
    <main className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="system-window rounded-lg p-6">
          <p className="system-text text-xs tracking-widest uppercase mb-3">
            Hunter Status
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{user.name}</h1>
              <p className="text-gray-500 font-mono text-sm">{user.email}</p>
            </div>
            <div
              className="text-4xl font-black font-mono rank-badge"
              style={{ color: rankConfig.color }}
            >
              {rank === "ShadowMonarch" ? "SM" : rank}
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-gray-500">
              <span>{rankConfig.label}</span>
              {progress.nextRank && (
                <span>
                  {progress.current.toLocaleString()} / {progress.required.toLocaleString()} XP
                </span>
              )}
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-purple-950">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: rankConfig.color,
                  boxShadow: `0 0 8px ${rankConfig.color}60`,
                }}
              />
            </div>
            {progress.nextRank && (
              <p className="text-xs font-mono text-gray-600 text-right">
                Next: {progress.nextRank}-Rank
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total XP", value: user.xp.toLocaleString(), color: "#a855f7" },
            { label: "Streak", value: `${user.streakDays}d`, color: "#f59e0b" },
            { label: "Daily Kcal", value: user.dailyCalories?.toLocaleString() ?? "—", color: "#10b981" },
          ].map((stat) => (
            <div key={stat.label} className="system-window rounded-lg p-4 text-center">
              <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                {stat.label}
              </p>
              <p
                className="text-2xl font-bold font-mono mt-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div className="system-window rounded-lg p-6 text-center">
          <p className="text-purple-900/60 font-mono text-xs tracking-widest uppercase">
            Dungeon quests loading...
          </p>
          <p className="text-gray-700 font-mono text-sm mt-2">
            Daily missions will appear here once constructed.
          </p>
        </div>
      </div>
    </main>
  )
}
