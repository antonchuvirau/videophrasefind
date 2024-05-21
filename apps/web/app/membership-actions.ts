"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "database";

export async function calculateCredits() {
  const { userId } = auth();

  if (!userId) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId,
    },
  });

  if (!membership) return null;

  const data = await db.transaction.findMany({
    where: {
      userId: userId as string,
    },
    select: {
      credits: true,
    },
  });

  return data.reduce((acc, current) => acc + current.credits, 0);
}