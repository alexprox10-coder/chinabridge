const BASE          = "https://enter.tochka.com/uapi";
const CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE ?? "305892710";
const MERCHANT_ID   = process.env.TOCHKA_MERCHANT_ID   ?? "200000000042115";

function headers() {
  return {
    Authorization: `Bearer ${process.env.TOCHKA_JWT ?? ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface TochkaPayment {
  operationId: string;
  paymentLink: string;
  status: string;
  amount: number;
}

export async function createTochkaPayment(params: {
  amount: number;
  purpose: string;
  tenantId: string;
  plan: string;
  redirectUrl: string;
  failUrl: string;
}): Promise<TochkaPayment> {
  const res = await fetch(`${BASE}/acquiring/v1.0/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      Data: {
        customerCode: CUSTOMER_CODE,
        merchantId:   MERCHANT_ID,
        amount:       params.amount,
        purpose:      params.purpose,
        paymentMode:  ["sbp", "tinkoff", "card"],
        redirectUrl:  params.redirectUrl,
        failRedirectUrl: params.failUrl,
        paymentLinkId: `cb-${params.tenantId}-${params.plan}-${Date.now()}`,
        ttl: 10080,
      },
    }),
    signal: AbortSignal.timeout(12000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? JSON.stringify(json.Errors ?? "API error"));
  return {
    operationId: json.Data.operationId,
    paymentLink: json.Data.paymentLink,
    status:      json.Data.status ?? "CREATED",
    amount:      json.Data.amount,
  };
}

export async function getTochkaPaymentStatus(operationId: string): Promise<string> {
  const res = await fetch(`${BASE}/acquiring/v1.0/payments/${operationId}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "status fetch failed");
  return json.Data.status as string;
}
