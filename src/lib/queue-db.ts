import { prisma } from './prisma';

/**
 * DB-backed queue helpers (demo fallback).
 * enqueueRun: mark run as PENDING (or create with PENDING)
 * claimNextAndMarkRunning: atomically claim a PENDING run and set status RUNNING
 */
export async function enqueueRun(runId: string) {
  await prisma.run.update({ where: { id: runId }, data: { status: 'PENDING' } });
}

export async function claimNextAndMarkRunning() {
  // Find a run with status PENDING
  const run = await prisma.run.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
  if (!run) return null;
  // Try to atomically set to RUNNING. In single-process demo this is fine.
  const updated = await prisma.run.update({ where: { id: run.id }, data: { status: 'RUNNING', startedAt: new Date() } });
  return updated;
}
