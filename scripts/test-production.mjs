#!/usr/bin/env node
/**
 * ChinaBridge Production Test Suite — TZ §53–56
 * 8 smoke tests verifying the core funnel is intact.
 *
 * Usage:
 *   BASE_URL=https://chinabridge.pro node scripts/test-production.mjs
 *   (defaults to http://localhost:3000 for local dev)
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";

let passed = 0;
let failed = 0;

function ok(name, result, detail = "") {
  if (result) { console.log(`${PASS} ${name}`); passed++; }
  else        { console.log(`${FAIL} ${name}${detail ? " — " + detail : ""}`); failed++; }
}

async function json(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) } });
  return { status: r.status, body: await r.json().catch(() => null) };
}

console.log(`\n🧪 ChinaBridge Production Test Suite\n   BASE: ${BASE}\n`);

// ── T1: Calculator economics API returns valid result ───────────────────────
{
  const { status, body } = await json("/api/calculator/economics", {
    method: "POST",
    body: JSON.stringify({
      product_name:           "Наушники Bluetooth",
      unit_price:             "150",
      price_currency:         "CNY",
      quantity:               "100",
      weight_kg:              "80",
      sale_price:             "3500",
      marketplace_commission: "12",
      city_to:                "Москва",
      country_to:             "Russia",
      marketplace:            "wildberries",
    }),
  });
  ok("T1 — economics API returns ok:true", status === 200 && body?.ok === true, `status=${status}`);
  ok("T2 — economics API returns margin_pct", typeof body?.economics?.margin_pct === "number", `margin_pct=${body?.economics?.margin_pct}`);
  ok("T3 — economics includes tariff_date (§6)", typeof body?.economics?.tariff_date === "string", `tariff_date=${body?.economics?.tariff_date}`);
  ok("T4 — economics includes data_sources (§6)", Array.isArray(body?.economics?.data_sources) && body.economics.data_sources.length > 0);
}

// ── T5: AI page exists and returns 200 ─────────────────────────────────────
{
  const r = await fetch(`${BASE}/ai-calculator`);
  ok("T5 — /ai-calculator page loads (200)", r.status === 200, `status=${r.status}`);
}

// ── T6: Methodology page exists (§44) ──────────────────────────────────────
{
  const r = await fetch(`${BASE}/kak-rasschityvaetsya-import`);
  ok("T6 — /kak-rasschityvaetsya-import page loads (200)", r.status === 200, `status=${r.status}`);
}

// ── T7: AI consultant chat API requires calc_context ───────────────────────
{
  const { status, body } = await json("/api/ai-consultant/chat", {
    method: "POST",
    body: JSON.stringify({ sessionId: "test-session", message: "Привет" }),
  });
  ok("T7 — consultant returns 400 without calc_context", status === 400 && body?.error === "calc_context_required");
}

// ── T8: AI consultant chat responds with a message ─────────────────────────
{
  const { status, body } = await json("/api/ai-consultant/chat", {
    method: "POST",
    body: JSON.stringify({
      sessionId: "smoke-test-" + Date.now(),
      message:   "Сколько стоит доставка?",
      calcContext: {
        product_name:        "Bluetooth наушники",
        unit_price_cny:      150,
        sale_price_rub:      3500,
        quantity:            100,
        weight_kg:           80,
        marketplace:         "wildberries",
        city_to:             "Москва",
        country_to:          "Russia",
        verdict:             "green",
        verdict_label:       "ЗЕЛЁНЫЙ — выгодно",
        margin_pct:          32.5,
        roi_pct:             180,
        net_profit_per_unit: 1140,
        delivery_rub:        45000,
        delivery_days_min:   18,
        delivery_days_max:   22,
        cny_rate:            12.4,
      },
    }),
  });
  ok("T8 — consultant returns message", status === 200 && typeof body?.message === "string" && body.message.length > 10, `status=${status}, msg="${body?.message?.slice(0,60)}"`);
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log(`\n⚠️  Regression checklist (manual verify):`);
  console.log(`   • §4  VerdictCard appears AFTER TargetPriceCard in DOM`);
  console.log(`   • §19 Consultant preview: 3 quick-reply chips render`);
  console.log(`   • §20 Unit cost hero card shows before 3-col metrics grid`);
  console.log(`   • §30 "Сохранить расчёт" CTA appears after 1st calc`);
  console.log(`   • §31 Pro nudge card appears after 2+ calcs`);
  console.log(`   • §26 Paywall copy: "ChinaBridge Pro — AI Unit Economics"`);
  console.log(`   • §46 Consultant bubble: shows product name + city`);
  console.log(`   • §44 /kak-rasschityvaetsya-import — E-E-A-T page loads`);
  process.exit(1);
}
console.log(`\n✅ All tests passed — production is green\n`);
