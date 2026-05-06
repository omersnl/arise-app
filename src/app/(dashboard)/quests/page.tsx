"use client"
import { useEffect, useState, useCallback } from "react"
import { getTemplate } from "@/lib/quests"

type Quest = {
  id: string
  category: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  xpReward: number
  difficulty: string
  completed: boolean
  completedAt: string | null
}

type RankUpToast = { rank: string; xp: number } | null
type StreakMilestone = { days: number; label: string; color: string }

const DIFFICULTY_COLORS: Record<string, string> = {
  E: "#6b7280",
  D: "#10b981",
  C: "#3b82f6",
  B: "#8b5cf6",
  A: "#f59e0b",
  S: "#ef4444",
}

function QuestCard({
  quest,
  onDelta,
  loading,
}: {
  quest: Quest
  onDelta: (id: string, delta: number) => void
  loading: boolean
}) {
  const template = getTemplate(quest.category)
  const percent = Math.min(100, (quest.current / quest.target) * 100)
  const color = DIFFICULTY_COLORS[quest.difficulty] ?? "#6b7280"
  const [inputVal, setInputVal] = useState("")
  const [showInput, setShowInput] = useState(false)

  function handleCustomLog(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(inputVal)
    if (!isNaN(val) && val > 0) {
      onDelta(quest.id, val - quest.current)
      setInputVal("")
      setShowInput(false)
    }
  }

  return (
    <div
      className={`system-window rounded-lg p-5 space-y-3 transition-all duration-300 ${
        quest.completed ? "opacity-70" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{template?.icon ?? "⚡"}</span>
          <div className="min-w-0">
            <p className="text-purple-400 font-mono text-xs uppercase tracking-widest">
              {quest.category}
            </p>
            <h3 className="font-mono font-bold text-white text-sm leading-tight">
              {quest.title}
            </h3>
            <p className="text-gray-500 text-xs font-mono mt-0.5 leading-relaxed">
              {quest.description}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className="font-mono text-xs font-bold rank-badge"
            style={{ color }}
          >
            {quest.difficulty}
          </span>
          <p className="text-amber-400 font-mono text-xs mt-0.5">+{quest.xpReward} XP</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-gray-500">
          <span>
            {quest.unit === "kcal"
              ? `${quest.current.toLocaleString()} / ${quest.target.toLocaleString()} kcal`
              : `${quest.current} / ${quest.target} ${quest.unit}`}
          </span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-purple-950/50">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${percent}%`,
              backgroundColor: quest.completed ? "#10b981" : color,
              boxShadow: quest.completed
                ? "0 0 8px #10b98160"
                : `0 0 8px ${color}60`,
            }}
          />
        </div>
      </div>

      {/* Controls / Cleared */}
      {quest.completed ? (
        <div className="text-center py-2 border border-green-900/40 rounded bg-green-950/20">
          <p className="text-green-400 font-mono text-xs tracking-wider">
            ✦ DUNGEON CLEARED · +{quest.xpReward} XP ✦
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelta(quest.id, -(template?.step ?? 1))}
              disabled={loading || quest.current === 0}
              className="h-8 w-8 rounded border border-purple-900/50 text-gray-400 hover:border-purple-600 hover:text-white font-mono text-sm transition-colors disabled:opacity-30"
            >
              −
            </button>
            <div className="flex-1 text-center font-mono text-sm text-white">
              {quest.unit === "kcal"
                ? quest.current.toLocaleString()
                : quest.current}{" "}
              <span className="text-gray-600 text-xs">{quest.unit}</span>
            </div>
            <button
              onClick={() => onDelta(quest.id, template?.step ?? 1)}
              disabled={loading}
              className="h-8 w-8 rounded border border-purple-900/50 text-gray-400 hover:border-purple-600 hover:text-white font-mono text-sm transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>

          {/* Quick set for calories */}
          {quest.category === "calories" && (
            <div>
              {showInput ? (
                <form onSubmit={handleCustomLog} className="flex gap-2">
                  <input
                    type="number"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Enter total kcal"
                    autoFocus
                    className="flex-1 h-8 rounded border border-purple-900/50 bg-[#0f0f1a] px-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 h-8 rounded border border-purple-700/50 text-purple-300 font-mono text-xs hover:border-purple-500 transition-colors"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInput(false)}
                    className="px-2 h-8 text-gray-600 font-mono text-xs hover:text-gray-400 transition-colors"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full text-gray-600 hover:text-gray-400 font-mono text-xs transition-colors"
                >
                  Set exact amount →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [rankUpToast, setRankUpToast] = useState<RankUpToast>(null)
  const [xpToast, setXpToast] = useState<{ xp: number; label: string } | null>(null)
  const [streakToast, setStreakToast] = useState<{ days: number; milestone: StreakMilestone | null } | null>(null)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    fetch("/api/quests")
      .then((r) => r.json())
      .then((data) => {
        setQuests(data)
        setLoading(false)
      })
  }, [])

  const handleDelta = useCallback(async (id: string, delta: number) => {
    if (updating) return
    setUpdating(true)

    const res = await fetch(`/api/quests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    })
    const data = await res.json()

    setQuests((prev) =>
      prev.map((q) => (q.id === id ? data.quest : q))
    )

    if (data.xpAwarded > 0) {
      const quest = quests.find((q) => q.id === id)
      setXpToast({ xp: data.xpAwarded, label: quest?.title ?? "" })
      setTimeout(() => setXpToast(null), 3000)
    }

    if (data.rankedUp) {
      setRankUpToast({ rank: data.rank, xp: data.totalXP })
      setTimeout(() => setRankUpToast(null), 5000)
    }

    if (data.streakUpdated) {
      setStreakToast({ days: data.streakDays, milestone: data.streakMilestone })
      setTimeout(() => setStreakToast(null), 4000)
    }

    setUpdating(false)
  }, [updating, quests])

  const completedCount = quests.filter((q) => q.completed).length
  const totalXPAvailable = quests.reduce((s, q) => s + q.xpReward, 0)
  const earnedXP = quests.filter((q) => q.completed).reduce((s, q) => s + q.xpReward, 0)
  const allCleared = completedCount === quests.length && quests.length > 0

  const orderedCategories = ["calories", "water", "workout", "sleep", "tasks"]
  const sortedQuests = [...quests].sort(
    (a, b) => orderedCategories.indexOf(a.category) - orderedCategories.indexOf(b.category)
  )

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="system-window rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="system-text text-xs tracking-widest uppercase">Daily Dungeon</p>
              <h1 className="text-xl font-bold text-white font-mono mt-0.5">
                {allCleared ? "✦ ALL QUESTS CLEARED ✦" : "[ ACTIVE QUESTS ]"}
              </h1>
              <p className="text-gray-600 font-mono text-xs mt-1">{today}</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-mono font-bold text-lg">
                {earnedXP} <span className="text-gray-600 text-xs font-normal">/ {totalXPAvailable} XP</span>
              </p>
              <p className="text-gray-600 font-mono text-xs mt-0.5">
                {completedCount} / {quests.length} cleared
              </p>
            </div>
          </div>

          {quests.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-purple-950/50">
                <div
                  className="h-full bg-amber-500 transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${(completedCount / quests.length) * 100}%` }}
                />
              </div>
              <p className="text-gray-700 font-mono text-xs text-right">
                {Math.round((completedCount / quests.length) * 100)}% complete
              </p>
            </div>
          )}
        </div>

        {/* Quest list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="system-window rounded-lg p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onDelta={handleDelta}
                loading={updating}
              />
            ))}
          </div>
        )}

        {allCleared && !loading && (
          <div className="system-window rounded-lg p-6 text-center space-y-2 border-green-900/30">
            <p className="text-green-400 font-mono text-sm tracking-widest">
              ✦ DUNGEON COMPLETE ✦
            </p>
            <p className="text-gray-500 font-mono text-xs">
              All daily quests cleared. The System acknowledges your effort.
            </p>
            <p className="text-amber-400 font-mono font-bold">
              +{earnedXP} XP earned today
            </p>
          </div>
        )}
      </div>

      {/* Streak Toast */}
      {streakToast && (
        <div className="fixed bottom-6 left-6 system-window rounded-lg px-5 py-3 border-amber-500/50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-amber-300 font-mono text-xs uppercase tracking-widest">Streak Extended</p>
          <p className="text-amber-400 font-mono font-bold text-lg">🔥 {streakToast.days} Day Streak</p>
          {streakToast.milestone && (
            <p className="font-mono text-xs mt-0.5" style={{ color: streakToast.milestone.color }}>
              ✦ {streakToast.milestone.label} unlocked!
            </p>
          )}
        </div>
      )}

      {/* XP Toast */}
      {xpToast && (
        <div className="fixed bottom-6 right-6 system-window rounded-lg px-5 py-3 border-purple-500/50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-purple-300 font-mono text-xs uppercase tracking-widest">Quest Complete</p>
          <p className="text-amber-400 font-mono font-bold text-lg">+{xpToast.xp} XP</p>
        </div>
      )}

      {/* Rank Up Toast */}
      {rankUpToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="system-window rounded-lg p-8 text-center space-y-3 border-purple-500/60 glow-purple">
            <p className="text-purple-400 font-mono text-xs uppercase tracking-widest">System Alert</p>
            <p className="text-white font-mono font-bold text-2xl">RANK UP</p>
            <p
              className="font-mono font-black text-5xl rank-badge"
              style={{ color: DIFFICULTY_COLORS[rankUpToast.rank] ?? "#a855f7", textShadow: "0 0 20px currentColor" }}
            >
              {rankUpToast.rank}
            </p>
            <p className="text-gray-400 font-mono text-sm">
              You have become a {rankUpToast.rank}-Rank Hunter
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
