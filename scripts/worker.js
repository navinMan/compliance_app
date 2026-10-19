#!/usr/bin/env node
/**
 * Simple worker loop that claims PENDING runs and executes them.
 * Usage: node scripts/worker.js
 */
import { PrismaClient } from '@prisma/client';
import { executeRun } from '../src/services/run-executor';

const prisma = new PrismaClient();

async function sleep(ms: number){ return new Promise(r=>setTimeout(r, ms)); }

async function loop(){
  console.log('[worker] starting loop');
  while(true){
    try{
      // find a pending run
      const run = await prisma.run.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
      if (!run) {
        await sleep(1500);
        continue;
      }
      console.log('[worker] claiming run', run.id);
      // mark running
      await prisma.run.update({ where: { id: run.id }, data: { status: 'RUNNING', startedAt: new Date() } });
      try{
        const res = await executeRun(run.id);
        console.log('[worker] executed run', run.id, res);
      }catch(err){
        console.error('[worker] error executing run', run.id, err);
        await prisma.run.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } });
      }
    }catch(e){
      console.error('[worker] loop error', e);
      await sleep(2000);
    }
  }
}

loop().catch(e=>{ console.error(e); process.exit(1); });
