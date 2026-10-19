#!/usr/bin/env bash
# Simple single-process worker loop for DB-backed queue fallback.
# Usage: ./scripts/dev-worker.sh
set -e
echo "Starting AgentGuard dev worker (DB-backed queue fallback)..."
while true; do
  node -e "
    (async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const run = await prisma.run.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
      if (run) {
        console.log('Found run to process', run.id);
        await prisma.run.update({ where: { id: run.id }, data: { status: 'RUNNING', startedAt: new Date() } });
        try {
          const { executeRun } = require('../src/services/run-executor');
          await executeRun(run.id);
          console.log('Processed', run.id);
        } catch (e) {
          console.error('Error processing run', e);
          await prisma.run.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } });
        }
      } else {
        // nothing to do
      }
      await prisma.$disconnect();
    })();
  "
  sleep 2
done
