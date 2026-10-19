import { prisma } from './prisma';

/**
 * Minimal DB-backed queue helpers:
 * - pushRunToQueue(runId): marks run.status = RUNNING and sets enqueuedAt
 * - claimNextRun(): fetch next RUNNING/ PENDING run and mark workerClaimedAt
 *
 * This is single-process friendly and intended as demo fallback for Redis/BullMQ
 */
export async function pushRunToQueue(runId: string) {
  await prisma.run.update({ where: { id: runId }, data: { status: 'RUNNING', startedAt: new Date() } });
}

export async function claimNextQueuedRun() {
  // find a run with status RUNNING and not processed (simple heuristic)
  const r = await prisma.run.findFirst({ where: { status: 'RUNNING' }, orderBy: { createdAt: 'asc' } });
  return r;
}
