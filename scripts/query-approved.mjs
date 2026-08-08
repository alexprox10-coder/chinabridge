import pg from "pg";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l.includes("=")).map(l => {
    const [k, ...v] = l.split("=");
    return [k.trim(), v.join("=").trim().replace(/^["']|["']$/g, "")];
  })
);

const { Client } = pg;
const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

// 1. Approved import leads IDs
const { rows: approvedIds } = await client.query(
  "SELECT lead_id FROM import_lead_statuses WHERE status = 'approved'"
);
console.log("\n=== ОДОБРЕННЫЕ IMPORT-ЛИДЫ (IDs) ===");
console.log(approvedIds.map(r => r.lead_id).join("\n") || "нет");

// 2. MI leads in CLIENT pipeline
let miLeads = [];
try {
  const { rows } = await client.query(`
    SELECT company, phone, email, telegram, website, city, country, score, temperature, source_url
    FROM mi_leads WHERE pipeline = 'CLIENT' ORDER BY score DESC
  `);
  miLeads = rows;
} catch(e) {
  console.log("MI table error:", e.message);
}

console.log("\n=== MI-ЛИДЫ (CLIENT / Одобрены) ===");
if (miLeads.length === 0) {
  console.log("нет");
} else {
  miLeads.forEach(l => {
    console.log(`[${l.temperature}] ${l.company} | Тел: ${l.phone||"—"} | Email: ${l.email||"—"} | TG: ${l.telegram||"—"} | ${l.website||l.source_url||""} | ${l.city||""}`);
  });
}

// 3. Also check what MI pipeline statuses exist
try {
  const { rows: stats } = await client.query(`
    SELECT pipeline, count(*) FROM mi_leads GROUP BY pipeline ORDER BY pipeline
  `);
  console.log("\n=== MI pipeline stats ===");
  stats.forEach(r => console.log(`  ${r.pipeline}: ${r.count}`));
} catch {}

await client.end();
