require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const tables = await sql.unsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'outbound%'
  `);
  console.log("outbound tables:", JSON.stringify(tables));

  const cols = await sql.unsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'outbound_leads' LIMIT 5
  `);
  console.log("columns sample:", JSON.stringify(cols));
}
run().catch(e => console.error("ERR:", e.message));
