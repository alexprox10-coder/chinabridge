import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const envContent = readFileSync('.env.local', 'utf-8');
let dbUrl = envContent.split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=').slice(1).join('=').trim().replace(/^["']|["']$/g,'');
// Remove channel_binding param which neon serverless doesn't support
dbUrl = dbUrl.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?&/, '?');

const sql = neon(dbUrl);
const res = await sql`DELETE FROM calc_anon_requests WHERE date = CURRENT_DATE`;
console.log('Rate limit reset. You are now a fresh anonymous user.');
