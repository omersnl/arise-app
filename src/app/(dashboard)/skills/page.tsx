import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { SKILLS, SKILL_RARITY_COLORS, SKILL_KIND_COLORS } from "@/lib/skills"
import { type UserStats } from "@/lib/shadows"

async function getSkillsData(userId: string) {
  const [user, completedCount, unlockedRows] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.dailyQuest.count({ where: { userId, completed: true } }),
    db.userSkill.findMany({ where: { userId }, select: { skillId: true } }),
  ])
  if (!user) return null

  const stats: UserStats = {
    xp: user.xp,
    streakDays: user.streakDays,
    totalQuestsCompleted: completedCount,
    rank: user.rank,
  }

  const unlockedIds = new Set(unlockedRows.map((r) => r.skillId))

  const toUnlock = SKILLS.filter((s) => s.check(stats) && !unlockedIds.has(s.id))
  if (toUnlock.length > 0) {
    await db.userSkill.createMany({
      data: toUnlock.map((s) => ({ userId, skillId: s.id })),
      skipDuplicates: true,
    })
    toUnlock.forEach((s) => unlockedIds.add(s.id))
  }

  return { stats, unlockedIds }
}

export default async function SkillsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const data = await getSkillsData(session.user.id)
  if (!data) redirect("/login")

  const { stats, unlockedIds } = data
  const unlockedCount = SKILLS.filter((s) => unlockedIds.has(s.id)).length
  const activeUnlocked = SKILLS.filter((s) => s.kind === "Active" && unlockedIds.has(s.id)).length
  const passiveUnlocked = SKILLS.filter((s) => s.kind === "Passive" && unlockedIds.has(s.id)).length

  const byRarity = ["Legendary", "Epic", "Rare", "Common"] as const
  const sorted = [...SKILLS].sort(
    (a, b) => byRarity.indexOf(a.rarity) - byRarity.indexOf(b.rarity)
  )

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Skill Book</p>
          <div className="flex items-end justify-between mt-1">
            <h1 className="text-2xl font-bold text-white font-mono">[ SKILLS ]</h1>
            <div className="text-right">
              <p className="text-purple-400 font-mono font-bold text-lg">
                {unlockedCount}
                <span className="text-gray-600 font-normal text-sm"> / {SKILLS.length}</span>
              </p>
              <p className="text-gray-600 font-mono text-xs">skills acquired</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-purple-950/50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(unlockedCount / SKILLS.length) * 100}%`,
                  background: "linear-gradient(90deg, #6d28d9, #a855f7)",
                  boxShadow: "0 0 10px #a855f750",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-700">
              <span>
                <span style={{ color: SKILL_KIND_COLORS.Active }}>{activeUnlocked} active</span>
                {" · "}
                <span style={{ color: SKILL_KIND_COLORS.Passive }}>{passiveUnlocked} passive</span>
              </span>
              <span>XP: {stats.xp.toLocaleString()} · Streak: {stats.streakDays}d</span>
            </div>
          </div>
        </div>

        {/* Skills by rarity */}
        {byRarity.map((rarity) => {
          const skills = sorted.filter((s) => s.rarity === rarity)
          const rarityColor = SKILL_RARITY_COLORS[rarity]

          return (
            <div key={rarity} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-purple-900/30" />
                <span
                  className="font-mono text-xs tracking-widest uppercase px-2"
                  style={{ color: rarityColor }}
                >
                  {rarity}
                </span>
                <div className="h-px flex-1 bg-purple-900/30" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skills.map((skill) => {
                  const unlocked = unlockedIds.has(skill.id)
                  const kindColor = SKILL_KIND_COLORS[skill.kind]

                  return (
                    <div
                      key={skill.id}
                      className={`system-window rounded-lg p-5 space-y-3 transition-all duration-300 ${
                        unlocked ? "" : "opacity-50"
                      }`}
                      style={unlocked ? { borderColor: `${rarityColor}35` } : {}}
                    >
                      {/* Skill header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center text-lg flex-shrink-0 font-mono font-bold"
                            style={{
                              background: unlocked ? `${rarityColor}12` : "rgba(255,255,255,0.02)",
                              border: `1px solid ${unlocked ? rarityColor + "35" : "#1a1a3a"}`,
                              color: unlocked ? rarityColor : "#374151",
                            }}
                          >
                            {unlocked ? (skill.kind === "Active" ? "A" : "P") : "🔒"}
                          </div>
                          <div>
                            <p
                              className="font-mono font-bold text-sm leading-tight"
                              style={{ color: unlocked ? "#fff" : "#374151" }}
                            >
                              {skill.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="font-mono text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  color: unlocked ? kindColor : "#374151",
                                  background: unlocked ? `${kindColor}15` : "transparent",
                                }}
                              >
                                {skill.kind}
                              </span>
                            </div>
                          </div>
                        </div>

                        {unlocked && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0"
                            style={{
                              color: rarityColor,
                              borderColor: `${rarityColor}35`,
                              background: `${rarityColor}10`,
                            }}
                          >
                            {rarity}
                          </span>
                        )}
                      </div>

                      {unlocked ? (
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-mono leading-relaxed">
                            {skill.description}
                          </p>
                          <p
                            className="text-xs font-mono italic leading-relaxed"
                            style={{ color: `${rarityColor}80` }}
                          >
                            {skill.lore}
                          </p>
                          <div
                            className="flex items-center gap-2 rounded px-3 py-1.5 border"
                            style={{
                              borderColor: `${kindColor}25`,
                              background: `${kindColor}08`,
                            }}
                          >
                            <span className="text-xs">✦</span>
                            <p className="font-mono text-xs" style={{ color: kindColor }}>
                              {skill.effect}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-gray-700 text-xs font-mono">Locked</p>
                          <div className="border border-purple-900/20 rounded px-3 py-2 bg-purple-950/10">
                            <p className="text-gray-600 font-mono text-xs">
                              🔓 {skill.unlockLabel}
                            </p>
                          </div>
                        </div>
                      )}

                      {unlocked && (
                        <div
                          className="text-center py-1 rounded border text-xs font-mono tracking-wider"
                          style={{
                            color: rarityColor,
                            borderColor: `${rarityColor}25`,
                            background: `${rarityColor}06`,
                          }}
                        >
                          ✦ SKILL ACQUIRED ✦
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {unlockedCount === SKILLS.length && (
          <div className="system-window rounded-lg p-6 text-center space-y-2 border-purple-500/40">
            <p className="text-purple-400 font-mono tracking-widest text-sm">
              ✦ ALL SKILLS MASTERED ✦
            </p>
            <p className="text-gray-500 font-mono text-xs">
              Every ability acquired. You are the Shadow Monarch incarnate.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
