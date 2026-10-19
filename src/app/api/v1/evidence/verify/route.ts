import { prisma } from '@/lib/prisma';
import { verifyPayloadHmac } from '@/lib/crypto';

// POST /api/v1/evidence/verify
export async function POST(req: Request) {
  try{
    const body = await req.json();
    const { bundleId, bundle } = body || {};
    let eb: any = null;
    if (bundleId) {
      eb = await prisma.evidenceBundle.findUnique({ where: { id: bundleId } });
      if (!eb) return new Response(JSON.stringify({ valid: false, reason: 'not_found' }), { status: 404 });
      const payload = eb.payload;
      const key = process.env.HMAC_SECRET || 'demo_hmac_secret_change_me';
      const result = verifyPayloadHmac(key, { ...payload, hash: payload.hash }, payload.hash, eb.signature);
      return new Response(JSON.stringify(result));
    } else if (bundle) {
      const key = process.env.HMAC_SECRET || 'demo_hmac_secret_change_me';
      const expectedHash = bundle.hash;
      const result = verifyPayloadHmac(key, { ...bundle, hash: bundle.hash }, expectedHash, bundle.signature);
      return new Response(JSON.stringify(result));
    } else {
      return new Response(JSON.stringify({ valid: false, reason: 'missing_payload' }), { status: 400 });
    }
  }catch(err:any){
    console.error('verify error', err);
    return new Response(JSON.stringify({ valid: false, reason: 'server_error', detail: String(err) }), { status: 500 });
  }
}
