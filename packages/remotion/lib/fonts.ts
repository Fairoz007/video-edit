/**
 * Google Fonts used by documentaryTemplates.js (v2).
 * All families come from @remotion/google-fonts (single package, per-font subpaths).
 */
import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadBlackHanSans } from '@remotion/google-fonts/BlackHanSans';
import { loadFont as loadCormorantGaramond } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as loadCourierPrime } from '@remotion/google-fonts/CourierPrime';
import { loadFont as loadDMSans } from '@remotion/google-fonts/DMSans';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadJetBrainsMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadLibreBaskerville } from '@remotion/google-fonts/LibreBaskerville';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadShareTechMono } from '@remotion/google-fonts/ShareTechMono';
import { loadFont as loadSourceSerif4 } from '@remotion/google-fonts/SourceSerif4';

const inter = loadInter('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

const montserrat = loadMontserrat('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin'],
});

const bebasNeue = loadBebasNeue('normal', { weights: ['400'], subsets: ['latin'] });
const cormorant = loadCormorantGaramond('normal', {
  weights: ['400', '600'],
  subsets: ['latin'],
});
loadCormorantGaramond('italic', { weights: ['400'], subsets: ['latin'] });
const libreBaskerville = loadLibreBaskerville('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
loadLibreBaskerville('italic', { weights: ['400'], subsets: ['latin'] });
const blackHanSans = loadBlackHanSans('normal', { weights: ['400'], subsets: ['latin'] });
const dmSans = loadDMSans('normal', {
  weights: ['400', '700', '900'],
  subsets: ['latin'],
});
const playfair = loadPlayfairDisplay('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});
loadPlayfairDisplay('italic', { weights: ['400'], subsets: ['latin'] });
const sourceSerif4 = loadSourceSerif4('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
loadSourceSerif4('italic', { weights: ['400'], subsets: ['latin'] });
const jetBrainsMono = loadJetBrainsMono('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
const shareTechMono = loadShareTechMono('normal', { weights: ['400'], subsets: ['latin'] });
const courierPrime = loadCourierPrime('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

/** Default body / UI (Cinematic DocuForge) */
export const interFamily = inter.fontFamily;
/** Walkthrough & legacy display slots */
export const displayFamily = montserrat.fontFamily;

/** Map documentary template font heading/body names → loaded CSS families */
export const DOCUMENTARY_FONT_FAMILIES: Record<string, string> = {
  'Bebas Neue': bebasNeue.fontFamily,
  Inter: inter.fontFamily,
  'JetBrains Mono': jetBrainsMono.fontFamily,
  'Cormorant Garamond': cormorant.fontFamily,
  'Libre Baskerville': libreBaskerville.fontFamily,
  'Black Han Sans': blackHanSans.fontFamily,
  'DM Sans': dmSans.fontFamily,
  'Playfair Display': playfair.fontFamily,
  'Source Serif 4': sourceSerif4.fontFamily,
  'Share Tech Mono': shareTechMono.fontFamily,
  'Courier Prime': courierPrime.fontFamily,
  Montserrat: montserrat.fontFamily,
};

export function resolveFontFamily(name: string | undefined, fallback = interFamily): string {
  if (!name) return fallback;
  return DOCUMENTARY_FONT_FAMILIES[name] ?? name;
}
