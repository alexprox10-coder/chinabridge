import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  // Primary: filesystem path (works locally + Vercel if outputFileTracingIncludes picks it up)
  // Fallback: serve from public URL (always works on Vercel since public/ is static)
  const base = path.join(process.cwd(), 'public', 'fonts');
  const localOk = fs.existsSync(path.join(base, 'Roboto-Regular.ttf'));

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chinabridge.pro';

  const src = (name: string) =>
    localOk ? path.join(base, name) : `${origin}/fonts/${name}`;

  if (!localOk) {
    console.warn(`[proposals] Local fonts not found, loading from ${origin}/fonts/`);
  }

  try {
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: src('Roboto-Regular.ttf'), fontWeight: 'normal' },
        { src: src('Roboto-Bold.ttf'),    fontWeight: 'bold'   },
        { src: src('Roboto-Light.ttf'),   fontWeight: 300      },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
  } catch (err) {
    console.error('[proposals] Font registration failed:', err);
  }
}
