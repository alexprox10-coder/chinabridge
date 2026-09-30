import fs from "node:fs";

const inFile = process.argv[2] || "/tmp/msp-contacts.json";
const outFile = process.argv[3] || "/tmp/load-msp-workflow.txt";
const chunkArg = process.argv.find((a) => a.startsWith("--chunk="));
const chunkIndex = chunkArg ? parseInt(chunkArg.split("=")[1], 10) : 0;
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "150", 10);

const allData = JSON.parse(fs.readFileSync(inFile, "utf-8"));
const data = allData.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);

// Экранирование для SQL string literal (одинарные кавычки -> '')
const esc = (s) => String(s ?? "").replace(/'/g, "''");
const sqlArray = (arr) =>
  !arr || !arr.length ? "ARRAY[]::text[]" : `ARRAY[${arr.map((x) => `'${esc(x)}'`).join(",")}]`;

const values = data
  .map(
    (c) =>
      `('${esc(c.name)}','${esc(c.inn)}','${esc(c.okved)}','${esc(c.okvedName)}','${esc(c.region)}',${c.hasKeyword ? "true" : "false"},${sqlArray(c.found)},'new','msp_registry')`
  )
  .join(",\n");

const sql = `INSERT INTO outreach_contacts (company_name, inn, okvad, okvad_name, region, has_china_keywords, china_keywords_found, status, source)
VALUES
${values}
ON CONFLICT (inn) DO NOTHING`;

// Никакого Code node — Code node сломан в этом окружении n8n (execute_workflow
// падает с "Could not get parameter" даже на тривиальном jsCode). Вместо этого
// весь INSERT собран как один статический SQL-литерал для Postgres node.
const code = `import { workflow, node, trigger } from '@n8n/workflow-sdk';

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Start' }
});

const insertContacts = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Bulk Insert Contacts',
    parameters: {
      operation: 'executeQuery',
      query: ${JSON.stringify(sql)}
    },
    credentials: { postgres: { id: 'MKbYVjC292jRYysn', name: 'Postgres account' } }
  }
});

export default workflow('setup-load-msp-chunk-${chunkIndex}', 'Setup: Load MSP Chunk ${chunkIndex} (one-off)')
  .add(startTrigger)
  .to(insertContacts);
`;

fs.writeFileSync(outFile, code, "utf-8");
console.log("written:", outFile, "length:", code.length, "records:", data.length, "chunk:", chunkIndex, "of total:", allData.length);
