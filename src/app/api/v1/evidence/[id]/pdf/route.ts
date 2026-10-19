import { prisma } from '@/lib/prisma';
import React from 'react';
import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import ReactPDF from '@react-pdf/renderer';
import { Readable } from 'stream';

function EvidenceDoc({ payload }: { payload: any }) {
  const styles = StyleSheet.create({
    body: { padding: 10, fontSize: 10 },
    header: { fontSize: 14, marginBottom: 8 },
    pre: { fontFamily: 'Courier', fontSize: 8, marginTop: 6 }
  });
  return (
    <Document>
      <Page size="A4" style={styles.body}>
        <Text style={styles.header}>AgentGuard Evidence Bundle — {payload.runId}</Text>
        <Text>Signed at: {payload.timestamp}</Text>
        <Text style={styles.pre}>{JSON.stringify(payload, null, 2)}</Text>
      </Page>
    </Document>
  );
}

async function streamToWeb(stream: Readable) {
  // Node.js Readable -> Web ReadableStream
  // @ts-ignore
  if (stream.readable && (stream as any).readableEncoding === null && (stream as any).readableObjectMode === false) {
    // Node 18+: use Readable.toWeb
    // @ts-ignore
    return Readable.toWeb(stream);
  }
  // fallback: collect buffer
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  const rs = new ReadableStream({ start(controller) { controller.enqueue(buffer); controller.close(); } });
  return rs;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try{
    const id = params.id;
    const eb = await prisma.evidenceBundle.findUnique({ where: { id } });
    if (!eb) return new Response('Not found', { status: 404 });
    const payload = eb.payload;

    // Render PDF to node stream
    const nodeStream = await ReactPDF.renderToStream(React.createElement(EvidenceDoc, { payload }));
    const webStream = await streamToWeb(nodeStream as unknown as Readable);
    return new Response(webStream, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="evidence-${id}.pdf"` } });
  }catch(err:any){
    console.error('pdf error', err);
    return new Response(String(err), { status: 500 });
  }
}
