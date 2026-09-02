import https from "node:https";
import fs   from "node:fs";
import path from "node:path";

const BASE          = "https://enter.tochka.com/uapi";
const CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE ?? "305862955";
const MERCHANT_ID   = process.env.TOCHKA_MERCHANT_ID   ?? "200000000042115";

// Load Russian Trusted CA cert bundled with the project.
// Tochka Bank uses Минцифры CA not trusted by default Node.js/Vercel cert store.
function loadCa(): Buffer | undefined {
  try {
    const p = path.join(process.cwd(), "certs", "russian-ca.pem");
    return fs.readFileSync(p);
  } catch {
    return undefined;
  }
}

const CA_CERT  = loadCa();
const tochkaAgent = new https.Agent({ ca: CA_CERT });

function authHeader() {
  return `Bearer ${process.env.TOCHKA_JWT ?? ""}`;
}

function tochkaRequest(
  urlPath: string,
  method: "POST" | "GET",
  body?: string,
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const urlObj  = new URL(`${BASE}${urlPath}`);
    const bodyBuf = body ? Buffer.from(body, "utf-8") : null;

    const reqHeaders: Record<string, string | number> = {
      Authorization: authHeader(),
      Accept:        "application/json",
    };
    if (bodyBuf) {
      reqHeaders["Content-Type"]   = "application/json";
      reqHeaders["Content-Length"] = bodyBuf.length;
    }

    const req = https.request(
      {
        hostname: urlObj.hostname,
        port:     443,
        path:     urlObj.pathname + urlObj.search,
        method,
        agent:    tochkaAgent,
        headers:  reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => {
          const status = res.statusCode ?? 0;
          resolve({
            ok:   status >= 200 && status < 300,
            status,
            json: async () => JSON.parse(data),
          });
        });
      },
    );

    req.setTimeout(15000, () => { req.destroy(new Error("tochka_timeout")); });
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
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
  const body = JSON.stringify({
    Data: {
      customerCode:    CUSTOMER_CODE,
      merchantId:      MERCHANT_ID,
      amount:          params.amount,
      purpose:         params.purpose,
      paymentMode:     ["sbp", "tinkoff", "card"],
      redirectUrl:     params.redirectUrl,
      failRedirectUrl: params.failUrl,
      callbackUrl:     "https://chinabridge.pro/api/payments/tochka-webhook",
      paymentLinkId:   `cb-${params.plan.slice(0, 3)}-${Date.now().toString(36)}`,
      ttl:             10080,
    },
  });

  const res  = await tochkaRequest("/acquiring/v1.0/payments", "POST", body);
  const json = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    const errs   = json.Errors as Array<Record<string, string>> | undefined;
    const errMsg = errs?.[0]?.message ?? errs?.[0]?.UserMessage ?? JSON.stringify(json);
    throw new Error(`Tochka ${res.status}: ${errMsg}`);
  }

  const data = json.Data as Record<string, unknown>;
  return {
    operationId: String(data.operationId),
    paymentLink: String(data.paymentLink),
    status:      String(data.status ?? "CREATED"),
    amount:      Number(data.amount),
  };
}

export async function getTochkaPaymentStatus(operationId: string): Promise<string> {
  const res  = await tochkaRequest(`/acquiring/v1.0/payments/${operationId}`, "GET");
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error((json as { message?: string }).message ?? "status fetch failed");
  return String((json.Data as Record<string, string>).status);
}
