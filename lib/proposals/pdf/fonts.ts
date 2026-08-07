import { Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

let registered = false;

// Google Fonts CDN — Roboto with full Cyrillic subset (TTF, works with react-pdf)
const CDN: Record<string, string> = {
  regular: 'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME5WNKORIhAA.ttf',
  bold:    'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME5WNKORIhAA.ttf',
  light:   'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME5WNKORIhAA.ttf',
};

export function registerFonts() {
  if (registered) return;
  registered = true;

  const base = path.join(process.cwd(), 'public', 'fonts');
  const localOk = fs.existsSync(path.join(base, 'Roboto-Regular.ttf'));

  const regular = localOk ? path.join(base, 'Roboto-Regular.ttf') : CDN.regular;
  const bold    = localOk ? path.join(base, 'Roboto-Bold.ttf')    : CDN.bold;
  const light   = localOk ? path.join(base, 'Roboto-Light.ttf')   : CDN.light;

  if (!localOk) {
    console.warn('[proposals] Local TTF fonts not found, falling back to Google Fonts CDN');
  }

  try {
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: regular, fontWeight: 'normal' },
        { src: bold,    fontWeight: 'bold'   },
        { src: light,   fontWeight: 300      },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
  } catch (err) {
    console.error('[proposals] Font registration failed:', err);
  }
}
