"use client"
import { useEffect, useState } from "react"

type UserRef = { id: string; name: string | null; rank: string }

type Duel = {
  id: string
  challengerId: string
  challengedId: string
  xpWager: number
  startDate: string
  endDate: string
  status: string
  winnerId: string | null
  challenger: UserRef
  challenged: UserRef
}

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280", D: "#10b981", C: "#3b82f6", B: "#8b5cf6",
  A: "#f59e0b", S: "#ef4444", National: "#f97316", ShadowMonarch: "#7c3aed",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  active: "#10b981",
  completed: "#6b7280",
  declined: "#ef4444",
}

function DuelCard({ duel, currentUserId, onAction }: {
  duel: Duel
  currentUserId: string
  onAction: () => void
}) {
  const isChallenger = duel.challengerId === currentUserId
  const opponent = isChallenger ? duel.challenged : duel.challenger
  const opponentColor = RANK_COLORS[opponent.rank] ?? "#6b7280"
  const won = duel.winnerId === currentUserId
  const lost = duel.winnerId && duel.winnerId !== currentUserId
  const statusColor = STATUS_COLORS[duel.status] ?? "#6b7280"

  async function accept() {
    await fetch(`/api/duels/${duel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    })
    onAction()
  }

  async function decline() {
    await fetch(`/api/duels/${duel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    })
    onAction()
  }

  return (
    <div className="system-window rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
            style={{ color: opponentColor, background: `${opponentColor}12`, border: `1px solid ${opponentColor}30` }}
          >
            {opponent.rank === "ShadowMonarch" ? "SM" : opponent.rank}
          </div>
          <div>
            <p className="font-mono font-bold text-white text-sm">{opponent.name ?? "Hunter"}</p>
            <p className="font-mono text-xs text-gray-600">
              {isChallenger ? "You challenged" : "Challenged you"} · {duel.startDate} → {duel.endDate}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 uppercase"
          style={{ color: statusColor, borderColor: `${statusColor}35`, background: `${statusColor}10` }}
        >
          {duel.status}
        </span>
      </div>

      <div
        className="flex items-center justify-center gap-2 rounded px-3 py-2 border"
        style={{ borderColor: "#f59e0b25", background: "#f59e0b08" }}
      >
        <span className="text-xs">⚡</span>
        <p className="font-mono text-xs text-amber-400">
          {duel.xpWager} XP wager · Winner takes all
        </p>
      </div>

      {duel.status === "completed" && (
        <div
          className={`text-center py-2 rounded border font-mono text-xs tracking-wider ${
            won ? "border-green-900/40 bg-green-950/20 text-green-400"
            : lost ? "border-red-900/40 bg-red-950/20 text-red-400"
            : "border-gray-700/40 bg-gray-950/20 text-gray-400"
          }`}
        >
          {won ? `✦ VICTORY — +${duel.xpWager} XP ✦`
           : lost ? `✦ DEFEAT — -${duel.xpWager} XP ✦`
           : "✦ DRAW — No XP transferred ✦"}
        </div>
      )}

      {duel.status === "pending" && !isChallenger && (
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 h-9 rounded border border-green-700/50 text-green-300 font-mono text-xs hover:border-green-500 hover:text-white transition-colors"
          >
            Accept Duel
          </button>
          <button
            onClick={decline}
            className="flex-1 h-9 rounded border border-red-900/50 text-red-400 font-mono text-xs hover:border-red-700 transition-colors"
          >
            Decline
          </button>
        </div>
      )}

      {duel.status === "pending" && isChallenger && (
        <p className="text-center text-gray-600 font-mono text-xs">Awaiting response...</p>
      )}

      {duel.status === "active" && (
        <p className="text-center font-mono text-xs text-green-400">
          Duel in progress — ends {duel.endDate}
        </p>
      )}
    </div>
  )
}

export default function DuelsPage() {
  const [duels, setDuels] = useState<Duel[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [wager, setWager] = useState(50)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const res = await fetch("/api/duels")
    const data = await res.json()
    setDuels(data)
    if (data.length > 0) {
      const first = data[0] as Duel
      setCurrentUserId(first.challengerId)
    }
    const meRes = await fetch("/api/auth/session")
    const me = await meRes.json()
    if (me?.user?.id) setCurrentUserId(me.user.id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function challenge(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), xpWager: wager }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? "Failed"); setSubmitting(false); return }
    setEmail("")
    setWager(50)
    await load()
    setSubmitting(false)
  }

  const pending = duels.filter((d) => d.status === "pending")
  const active = duels.filter((d) => d.status === "active")
  const history = duels.filter((d) => d.status === "completed" || d.status === "declined")

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="system-window rounded-lg p-5">
          <p className="system-text text-xs tracking-widest uppercase">Hunter Duels</p>
          <h1 className="text-2xl font-bold text-white font-mono mt-1">[ DUELS ]</h1>
          <p className="text-gray-600 font-mono text-xs mt-1">
            Challenge any hunter to a 7-day quest completion race. Winner steals the XP wager.
          </p>
        </div>

        {/* Challenge form */}
        <div className="system-window rounded-lg p-5 space-y-3">
          <p className="text-white font-mono font-bold text-sm">Issue a Challenge</p>
          {error && (
            <div className="border border-red-900/50 rounded px-3 py-2 bg-red-950/20">
              <p className="text-red-400 font-mono text-xs">{error}</p>
            </div>
          )}
          <form onSubmit={challenge} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-gray-500 font-mono text-xs">Hunter email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@example.com"
                className="w-full h-9 rounded border border-purple-900/50 bg-[#0f0f1a] px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-500 font-mono text-xs">XP Wager: {wager}</label>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={wager}
                onChange={(e) => setWager(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-gray-700 font-mono text-xs">
                <span>10</span>
                <span>1000</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 rounded border border-red-700/50 text-red-300 font-mono text-xs hover:border-red-500 hover:text-white transition-colors disabled:opacity-50 tracking-wider"
            >
              ⚔ CHALLENGE HUNTER
            </button>
          </form>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="system-window rounded-lg p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <p className="text-amber-400 font-mono text-xs uppercase tracking-widest px-1">Pending Challenges</p>
                {pending.map((d) => (
                  <DuelCard key={d.id} duel={d} currentUserId={currentUserId} onAction={load} />
                ))}
              </div>
            )}

            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-green-400 font-mono text-xs uppercase tracking-widest px-1">Active Duels</p>
                {active.map((d) => (
                  <DuelCard key={d.id} duel={d} currentUserId={currentUserId} onAction={load} />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-3">
                <p className="text-gray-600 font-mono text-xs uppercase tracking-widest px-1">History</p>
                {history.map((d) => (
                  <DuelCard key={d.id} duel={d} currentUserId={currentUserId} onAction={load} />
                ))}
              </div>
            )}

            {duels.length === 0 && (
              <div className="system-window rounded-lg p-6 text-center space-y-2">
                <p className="text-gray-500 font-mono text-sm">No duels yet.</p>
                <p className="text-gray-700 font-mono text-xs">Challenge a hunter above to start your first duel.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
