"use client"
import { useEffect, useState } from "react"

type Member = {
  id: string
  userId: string
  role: string
  weeklyXP: number
  user: { id: string; name: string | null; rank: string; xp: number }
}

type RaidBoss = {
  id: string
  name: string
  maxHP: number
  currentHP: number
  weekStart: string
  weekEnd: string
  defeated: boolean
  xpReward: number
}

type Activity = {
  id: string
  type: string
  detail: string
  createdAt: string
  userId: string
}

type Guild = {
  id: string
  name: string
  inviteCode: string
  leaderId: string
  guildXP: number
  guildLevel: number
  members: Member[]
  activities: Activity[]
}

type GuildData = { guild: Guild; boss: RaidBoss | null; morale: number } | null

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280", D: "#10b981", C: "#3b82f6", B: "#8b5cf6",
  A: "#f59e0b", S: "#ef4444", National: "#f97316", ShadowMonarch: "#7c3aed",
}

export default function GuildPage() {
  const [data, setData] = useState<GuildData | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [guildName, setGuildName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/guild/me")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  async function createGuild(e: React.FormEvent) {
    e.preventDefault()
    if (!guildName.trim() || submitting) return
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/guild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: guildName.trim() }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? "Failed"); setSubmitting(false); return }
    window.location.reload()
  }

  async function joinGuild(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim() || submitting) return
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/guild/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: inviteCode.trim() }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? "Failed"); setSubmitting(false); return }
    window.location.reload()
  }

  async function leaveGuild() {
    if (!confirm("Leave guild? This cannot be undone.")) return
    await fetch("/api/guild/leave", { method: "DELETE" })
    window.location.reload()
  }

  function copyInvite() {
    if (!data?.guild) return
    navigator.clipboard.writeText(data.guild.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-gray-600 font-mono text-sm animate-pulse">Connecting to guild network...</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="system-window rounded-lg p-5">
            <p className="system-text text-xs tracking-widest uppercase">Shadow Guilds</p>
            <h1 className="text-2xl font-bold text-white font-mono mt-1">[ GUILD ]</h1>
            <p className="text-gray-500 font-mono text-xs mt-1">No guild found. Form an alliance or join one.</p>
          </div>

          {error && (
            <div className="border border-red-900/50 rounded-lg px-4 py-3 bg-red-950/20">
              <p className="text-red-400 font-mono text-xs">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="system-window rounded-lg p-5 space-y-3">
              <p className="text-white font-mono font-bold text-sm">Create Guild</p>
              <p className="text-gray-500 font-mono text-xs">Form your own shadow army. You will be the guild leader.</p>
              <form onSubmit={createGuild} className="space-y-2">
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Guild name"
                  maxLength={32}
                  className="w-full h-9 rounded border border-purple-900/50 bg-[#0f0f1a] px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 font-mono"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 rounded border border-purple-700/50 text-purple-300 font-mono text-xs hover:border-purple-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  Form Guild
                </button>
              </form>
            </div>

            <div className="system-window rounded-lg p-5 space-y-3">
              <p className="text-white font-mono font-bold text-sm">Join Guild</p>
              <p className="text-gray-500 font-mono text-xs">Enter an invite code from a guild leader.</p>
              <form onSubmit={joinGuild} className="space-y-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invite code"
                  className="w-full h-9 rounded border border-purple-900/50 bg-[#0f0f1a] px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 font-mono"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 rounded border border-amber-700/50 text-amber-300 font-mono text-xs hover:border-amber-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  Join Guild
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { guild, boss, morale } = data
  const bossPercent = boss ? Math.round((boss.currentHP / boss.maxHP) * 100) : 0

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Guild Header */}
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Shadow Guild</p>
          <div className="flex items-end justify-between mt-1">
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{guild.name}</h1>
              <p className="text-gray-600 font-mono text-xs mt-0.5">
                Level {guild.guildLevel} · {guild.guildXP.toLocaleString()} Guild XP · {guild.members.length}/6 members
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyInvite}
                className="px-3 h-8 rounded border border-purple-700/50 text-purple-300 font-mono text-xs hover:border-purple-500 transition-colors"
              >
                {copied ? "Copied!" : "Copy Invite"}
              </button>
              <button
                onClick={leaveGuild}
                className="px-3 h-8 rounded border border-red-900/50 text-red-400 font-mono text-xs hover:border-red-700 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>

          {/* Morale bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs font-mono text-gray-500">
              <span>Guild Morale</span>
              <span style={{ color: morale >= 70 ? "#10b981" : morale >= 40 ? "#f59e0b" : "#ef4444" }}>
                {morale}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-purple-950/50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${morale}%`,
                  background: morale >= 70
                    ? "linear-gradient(90deg, #059669, #10b981)"
                    : morale >= 40
                    ? "linear-gradient(90deg, #d97706, #f59e0b)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
                  boxShadow: `0 0 8px ${morale >= 70 ? "#10b981" : morale >= 40 ? "#f59e0b" : "#ef4444"}40`,
                }}
              />
            </div>
            <p className="text-gray-700 font-mono text-xs">
              Based on quest completion this week across all members
            </p>
          </div>
        </div>

        {/* Raid Boss */}
        {boss && (
          <div className="system-window rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="system-text text-xs tracking-widest uppercase">Weekly Raid Boss</p>
                <h2 className="text-white font-mono font-bold text-lg mt-0.5">{boss.name}</h2>
                <p className="text-gray-600 font-mono text-xs">
                  Week {boss.weekStart} → {boss.weekEnd}
                </p>
              </div>
              <div className="text-right">
                {boss.defeated ? (
                  <p className="text-green-400 font-mono font-bold text-sm">DEFEATED</p>
                ) : (
                  <p className="text-red-400 font-mono font-bold text-sm">
                    {boss.currentHP.toLocaleString()} / {boss.maxHP.toLocaleString()} HP
                  </p>
                )}
                <p className="text-amber-400 font-mono text-xs">+{boss.xpReward} XP reward</p>
              </div>
            </div>

            {!boss.defeated && (
              <div className="space-y-1">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-red-950/50">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${bossPercent}%`,
                      background: "linear-gradient(90deg, #dc2626, #ef4444)",
                      boxShadow: "0 0 10px #ef444460",
                    }}
                  />
                </div>
                <p className="text-gray-700 font-mono text-xs text-right">
                  Complete quests to deal damage · Each quest completion = 5% max HP
                </p>
              </div>
            )}

            {boss.defeated && (
              <div className="border border-green-900/40 rounded px-4 py-3 bg-green-950/20 text-center">
                <p className="text-green-400 font-mono text-sm tracking-wider">
                  ✦ RAID COMPLETE — {boss.xpReward} XP awarded to all members ✦
                </p>
              </div>
            )}
          </div>
        )}

        {/* Weekly Leaderboard */}
        <div className="system-window rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white font-mono font-bold text-sm">Weekly Leaderboard</p>
            <p className="text-gray-600 font-mono text-xs">Resets Monday</p>
          </div>
          <div className="space-y-2">
            {guild.members.map((member, i) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded px-3 py-2 bg-purple-950/20"
              >
                <span className="font-mono text-xs text-gray-600 w-4 text-center">{i + 1}</span>
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                  style={{ color: RANK_COLORS[member.user.rank] ?? "#6b7280", background: `${RANK_COLORS[member.user.rank] ?? "#6b7280"}15` }}
                >
                  {member.user.rank === "ShadowMonarch" ? "SM" : member.user.rank}
                </div>
                <p className="flex-1 font-mono text-sm text-white truncate">
                  {member.user.name ?? "Hunter"}
                  {member.role === "leader" && (
                    <span className="text-amber-600 text-xs ml-1">★</span>
                  )}
                </p>
                <p className="font-mono text-xs text-amber-400">{member.weeklyXP.toLocaleString()} XP</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        {guild.activities.length > 0 && (
          <div className="system-window rounded-lg p-5 space-y-3">
            <p className="text-white font-mono font-bold text-sm">Guild Activity</p>
            <div className="space-y-2">
              {guild.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <span className="text-purple-600 font-mono text-xs mt-0.5">·</span>
                  <p className="text-gray-400 font-mono text-xs">{a.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
