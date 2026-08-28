import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const jwt = process.env.TOCHKA_JWT ?? '';
  const url = 'https://enter.tochka.com/uapi/acquiring/v1.0/payments';

  const result: Record<string, unknown> = {
    jwt_present: jwt.length > 0,
    jwt_prefix: jwt.slice(0, 20) + '...',
    url,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Data: {
          customerCode: process.env.TOCHKA_CUSTOMER_CODE ?? '305862955',
          merchantId: process.env.TOCHKA_MERCHANT_ID ?? '200000000042115',
          amount: 1,
          purpose: 'test',
          paymentMode: ['card'],
          redirectUrl: 'https://chinabridge.pro',
          failRedirectUrl: 'https://chinabridge.pro',
          paymentLinkId: `test-${Date.now()}`,
          ttl: 1,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    result.http_status = res.status;
    result.response_body = text.slice(0, 500);
    result.ok = res.ok;
  } catch (err: unknown) {
    result.fetch_error = String(err);
    result.error_name = err instanceof Error ? err.name : 'unknown';
    result.error_cause = err instanceof Error && 'cause' in err
      ? String((err as NodeJS.ErrnoException).cause)
      : null;
  }

  return NextResponse.json(result);
}
