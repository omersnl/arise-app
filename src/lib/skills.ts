import { type UserStats } from "./shadows"

export type SkillKind = "Active" | "Passive"
export type SkillRarity = "Common" | "Rare" | "Epic" | "Legendary"

export interface SkillDef {
  id: string
  name: string
  kind: SkillKind
  rarity: SkillRarity
  description: string
  lore: string
  effect: string
  unlockLabel: string
  check: (stats: UserStats) => boolean
}

export const SKILL_RARITY_COLORS: Record<SkillRarity, string> = {
  Common: "#6b7280",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
}

export const SKILL_KIND_COLORS: Record<SkillKind, string> = {
  Active: "#ef4444",
  Passive: "#10b981",
}

export const SKILLS: SkillDef[] = [
  {
    id: "dash",
    name: "Dash",
    kind: "Active",
    rarity: "Common",
    description: "Burst forward with explosive speed.",
    lore: "\"The first skill every hunter learns — move before you think.\"",
    effect: "+20% Workout XP",
    unlockLabel: "Complete 5 workout quests",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 5,
  },
  {
    id: "tenacity",
    name: "Tenacity",
    kind: "Passive",
    rarity: "Common",
    description: "Reduces fatigue accumulation during prolonged dungeon runs.",
    lore: "\"Consistency outlasts intensity every time.\"",
    effect: "+15% Streak Bonus XP",
    unlockLabel: "Maintain a 3-day streak",
    check: ({ streakDays }) => streakDays >= 3,
  },
  {
    id: "iron_body",
    name: "Iron Body",
    kind: "Passive",
    rarity: "Rare",
    description: "Hardens the body to resist damage that would fell lesser hunters.",
    lore: "\"Twenty dungeons cleared. Your body remembers every one.\"",
    effect: "+25% All Quest XP",
    unlockLabel: "Complete 20 quests total",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 20,
  },
  {
    id: "stealth",
    name: "Stealth",
    kind: "Active",
    rarity: "Rare",
    description: "Suppress your presence entirely — become a ghost in the dungeon.",
    lore: "\"Sleep is not inactivity. It is the sharpening of the blade.\"",
    effect: "+30% Sleep & Recovery XP",
    unlockLabel: "Complete 10 sleep quests",
    check: ({ totalQuestsCompleted, ...rest }) => {
      void rest
      return totalQuestsCompleted >= 10
    },
  },
  {
    id: "bloodlust",
    name: "Bloodlust",
    kind: "Active",
    rarity: "Rare",
    description: "Enter a heightened state of combat focus. Enemies sense your killing intent.",
    lore: "\"The blood in your veins burns. Fifteen dungeons will do that to you.\"",
    effect: "+35% Workout XP",
    unlockLabel: "Reach D-Rank and complete 15 quests",
    check: ({ xp, totalQuestsCompleted }) => xp >= 1000 && totalQuestsCompleted >= 15,
  },
  {
    id: "vital_point_reading",
    name: "Vital Point Reading",
    kind: "Passive",
    rarity: "Epic",
    description: "Instantly identify every enemy's critical weakness.",
    lore: "\"Fourteen days of discipline rewires the mind to see what others miss.\"",
    effect: "+40% XP on completed quests",
    unlockLabel: "Maintain a 14-day streak",
    check: ({ streakDays }) => streakDays >= 14,
  },
  {
    id: "shadow_exchange",
    name: "Shadow Exchange",
    kind: "Active",
    rarity: "Epic",
    description: "Instantly swap positions with any shadow in your army.",
    lore: "\"Distance means nothing to the Shadow Monarch.\"",
    effect: "Unlock shadow combo bonuses",
    unlockLabel: "Reach B-Rank",
    check: ({ xp }) => xp >= 15000,
  },
  {
    id: "domination",
    name: "Domination",
    kind: "Active",
    rarity: "Epic",
    description: "Overwhelm weaker monsters with pure authority. No resistance possible.",
    lore: "\"Fifty dungeons. You no longer negotiate. You dictate.\"",
    effect: "+50% XP on all daily quests",
    unlockLabel: "Complete 50 quests total",
    check: ({ totalQuestsCompleted }) => totalQuestsCompleted >= 50,
  },
  {
    id: "dragons_fear",
    name: "Dragon's Fear",
    kind: "Passive",
    rarity: "Legendary",
    description: "Emit an invisible monarch's aura. All nearby enemies are paralysed by dread.",
    lore: "\"A-Rank. You no longer fight — you simply appear.\"",
    effect: "+60% All XP",
    unlockLabel: "Reach A-Rank",
    check: ({ xp }) => xp >= 40000,
  },
  {
    id: "monarchs_domain",
    name: "Monarch's Domain",
    kind: "Active",
    rarity: "Legendary",
    description: "Declare a region as your absolute territory. Within it, you are invincible.",
    lore: "\"S-Rank. The world bends to your will.\"",
    effect: "+75% All XP",
    unlockLabel: "Reach S-Rank",
    check: ({ xp }) => xp >= 100000,
  },
  {
    id: "arise",
    name: "Arise",
    kind: "Active",
    rarity: "Legendary",
    description: "The power that defines the Shadow Monarch. Extract a shadow from any fallen foe.",
    lore: "\"ARISE.\"",
    effect: "Infinite shadow extraction",
    unlockLabel: "Reach Shadow Monarch",
    check: ({ xp }) => xp >= 500000,
  },
]
