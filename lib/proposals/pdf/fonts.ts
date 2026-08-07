import { Font } from '@react-pdf/renderer';
import { ROBOTO_REGULAR_B64, ROBOTO_BOLD_B64, ROBOTO_LIGHT_B64 } from './font-data';

let registered = false;

export async function registerFonts() {
  if (registered) return;

  // Fonts are embedded as base64 constants — no file system or network access needed.
  // react-pdf handles data URIs via fontkit.create() which exists in all fontkit builds.
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: `data:font/truetype;base64,${ROBOTO_REGULAR_B64}`, fontWeight: 'normal' },
      { src: `data:font/truetype;base64,${ROBOTO_BOLD_B64}`,    fontWeight: 'bold'   },
      { src: `data:font/truetype;base64,${ROBOTO_LIGHT_B64}`,   fontWeight: 300      },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  registered = true;
  console.log('[proposals] Fonts registered OK (embedded base64)');
}
