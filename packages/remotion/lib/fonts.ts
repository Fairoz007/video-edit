import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';

const inter = loadInter('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

const montserrat = loadMontserrat('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin'],
});

export const interFamily = inter.fontFamily;
export const displayFamily = montserrat.fontFamily;
