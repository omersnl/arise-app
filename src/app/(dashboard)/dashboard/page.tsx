import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getRankForXP, getXPProgress, RANKS } from "@/types"
import { getOrCreateDailyQuests, todayString } from "@/lib/quests"
import { checkStreakBreak, getCurrentMilestone, getNextMilestone } from "@/lib/streak"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await checkStreakBreak(session.user.id)

  const [user, quests] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    getOrCreateDailyQuests(session.user.id, todayString()),
  ])
  if (!user) redirect("/login")

  const rank = getRankForXP(user.xp)
  const progress = getXPProgress(user.xp)
  const rankConfig = RANKS.find((r) => r.rank === rank)!

  const completedQuests = quests.filter((q) => q.completed).length
  const earnedXPToday = quests.filter((q) => q.completed).reduce((s, q) => s + q.xpReward, 0)
  const totalXPToday = quests.reduce((s, q) => s + q.xpReward, 0)

  const currentMilestone = getCurrentMilestone(user.streakDays)
  const nextMilestone = getNextMilestone(user.streakDays)

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Hunter Status */}
        <div className="system-window rounded-lg p-6">
          <p className="system-text text-xs tracking-widest uppercase mb-3">Hunter Status</p>
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
          <div className="system-window rounded-lg p-4 text-center">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">Total XP</p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: "#a855f7" }}>
              {user.xp.toLocaleString()}
            </p>
          </div>

          {/* Streak card */}
          <div className="system-window rounded-lg p-4 text-center">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">Streak</p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: currentMilestone?.color ?? "#f59e0b" }}>
              {user.streakDays}d
            </p>
            {currentMilestone && (
              <p className="font-mono text-xs mt-0.5" style={{ color: currentMilestone.color }}>
                {currentMilestone.label}
              </p>
            )}
            {nextMilestone && user.streakDays > 0 && (
              <p className="text-gray-700 font-mono text-xs mt-0.5">
                {nextMilestone.days - user.streakDays}d to {nextMilestone.label}
              </p>
            )}
          </div>

          <div className="system-window rounded-lg p-4 text-center">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">Daily Kcal</p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: "#10b981" }}>
              {user.dailyCalories?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        {/* Daily Quest Summary */}
        <Link href="/quests" className="block">
          <div className="system-window rounded-lg p-5 hover:border-purple-600/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="system-text text-xs tracking-widest uppercase">Daily Dungeon</p>
                <p className="text-white font-mono font-semibold text-sm mt-0.5">
                  {completedQuests === quests.length
                    ? "✦ All quests cleared!"
                    : `${completedQuests} / ${quests.length} quests cleared`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-mono font-bold">
                  {earnedXPToday}
                  <span className="text-gray-600 font-normal text-xs"> / {totalXPToday} XP</span>
                </p>
                <p className="text-gray-600 font-mono text-xs mt-0.5">today</p>
              </div>
            </div>

            <div className="space-y-2">
              {quests.map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  <span className="text-sm">
                    {q.completed ? "✓" : "·"}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-purple-950/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (q.current / q.target) * 100)}%`,
                        backgroundColor: q.completed ? "#10b981" : "#7c3aed",
                      }}
                    />
                  </div>
                  <span className={`font-mono text-xs ${q.completed ? "text-green-500" : "text-gray-600"}`}>
                    {q.category}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-purple-600 font-mono text-xs mt-3 text-right">
              Enter dungeon →
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
}
