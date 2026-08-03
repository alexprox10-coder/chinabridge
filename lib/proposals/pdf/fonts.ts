import { Font } from '@react-pdf/renderer';
import path from 'path';

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;
  const base = path.join(process.cwd(), 'public', 'fonts');
  try {
    Font.register({
      family: 'Roboto',
      fonts: [
        { src: path.join(base, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
        { src: path.join(base, 'Roboto-Bold.ttf'), fontWeight: 'bold' },
        { src: path.join(base, 'Roboto-Light.ttf'), fontWeight: 300 },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
  } catch (err) {
    console.warn('[proposals] Font registration failed, using default font:', err);
  }
}
