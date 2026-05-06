import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getOrSpawnRaidBoss } from "@/lib/guild"

async function getRaidData(guildId: string) {
  const boss = await getOrSpawnRaidBoss(guildId)
  if (!boss) return null

  const logs = await db.raidDamageLog.findMany({
    where: { raidBossId: boss.id },
    include: { },
    orderBy: { date: "desc" },
  })

  const memberIds = Array.from(new Set(logs.map((l) => l.userId)))
  const users = await db.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, rank: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const byUser: Record<string, { name: string; rank: string; totalDamage: number }> = {}
  for (const log of logs) {
    if (!byUser[log.userId]) {
      byUser[log.userId] = { name: userMap[log.userId]?.name ?? "Hunter", rank: userMap[log.userId]?.rank ?? "E", totalDamage: 0 }
    }
    byUser[log.userId].totalDamage += log.damage
  }

  const now = new Date()
  const weekEnd = new Date(boss.weekEnd + "T23:59:59")
  const msLeft = Math.max(0, weekEnd.getTime() - now.getTime())
  const daysLeft = Math.floor(msLeft / 86400000)
  const hoursLeft = Math.floor((msLeft % 86400000) / 3600000)

  return { boss, contributors: Object.values(byUser).sort((a, b) => b.totalDamage - a.totalDamage), daysLeft, hoursLeft }
}

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280", D: "#10b981", C: "#3b82f6", B: "#8b5cf6",
  A: "#f59e0b", S: "#ef4444", National: "#f97316", ShadowMonarch: "#7c3aed",
}

export default async function RaidPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await db.guildMember.findUnique({
    where: { userId: session.user.id },
    select: { guildId: true, guild: { select: { name: true } } },
  })
  if (!membership) redirect("/guild")

  const data = await getRaidData(membership.guildId)
  if (!data) redirect("/guild")

  const { boss, contributors, daysLeft, hoursLeft } = data
  const bossPercent = Math.round((boss.currentHP / boss.maxHP) * 100)

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Weekly Raid</p>
          <div className="flex items-end justify-between mt-1">
            <h1 className="text-2xl font-bold text-white font-mono">{boss.name}</h1>
            <div className="text-right">
              {boss.defeated ? (
                <p className="text-green-400 font-mono font-bold">DEFEATED</p>
              ) : (
                <p className="font-mono text-xs text-gray-500">
                  {daysLeft}d {hoursLeft}h remaining
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Boss HP</span>
              <span className={boss.defeated ? "text-green-400" : "text-red-400"}>
                {boss.currentHP.toLocaleString()} / {boss.maxHP.toLocaleString()}
              </span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-red-950/50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${bossPercent}%`,
                  background: boss.defeated
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
                  boxShadow: `0 0 12px ${boss.defeated ? "#10b981" : "#ef4444"}60`,
                }}
              />
            </div>
            <p className="text-right font-mono text-xs text-gray-600">{bossPercent}% HP remaining</p>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-gray-600">
            <span>Week: {boss.weekStart} → {boss.weekEnd}</span>
            <span className="text-amber-400">+{boss.xpReward} XP per member on defeat</span>
          </div>
        </div>

        {/* Damage contributors */}
        <div className="system-window rounded-lg p-5 space-y-3">
          <p className="text-white font-mono font-bold text-sm">Damage Log</p>
          {contributors.length === 0 ? (
            <p className="text-gray-600 font-mono text-xs">No damage dealt yet — complete quests to attack the boss.</p>
          ) : (
            <div className="space-y-2">
              {contributors.map((c, i) => {
                const color = RANK_COLORS[c.rank] ?? "#6b7280"
                const sharePercent = Math.round((c.totalDamage / boss.maxHP) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs w-4 text-right">{i + 1}</span>
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                      style={{ color, background: `${color}15` }}
                    >
                      {c.rank === "ShadowMonarch" ? "SM" : c.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <p className="font-mono text-xs text-white truncate">{c.name}</p>
                        <p className="font-mono text-xs text-red-400 flex-shrink-0">{c.totalDamage.toLocaleString()} dmg ({sharePercent}%)</p>
                      </div>
                      <div className="relative h-1 w-full overflow-hidden rounded-full bg-red-950/30">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, sharePercent)}%`,
                            background: "linear-gradient(90deg, #dc2626, #ef4444)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-gray-700 font-mono text-xs border-t border-purple-900/20 pt-3">
            Each completed quest deals 5% of the boss&apos;s max HP as damage (once per day per member)
          </p>
        </div>
      </div>
    </main>
  )
}
