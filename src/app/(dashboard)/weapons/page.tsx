import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { WEAPONS, WEAPON_TYPE_ICONS, WEAPON_RARITY_COLORS } from "@/lib/weapons"
import { type UserStats } from "@/lib/shadows"

async function getWeaponsData(userId: string) {
  const [user, completedCount, unlockedRows] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.dailyQuest.count({ where: { userId, completed: true } }),
    db.userWeapon.findMany({ where: { userId }, select: { weaponId: true } }),
  ])
  if (!user) return null

  const stats: UserStats = {
    xp: user.xp,
    streakDays: user.streakDays,
    totalQuestsCompleted: completedCount,
    rank: user.rank,
  }

  const unlockedIds = new Set(unlockedRows.map((r) => r.weaponId))

  const toUnlock = WEAPONS.filter((w) => w.check(stats) && !unlockedIds.has(w.id))
  if (toUnlock.length > 0) {
    await db.userWeapon.createMany({
      data: toUnlock.map((w) => ({ userId, weaponId: w.id })),
      skipDuplicates: true,
    })
    toUnlock.forEach((w) => unlockedIds.add(w.id))
  }

  return { stats, unlockedIds }
}

export default async function WeaponsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const data = await getWeaponsData(session.user.id)
  if (!data) redirect("/login")

  const { stats, unlockedIds } = data
  const unlockedCount = WEAPONS.filter((w) => unlockedIds.has(w.id)).length

  const byRarity = ["Legendary", "Epic", "Rare", "Common"] as const
  const sorted = [...WEAPONS].sort(
    (a, b) => byRarity.indexOf(a.rarity) - byRarity.indexOf(b.rarity)
  )

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Armory</p>
          <div className="flex items-end justify-between mt-1">
            <h1 className="text-2xl font-bold text-white font-mono">[ WEAPONS ]</h1>
            <div className="text-right">
              <p className="text-amber-400 font-mono font-bold text-lg">
                {unlockedCount}
                <span className="text-gray-600 font-normal text-sm"> / {WEAPONS.length}</span>
              </p>
              <p className="text-gray-600 font-mono text-xs">weapons forged</p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-purple-950/50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(unlockedCount / WEAPONS.length) * 100}%`,
                  background: "linear-gradient(90deg, #d97706, #f59e0b)",
                  boxShadow: "0 0 10px #f59e0b50",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-700">
              <span>XP: {stats.xp.toLocaleString()}</span>
              <span>Streak: {stats.streakDays}d · Quests: {stats.totalQuestsCompleted}</span>
            </div>
          </div>
        </div>

        {/* Rarity sections */}
        {byRarity.map((rarity) => {
          const weapons = sorted.filter((w) => w.rarity === rarity)
          const color = WEAPON_RARITY_COLORS[rarity]

          return (
            <div key={rarity} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-purple-900/30" />
                <span
                  className="font-mono text-xs tracking-widest uppercase px-2"
                  style={{ color }}
                >
                  {rarity}
                </span>
                <div className="h-px flex-1 bg-purple-900/30" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {weapons.map((weapon) => {
                  const unlocked = unlockedIds.has(weapon.id)

                  return (
                    <div
                      key={weapon.id}
                      className={`system-window rounded-lg p-5 space-y-3 transition-all duration-300 ${
                        unlocked ? "" : "opacity-50"
                      }`}
                      style={unlocked ? { borderColor: `${color}35` } : {}}
                    >
                      {/* Weapon header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center text-xl flex-shrink-0"
                            style={{
                              background: unlocked ? `${color}12` : "rgba(255,255,255,0.02)",
                              border: `1px solid ${unlocked ? color + "35" : "#1a1a3a"}`,
                            }}
                          >
                            {unlocked ? WEAPON_TYPE_ICONS[weapon.type] : "🔒"}
                          </div>
                          <div>
                            <p
                              className="font-mono font-bold text-sm leading-tight"
                              style={{ color: unlocked ? "#fff" : "#374151" }}
                            >
                              {weapon.name}
                            </p>
                            <p
                              className="font-mono text-xs"
                              style={{ color: unlocked ? color : "#374151" }}
                            >
                              {weapon.type}
                            </p>
                          </div>
                        </div>

                        {unlocked && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0"
                            style={{
                              color,
                              borderColor: `${color}35`,
                              background: `${color}10`,
                            }}
                          >
                            {weapon.rarity}
                          </span>
                        )}
                      </div>

                      {unlocked ? (
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-mono leading-relaxed">
                            {weapon.description}
                          </p>
                          <p
                            className="text-xs font-mono italic leading-relaxed"
                            style={{ color: `${color}80` }}
                          >
                            {weapon.lore}
                          </p>
                          <div
                            className="flex items-center gap-2 rounded px-3 py-1.5 border"
                            style={{
                              borderColor: `${color}25`,
                              background: `${color}08`,
                            }}
                          >
                            <span className="text-xs">⚡</span>
                            <p className="font-mono text-xs" style={{ color }}>
                              {weapon.statBonus}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-gray-700 text-xs font-mono">Locked</p>
                          <div className="border border-purple-900/20 rounded px-3 py-2 bg-purple-950/10">
                            <p className="text-gray-600 font-mono text-xs">
                              🔓 {weapon.unlockLabel}
                            </p>
                          </div>
                        </div>
                      )}

                      {unlocked && (
                        <div
                          className="text-center py-1 rounded border text-xs font-mono tracking-wider"
                          style={{
                            color,
                            borderColor: `${color}25`,
                            background: `${color}06`,
                          }}
                        >
                          ✦ EQUIPPED ✦
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {unlockedCount === WEAPONS.length && (
          <div className="system-window rounded-lg p-6 text-center space-y-2 border-amber-900/40">
            <p className="text-amber-400 font-mono tracking-widest text-sm">
              ✦ ARMORY COMPLETE ✦
            </p>
            <p className="text-gray-500 font-mono text-xs">
              Every weapon forged. The Shadow Monarch&apos;s arsenal is unmatched.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
