import { db } from "./db"
import { todayString } from "./quests"
import { RAID_BOSS_POOL } from "./raid-bosses"

export function getWeekStart(date?: Date): string {
  const d = date ? new Date(date) : new Date()
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00")
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export async function getOrSpawnRaidBoss(guildId: string) {
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd(weekStart)

  const existing = await db.raidBoss.findUnique({
    where: { guildId_weekStart: { guildId, weekStart } },
  })
  if (existing) return existing

  const guild = await db.guild.findUnique({
    where: { id: guildId },
    include: { members: true },
  })
  if (!guild) return null

  const memberCount = Math.max(1, guild.members.length)
  const boss = RAID_BOSS_POOL[guild.guildLevel % RAID_BOSS_POOL.length]
  const finalHP = boss.baseHP * memberCount

  return db.raidBoss.create({
    data: {
      guildId,
      bossKey: boss.key,
      name: boss.name,
      maxHP: finalHP,
      currentHP: finalHP,
      weekStart,
      weekEnd,
      xpReward: boss.xpReward,
    },
  })
}

export async function computeGuildMorale(guildId: string): Promise<number> {
  const weekStart = getWeekStart()
  const today = todayString()

  const now = new Date()
  const weekStartDate = new Date(weekStart + "T00:00:00")
  const daysElapsed = Math.max(
    1,
    Math.floor((now.getTime() - weekStartDate.getTime()) / 86400000) + 1
  )

  const members = await db.guildMember.findMany({
    where: { guildId },
    select: { userId: true },
  })
  const memberIds = members.map((m) => m.userId)
  if (memberIds.length === 0) return 0

  const completed = await db.dailyQuest.count({
    where: {
      userId: { in: memberIds },
      date: { gte: weekStart, lte: today },
      completed: true,
    },
  })

  const totalPossible = memberIds.length * 5 * daysElapsed
  return Math.min(100, Math.round((completed / totalPossible) * 100))
}

export async function applyRaidDamage(userId: string): Promise<void> {
  const membership = await db.guildMember.findUnique({
    where: { userId },
    select: { guildId: true },
  })
  if (!membership) return

  const boss = await getOrSpawnRaidBoss(membership.guildId)
  if (!boss || boss.defeated) return

  const today = todayString()

  const alreadyHit = await db.raidDamageLog.findUnique({
    where: { raidBossId_userId_date: { raidBossId: boss.id, userId, date: today } },
  })
  if (alreadyHit) return

  const damage = Math.floor(boss.maxHP * 0.05)
  const newHP = Math.max(0, boss.currentHP - damage)
  const defeated = newHP === 0

  await db.raidDamageLog.create({
    data: { raidBossId: boss.id, userId, damage, date: today },
  })

  await db.raidBoss.update({
    where: { id: boss.id },
    data: { currentHP: newHP, defeated },
  })

  if (defeated) {
    const members = await db.guildMember.findMany({
      where: { guildId: membership.guildId },
      select: { userId: true },
    })
    await Promise.all([
      db.user.updateMany({
        where: { id: { in: members.map((m) => m.userId) } },
        data: { xp: { increment: boss.xpReward } },
      }),
      db.guild.update({
        where: { id: membership.guildId },
        data: { guildXP: { increment: boss.xpReward * members.length }, guildLevel: { increment: 1 } },
      }),
      db.guildActivity.create({
        data: {
          guildId: membership.guildId,
          userId,
          type: "raid_victory",
          detail: `${boss.name} defeated! +${boss.xpReward} XP each`,
        },
      }),
    ])
  }
}

export async function resetWeeklyXPIfNeeded(guildId: string): Promise<void> {
  const weekStart = getWeekStart()
  const staleMembers = await db.guildMember.findMany({
    where: { guildId, weekStart: { not: weekStart } },
    select: { id: true },
  })
  if (staleMembers.length === 0) return

  await db.guildMember.updateMany({
    where: { id: { in: staleMembers.map((m) => m.id) } },
    data: { weeklyXP: 0, weekStart },
  })
}
