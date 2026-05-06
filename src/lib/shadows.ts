export type Rarity = "Common" | "Rare" | "Epic" | "Legendary"
export type ShadowType = "Soldier" | "Tank" | "Knight" | "Assassin" | "Mage" | "Healer" | "Beast" | "Dragon" | "Commander"

export interface ShadowDef {
  id: string
  name: string
  type: ShadowType
  rarity: Rarity
  description: string
  lore: string
  unlockLabel: string
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  xp: number
  streakDays: number
  totalQuestsCompleted: number
  rank: string
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: "#6b7280",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
}

export const TYPE_ICONS: Record<ShadowType, string> = {
  Soldier: "⚔️",
  Tank: "🛡️",
  Knight: "🤺",
  Assassin: "🗡️",
  Mage: "🔮",
  Healer: "💚",
  Beast: "🐗",
  Dragon: "🐉",
  Commander: "👑",
}

export const SHADOWS: ShadowDef[] = [
  {
    id: "greed",
    name: "Greed",
    type: "Soldier",
    rarity: "Common",
    description: "Your first shadow soldier. Risen from the fallen.",
    lore: "\"Every army begins with a single shadow.\"",
    unlockLabel: "Complete your first quest",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 1,
  },
  {
    id: "iron",
    name: "Iron",
    type: "Tank",
    rarity: "Common",
    description: "A relentless tank who absorbs damage without flinching.",
    lore: "\"Immovable. Unyielding. A wall of shadow.\"",
    unlockLabel: "Complete 7 quests",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 7,
  },
  {
    id: "tank",
    name: "Tank",
    type: "Beast",
    rarity: "Rare",
    description: "A massive beast shadow extracted from a dungeon boss.",
    lore: "\"Its roar alone shakes the gates of the dungeon.\"",
    unlockLabel: "Reach D-Rank",
    check: ({ xp }) => xp >= 1000,
  },
  {
    id: "igris",
    name: "Igris",
    type: "Knight",
    rarity: "Rare",
    description: "The Red Knight, sworn to protect the Shadow Monarch.",
    lore: "\"He kneeled before no king — until you.\"",
    unlockLabel: "Maintain a 3-day streak",
    check: ({ streakDays }) => streakDays >= 3,
  },
  {
    id: "jima",
    name: "Jima",
    type: "Healer",
    rarity: "Epic",
    description: "A rare healer shadow who restores the army from within.",
    lore: "\"Recovery is not weakness. It is the foundation of all power.\"",
    unlockLabel: "Maintain a 7-day streak",
    check: ({ streakDays }) => streakDays >= 7,
  },
  {
    id: "tusk",
    name: "Tusk",
    type: "Beast",
    rarity: "Epic",
    description: "An ancient beast warrior of terrifying strength.",
    lore: "\"Even in death, his ferocity could not be extinguished.\"",
    unlockLabel: "Complete 30 quests",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 30,
  },
  {
    id: "beru",
    name: "Beru",
    type: "Assassin",
    rarity: "Epic",
    description: "The Ant King. Fastest and most deadly of all shadows.",
    lore: "\"Your Majesty — allow me to slaughter them all.\"",
    unlockLabel: "Reach B-Rank",
    check: ({ xp }) => xp >= 15000,
  },
  {
    id: "kaisel",
    name: "Kaisel",
    type: "Dragon",
    rarity: "Legendary",
    description: "A shadow dragon that carries the Shadow Monarch across the sky.",
    lore: "\"He soars beyond the limits of heaven itself.\"",
    unlockLabel: "Reach S-Rank",
    check: ({ xp }) => xp >= 100000,
  },
  {
    id: "bellion",
    name: "Bellion",
    type: "Commander",
    rarity: "Legendary",
    description: "The Grand Marshal of the Shadow Army. Second only to the Monarch.",
    lore: "\"I have waited eons for a king worthy of my loyalty.\"",
    unlockLabel: "Reach Shadow Monarch",
    check: ({ xp }) => xp >= 500000,
  },
]
