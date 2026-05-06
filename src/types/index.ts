export type Rank =
  | "E"
  | "D"
  | "C"
  | "B"
  | "A"
  | "S"
  | "National"
  | "ShadowMonarch"

export interface RankConfig {
  rank: Rank
  xpRequired: number
  label: string
  color: string
}

export const RANKS: RankConfig[] = [
  { rank: "E", xpRequired: 0, label: "E-Rank Hunter", color: "#6b7280" },
  { rank: "D", xpRequired: 1_000, label: "D-Rank Hunter", color: "#10b981" },
  { rank: "C", xpRequired: 5_000, label: "C-Rank Hunter", color: "#3b82f6" },
  { rank: "B", xpRequired: 15_000, label: "B-Rank Hunter", color: "#8b5cf6" },
  { rank: "A", xpRequired: 40_000, label: "A-Rank Hunter", color: "#f59e0b" },
  { rank: "S", xpRequired: 100_000, label: "S-Rank Hunter", color: "#ef4444" },
  {
    rank: "National",
    xpRequired: 250_000,
    label: "National Level Hunter",
    color: "#ec4899",
  },
  {
    rank: "ShadowMonarch",
    xpRequired: 500_000,
    label: "Shadow Monarch",
    color: "#7c3aed",
  },
]

export function getRankForXP(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xpRequired) return RANKS[i].rank
  }
  return "E"
}

export function getXPProgress(xp: number): {
  current: number
  required: number
  nextRank: Rank | null
  percent: number
} {
  const currentRankIndex = RANKS.findIndex((r) => r.rank === getRankForXP(xp))
  if (currentRankIndex === RANKS.length - 1) {
    return { current: xp, required: xp, nextRank: null, percent: 100 }
  }
  const thisRank = RANKS[currentRankIndex]
  const nextRank = RANKS[currentRankIndex + 1]
  const current = xp - thisRank.xpRequired
  const required = nextRank.xpRequired - thisRank.xpRequired
  return {
    current,
    required,
    nextRank: nextRank.rank,
    percent: Math.min(100, Math.round((current / required) * 100)),
  }
}
