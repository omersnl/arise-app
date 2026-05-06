import { type UserStats } from "./shadows"

export type WeaponType = "Dagger" | "Sword" | "Spear" | "Staff" | "Bow" | "Shield" | "Artifact"

export interface WeaponDef {
  id: string
  name: string
  type: WeaponType
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  description: string
  lore: string
  unlockLabel: string
  statBonus: string
  check: (stats: UserStats) => boolean
}

export const WEAPON_TYPE_ICONS: Record<WeaponType, string> = {
  Dagger: "🗡️",
  Sword: "⚔️",
  Spear: "🔱",
  Staff: "🔮",
  Bow: "🏹",
  Shield: "🛡️",
  Artifact: "💎",
}

export const WEAPON_RARITY_COLORS = {
  Common: "#6b7280",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
}

export const WEAPONS: WeaponDef[] = [
  {
    id: "iron_dagger",
    name: "Iron Dagger",
    type: "Dagger",
    rarity: "Common",
    description: "A simple blade awarded to hunters who prove their dedication.",
    lore: "\"Every legend begins with a single step into the dungeon.\"",
    unlockLabel: "Complete 3 workout quests",
    statBonus: "+5% Workout XP",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 3,
  },
  {
    id: "hunters_sword",
    name: "Hunter's Sword",
    type: "Sword",
    rarity: "Common",
    description: "Standard-issue blade carried by D-Rank hunters worldwide.",
    lore: "\"A reliable weapon for those just beginning their ascent.\"",
    unlockLabel: "Reach D-Rank",
    statBonus: "+10% Quest XP",
    check: ({ xp }) => xp >= 1000,
  },
  {
    id: "barukas_dagger",
    name: "Baruka's Dagger",
    type: "Dagger",
    rarity: "Rare",
    description: "The personal weapon of Ice Elf Baruka, taken as a trophy.",
    lore: "\"Its edge stays cold even in the heat of battle.\"",
    unlockLabel: "Reach C-Rank",
    statBonus: "+15% Calorie Burn",
    check: ({ xp }) => xp >= 5000,
  },
  {
    id: "knight_killer",
    name: "Knight Killer",
    type: "Dagger",
    rarity: "Rare",
    description: "A blade forged to pierce even the heaviest armor.",
    lore: "\"Consistency is the sharpest edge of all.\"",
    unlockLabel: "Maintain a 7-day streak",
    statBonus: "+20% Streak Bonus XP",
    check: ({ streakDays }) => streakDays >= 7,
  },
  {
    id: "orb_of_avarice",
    name: "Orb of Avarice",
    type: "Artifact",
    rarity: "Rare",
    description: "A cursed artifact that amplifies the wielder's greed for power.",
    lore: "\"The more you want, the more it gives.\"",
    unlockLabel: "Complete 25 quests total",
    statBonus: "+25% XP on all quests",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 25,
  },
  {
    id: "demon_king_longsword",
    name: "Demon King's Longsword",
    type: "Sword",
    rarity: "Epic",
    description: "The blade of the Demon King Baran, wreathed in dark lightning.",
    lore: "\"Only a true B-Rank hunter can withstand its power.\"",
    unlockLabel: "Reach B-Rank",
    statBonus: "+30% Workout XP",
    check: ({ xp }) => xp >= 15000,
  },
  {
    id: "elixir_of_life",
    name: "Elixir of Life",
    type: "Artifact",
    rarity: "Epic",
    description: "A legendary potion that restores the body beyond its natural limits.",
    lore: "\"Discipline maintained for 14 days rewrites the body's foundation.\"",
    unlockLabel: "Maintain a 14-day streak",
    statBonus: "+40% Sleep & Recovery XP",
    check: ({ streakDays }) => streakDays >= 14,
  },
  {
    id: "rulers_authority",
    name: "Ruler's Authority",
    type: "Artifact",
    rarity: "Legendary",
    description: "The innate power of the Rulers — telekinetic force over all things.",
    lore: "\"You have risen beyond the reach of ordinary hunters.\"",
    unlockLabel: "Reach A-Rank",
    statBonus: "+50% All XP",
    check: ({ xp }) => xp >= 40000,
  },
  {
    id: "kamishs_wrath",
    name: "Kamish's Wrath",
    type: "Dagger",
    rarity: "Legendary",
    description: "Twin daggers carved from the fang of the world's most powerful dragon.",
    lore: "\"S-Rank. The pinnacle of human achievement. You earned this.\"",
    unlockLabel: "Reach S-Rank",
    statBonus: "+75% All XP",
    check: ({ xp }) => xp >= 100000,
  },
  {
    id: "cup_of_reincarnation",
    name: "Cup of Reincarnation",
    type: "Artifact",
    rarity: "Legendary",
    description: "An artifact capable of turning back time. One use only.",
    lore: "\"The Shadow Monarch needs no second chances — but holds the option.\"",
    unlockLabel: "Reach Shadow Monarch",
    statBonus: "Infinite XP potential",
    check: ({ xp }) => xp >= 500000,
  },
]
