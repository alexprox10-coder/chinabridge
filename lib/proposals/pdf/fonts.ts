import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';

let registered = false;

// Read font into Buffer using OUR fs (not fontkit.open which may be missing in browser bundle)
async function loadFontBuffer(name: string): Promise<Buffer> {
  // 1. Local public/fonts (dev + Vercel with outputFileTracingIncludes)
  const localPath = path.join(process.cwd(), 'public', 'fonts', name);
  if (fs.existsSync(localPath)) {
    console.log(`[fonts] ${name} ← local`);
    return fs.readFileSync(localPath);
  }

  // 2. /tmp cache (warm invocations on Vercel)
  const tmpDir = path.join(os.tmpdir(), 'cb-fonts');
  const tmpPath = path.join(tmpDir, name);
  if (fs.existsSync(tmpPath)) {
    console.log(`[fonts] ${name} ← /tmp cache`);
    return fs.readFileSync(tmpPath);
  }

  // 3. Fetch from our CDN, then jsDelivr as fallback
  const urls = [
    `https://chinabridge.pro/fonts/${name}`,
    `https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/${name}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(tmpPath, buf);
        console.log(`[fonts] ${name} ← ${url} (${buf.length}b)`);
        return buf;
      }
      console.warn(`[fonts] ${url} → ${res.status}`);
    } catch (e) {
      console.warn(`[fonts] fetch ${url} failed:`, e);
    }
  }

  throw new Error(`Cannot load font: ${name}`);
}

export async function registerFonts() {
  if (registered) return;
  try {
    const [regular, bold, light] = await Promise.all([
      loadFontBuffer('Roboto-Regular.ttf'),
      loadFontBuffer('Roboto-Bold.ttf'),
      loadFontBuffer('Roboto-Light.ttf'),
    ]);

    // Always pass data URIs — fontkit.create() works in both Node and browser bundles.
    // fontkit.open() (file path) only exists in the Node build; Next.js may bundle
    // the browser build, making fontkit.open undefined → silent Helvetica fallback.
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: `data:font/truetype;base64,${regular.toString('base64')}`, fontWeight: 'normal' },
        { src: `data:font/truetype;base64,${bold.toString('base64')}`,    fontWeight: 'bold'   },
        { src: `data:font/truetype;base64,${light.toString('base64')}`,   fontWeight: 300      },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
    registered = true;
    console.log('[proposals] Fonts registered OK (data URIs)');
  } catch (err) {
    console.error('[proposals] Font registration FAILED:', err);
  }
}
