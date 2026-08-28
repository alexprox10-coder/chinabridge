import { NextResponse } from 'next/server';
import https from 'node:https';
import fs   from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const jwt = process.env.TOCHKA_JWT ?? '';

  // Load CA
  let caLoaded = false;
  let ca: Buffer | undefined;
  try {
    const p = path.join(process.cwd(), 'certs', 'russian-ca.pem');
    ca = fs.readFileSync(p);
    caLoaded = true;
  } catch (e) {
    ca = undefined;
  }

  const agent = new https.Agent({ ca });
  const url   = 'https://enter.tochka.com/uapi/acquiring/v1.0/payments';
  const body  = JSON.stringify({ Data: { customerCode: '305862955', merchantId: '200000000042115', amount: 1, purpose: 'test', paymentMode: ['card'], redirectUrl: 'https://chinabridge.pro', failRedirectUrl: 'https://chinabridge.pro', paymentLinkId: `test-${Date.now()}`, ttl: 1 } });

  const result: Record<string, unknown> = {
    jwt_present: jwt.length > 0,
    ca_loaded:   caLoaded,
    ca_size:     ca?.length ?? 0,
  };

  try {
    const data = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const bodyBuf = Buffer.from(body, 'utf-8');
      const req = https.request({ hostname: 'enter.tochka.com', port: 443, path: '/uapi/acquiring/v1.0/payments', method: 'POST', agent, headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': bodyBuf.length } }, (res) => {
        let d = ''; res.on('data', (c: Buffer) => d += c.toString()); res.on('end', () => resolve({ status: res.statusCode ?? 0, body: d }));
      });
      req.setTimeout(15000, () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      req.write(bodyBuf); req.end();
    });
    result.http_status = data.status;
    result.response = data.body.slice(0, 600);
    result.ok = data.status >= 200 && data.status < 300;
  } catch (err: unknown) {
    result.fetch_error  = String(err);
    result.error_cause  = err instanceof Error && 'cause' in err ? String((err as NodeJS.ErrnoException).cause) : null;
  }

  return NextResponse.json(result);
}
