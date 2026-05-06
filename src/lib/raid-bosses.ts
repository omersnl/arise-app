export interface RaidBossDef {
  key: string
  name: string
  baseHP: number
  xpReward: number
}

export const RAID_BOSS_POOL: RaidBossDef[] = [
  { key: "igris",     name: "Red Knight Igris",        baseHP: 500,   xpReward: 300  },
  { key: "ant_queen", name: "Ant Queen",                baseHP: 1000,  xpReward: 600  },
  { key: "baran",     name: "Demon King Baran",         baseHP: 2000,  xpReward: 1200 },
  { key: "legia",     name: "Beast Monarch Legia",      baseHP: 4000,  xpReward: 2500 },
  { key: "antares",   name: "Monarch of Destruction",   baseHP: 8000,  xpReward: 5000 },
]
