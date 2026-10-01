import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Scheduled publishing sweep — flips CmsPage rows past their scheduledAt from
 * SCHEDULED to PUBLISHED. Runs once daily via Vercel Cron (vercel.json), the same
 * CRON_SECRET-gated pattern as /api/cron/vrodux-sync. Once daily, not at the exact
 * minute, because this project is on Vercel Hobby (max 2 cron jobs, once/day each —
 * this is the second, alongside vrodux-sync). See docs/cms-specification.md §G.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const due = await db.cmsPage.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    select: { id: true },
  });

  for (const { id } of due) {
    await db.cmsPage.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  }

  return NextResponse.json({ published: due.length });
}
