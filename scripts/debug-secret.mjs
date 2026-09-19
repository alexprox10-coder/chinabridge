import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const raw = readFileSync(envPath, 'utf8');

// Find the CRON_SECRET line
const line = raw.split('\n').find(l => l.trim().startsWith('CRON_SECRET='));
console.log('Raw line length:', line?.length);
console.log('Starts with:', JSON.stringify(line?.substring(0, 20)));
console.log('Ends with:', JSON.stringify(line?.slice(-10)));

// Parse
const eq = line.indexOf('=');
let v = line.slice(eq + 1).trim();
console.log('After = , length:', v.length);
console.log('First char:', JSON.stringify(v[0]));
console.log('Last char:', JSON.stringify(v[v.length-1]));

// Strip outer quotes
if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
  v = v.slice(1, -1);
  console.log('After strip quotes, length:', v.length);
}
