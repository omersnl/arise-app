import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  SHADOWS,
  RARITY_COLORS,
  TYPE_ICONS,
  type UserStats,
} from "@/lib/shadows"

async function getShadowsData(userId: string) {
  const [user, completedCount, unlockedRows] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.dailyQuest.count({ where: { userId, completed: true } }),
    db.userShadow.findMany({ where: { userId }, select: { shadowId: true } }),
  ])

  if (!user) return null

  const stats: UserStats = {
    xp: user.xp,
    streakDays: user.streakDays,
    totalQuestsCompleted: completedCount,
    rank: user.rank,
  }

  const unlockedIds = new Set(unlockedRows.map((r) => r.shadowId))

  // Auto-unlock any newly earned shadows
  const toUnlock = SHADOWS.filter(
    (s) => s.check(stats) && !unlockedIds.has(s.id)
  )
  if (toUnlock.length > 0) {
    await db.userShadow.createMany({
      data: toUnlock.map((s) => ({ userId, shadowId: s.id })),
      skipDuplicates: true,
    })
    toUnlock.forEach((s) => unlockedIds.add(s.id))
  }

  return { stats, unlockedIds }
}

export default async function ShadowsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const data = await getShadowsData(session.user.id)
  if (!data) redirect("/login")

  const { stats, unlockedIds } = data
  const unlockedCount = SHADOWS.filter((s) => unlockedIds.has(s.id)).length

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Shadow Army</p>
          <div className="flex items-end justify-between mt-1">
            <h1 className="text-2xl font-bold text-white font-mono">
              [ ARISE ]
            </h1>
            <div className="text-right">
              <p className="text-purple-400 font-mono font-bold text-lg">
                {unlockedCount}
                <span className="text-gray-600 font-normal text-sm"> / {SHADOWS.length}</span>
              </p>
              <p className="text-gray-600 font-mono text-xs">shadows extracted</p>
            </div>
          </div>

          {/* Army progress bar */}
          <div className="mt-3 space-y-1">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-purple-950/50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(unlockedCount / SHADOWS.length) * 100}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                  boxShadow: "0 0 10px #7c3aed60",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-700">
              <span>XP: {stats.xp.toLocaleString()}</span>
              <span>Streak: {stats.streakDays}d · Quests: {stats.totalQuestsCompleted}</span>
            </div>
          </div>
        </div>

        {/* Shadow grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SHADOWS.map((shadow) => {
            const unlocked = unlockedIds.has(shadow.id)
            const rarityColor = RARITY_COLORS[shadow.rarity]

            return (
              <div
                key={shadow.id}
                className={`system-window rounded-lg p-5 space-y-3 transition-all duration-300 ${
                  unlocked ? "" : "opacity-50"
                }`}
                style={
                  unlocked
                    ? { borderColor: `${rarityColor}40` }
                    : {}
                }
              >
                {/* Shadow header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: unlocked
                          ? `${rarityColor}15`
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${unlocked ? rarityColor + "40" : "#1a1a3a"}`,
                      }}
                    >
                      {unlocked ? TYPE_ICONS[shadow.type] : "🔒"}
                    </div>
                    <div>
                      <p
                        className="font-mono font-bold text-sm"
                        style={{ color: unlocked ? "#fff" : "#374151" }}
                      >
                        {shadow.name}
                      </p>
                      <p
                        className="font-mono text-xs"
                        style={{ color: unlocked ? rarityColor : "#374151" }}
                      >
                        {shadow.type} · {shadow.rarity}
                      </p>
                    </div>
                  </div>

                  {unlocked && (
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0"
                      style={{
                        color: rarityColor,
                        borderColor: `${rarityColor}40`,
                        background: `${rarityColor}10`,
                      }}
                    >
                      {shadow.rarity}
                    </span>
                  )}
                </div>

                {/* Description / locked state */}
                {unlocked ? (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs font-mono leading-relaxed">
                      {shadow.description}
                    </p>
                    <p
                      className="text-xs font-mono italic leading-relaxed"
                      style={{ color: `${rarityColor}90` }}
                    >
                      {shadow.lore}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-gray-700 text-xs font-mono">Locked</p>
                    <div className="border border-purple-900/20 rounded px-3 py-2 bg-purple-950/10">
                      <p className="text-gray-600 font-mono text-xs">
                        🔓 {shadow.unlockLabel}
                      </p>
                    </div>
                  </div>
                )}

                {/* Unlocked badge */}
                {unlocked && (
                  <div
                    className="text-center py-1 rounded border text-xs font-mono tracking-wider"
                    style={{
                      color: rarityColor,
                      borderColor: `${rarityColor}30`,
                      background: `${rarityColor}08`,
                    }}
                  >
                    ✦ SHADOW EXTRACTED ✦
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {unlockedCount === SHADOWS.length && (
          <div className="system-window rounded-lg p-6 text-center space-y-2 border-purple-500/40">
            <p className="text-purple-400 font-mono tracking-widest text-sm">
              ✦ SHADOW ARMY COMPLETE ✦
            </p>
            <p className="text-gray-500 font-mono text-xs">
              You stand at the pinnacle. The Shadow Monarch's army is whole.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
