import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

let registered = false;

async function loadFontAsDataUri(name: string): Promise<string> {
  const localPath = path.join(process.cwd(), 'public', 'fonts', name);
  // Try local filesystem first (works locally and sometimes on Vercel)
  if (fs.existsSync(localPath)) {
    const buf = fs.readFileSync(localPath);
    return `data:font/truetype;base64,${buf.toString('base64')}`;
  }
  // Fallback: fetch from public URL (always works on Vercel since public/ is static)
  const url = `https://chinabridge.pro/fonts/${name}`;
  console.log(`[proposals] Fetching font from ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:font/truetype;base64,${buf.toString('base64')}`;
}

export async function registerFonts() {
  if (registered) return;
  try {
    const [regular, bold, light] = await Promise.all([
      loadFontAsDataUri('Roboto-Regular.ttf'),
      loadFontAsDataUri('Roboto-Bold.ttf'),
      loadFontAsDataUri('Roboto-Light.ttf'),
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
    console.error('[proposals] Font registration failed:', err);
    // Don't set registered=true so next request retries
  }
}
