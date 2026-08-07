import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';

let registered = false;

async function ensureFont(name: string): Promise<string> {
  // 1. Local public/fonts — works in dev and sometimes in Vercel with outputFileTracingIncludes
  const localPath = path.join(process.cwd(), 'public', 'fonts', name);
  if (fs.existsSync(localPath)) return localPath;

  // 2. Write to /tmp — writable on Vercel, persists across warm invocations
  const tmpDir = path.join(os.tmpdir(), 'cb-fonts');
  const tmpPath = path.join(tmpDir, name);

  if (fs.existsSync(tmpPath)) return tmpPath;

  // 3. Fetch from public URL and cache in /tmp
  const url = `https://chinabridge.pro/fonts/${name}`;
  console.log(`[proposals] Fetching font ${name} from CDN...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Font fetch failed ${res.status}: ${url}`);

  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(tmpPath, buf);
  console.log(`[proposals] Cached ${name} to ${tmpPath} (${buf.length} bytes)`);
  return tmpPath;
}

export async function registerFonts() {
  if (registered) return;
  try {
    const [regular, bold, light] = await Promise.all([
      ensureFont('Roboto-Regular.ttf'),
      ensureFont('Roboto-Bold.ttf'),
      ensureFont('Roboto-Light.ttf'),
    ]);
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: regular, fontWeight: 'normal' },
        { src: bold,    fontWeight: 'bold'   },
        { src: light,   fontWeight: 300      },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
    registered = true;
    console.log('[proposals] Fonts registered OK');
  } catch (err) {
    console.error('[proposals] Font registration FAILED:', err);
  }
}
