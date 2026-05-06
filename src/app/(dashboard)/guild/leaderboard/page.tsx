import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { resetWeeklyXPIfNeeded } from "@/lib/guild"

export const revalidate = 60

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280", D: "#10b981", C: "#3b82f6", B: "#8b5cf6",
  A: "#f59e0b", S: "#ef4444", National: "#f97316", ShadowMonarch: "#7c3aed",
}

async function getLeaderboard(guildId: string) {
  await resetWeeklyXPIfNeeded(guildId)
  return db.guildMember.findMany({
    where: { guildId },
    include: { user: { select: { name: true, rank: true, xp: true, streakDays: true } } },
    orderBy: { weeklyXP: "desc" },
  })
}

export default async function GuildLeaderboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await db.guildMember.findUnique({
    where: { userId: session.user.id },
    select: { guildId: true, guild: { select: { name: true } } },
  })
  if (!membership) redirect("/guild")

  const members = await getLeaderboard(membership.guildId)

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Guild Leaderboard</p>
          <h1 className="text-2xl font-bold text-white font-mono mt-1">
            {membership.guild.name}
          </h1>
          <p className="text-gray-600 font-mono text-xs mt-0.5">Weekly XP — resets every Monday</p>
        </div>

        <div className="system-window rounded-lg overflow-hidden">
          {members.map((member, i) => {
            const isFirst = i === 0
            const color = RANK_COLORS[member.user.rank] ?? "#6b7280"
            return (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < members.length - 1 ? "border-b border-purple-900/20" : ""
                } ${isFirst ? "bg-amber-950/10" : ""}`}
              >
                <span
                  className={`font-mono font-bold text-lg w-6 text-center ${
                    isFirst ? "text-amber-400" : "text-gray-600"
                  }`}
                >
                  {i === 0 ? "①" : i === 1 ? "②" : i === 2 ? "③" : `${i + 1}`}
                </span>
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                  style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
                >
                  {member.user.rank === "ShadowMonarch" ? "SM" : member.user.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white truncate">
                    {member.user.name ?? "Hunter"}
                    {member.role === "leader" && (
                      <span className="text-amber-600 text-xs ml-1.5">★ Leader</span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-gray-600">
                    {member.user.xp.toLocaleString()} total XP · {member.user.streakDays}d streak
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-amber-400">
                    {member.weeklyXP.toLocaleString()}
                  </p>
                  <p className="font-mono text-xs text-gray-600">weekly XP</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
