import { prisma } from "./prisma.ts";
import { levelFromXp } from "@repo/shared";

export const XP = {
  STUDY_MINUTE: 2,
  TOPIC_MASTERED: 50,
  ASSIGNMENT_SUBMITTED: 20,
} as const;

export type XpResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
};

// Award XP, recording an idempotent transaction. Returns null if already awarded.
export async function addXp(
  profileId: string,
  amount: number,
  reason: string,
  refId?: string
): Promise<XpResult | null> {
  if (amount <= 0) return null;

  const transactionKey = { reason, refId: refId ?? null };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.xpTransaction.findFirst({
      where: transactionKey,
    });
    if (existing) return null;

    const profile = await tx.profile.findUnique({ where: { id: profileId } });
    if (!profile) return null;

    await tx.xpTransaction.create({
      data: { profileId, amount, reason, refId: refId ?? null },
    });

    const totalXp = profile.xp + amount;
    const newLevel = levelFromXp(totalXp);

    await tx.profile.update({
      where: { id: profileId },
      data: { xp: totalXp, level: newLevel },
    });

    return {
      xpAwarded: amount,
      totalXp,
      level: newLevel,
      leveledUp: newLevel > profile.level,
    };
  });
}
