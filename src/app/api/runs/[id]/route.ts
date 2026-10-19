import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';

/**
 * SSE stream for run progress. This implementation polls the DB every 1s and
 * pushes run status, new turns, and a simple "progress" message per test.
 *
 * Note: in production we'd subscribe to a job bus (Redis/BullMQ or Postgres NOTIFY).
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const stream = new Readable({
    read() {}
  });

  // helper to push SSE-formatted event
  function pushEvent(data: any) {
    stream.push(`data: ${JSON.stringify(data)}\n\n`);
  }

  // initial meta
  const run = await prisma.run.findUnique({ where: { id } });
  pushEvent({ type: 'meta', data: run });

  // start interval poll
  let lastTurnCount = 0;
  const iv = setInterval(async () => {
    try {
      const r = await prisma.run.findUnique({ where: { id } });
      if (!r) {
        pushEvent({ type: 'status', data: 'NOT_FOUND' });
        return;
      }
      pushEvent({ type: 'status', data: r.status });

      const turns = await prisma.turn.findMany({ where: { runId: id }, orderBy: { index: 'asc' } });
      if (turns.length > lastTurnCount) {
        // send new turns
        const newTurns = turns.slice(lastTurnCount);
        for (const t of newTurns) {
          pushEvent({ type: 'progress', data: { turnIndex: t.index, input: t.input, output: t.output } });
        }
        lastTurnCount = turns.length;
      }

      if (r.status === 'COMPLETED' || r.status === 'FAILED' || r.status === 'CANCELLED') {
        pushEvent({ type: 'status', data: r.status });
        clearInterval(iv);
        stream.push(null);
      }
    } catch (err) {
      // send error event and keep connection
      pushEvent({ type: 'error', data: String(err) });
    }
  }, 1000);

  // When client closes connection, stop polling
  request.headers.get('connection'); // placeholder
  // Build response
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  };

  return new NextResponse(stream, { headers });
}
