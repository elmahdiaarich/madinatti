import { Playfair_Display, Amiri, Source_Serif_4, Noto_Sans_Arabic, Inter } from 'next/font/google';

export const displayFR = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-display-fr',
  display: 'swap',
});

export const displayAR = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-display-ar',
  display: 'swap',
});

export const bodyFR = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body-fr',
  display: 'swap',
});

export const bodyAR = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  variable: '--font-body-ar',
  display: 'swap',
});

export const meta = Inter({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-meta',
  display: 'swap',
});

export const pressFontVars = `${displayFR.variable} ${displayAR.variable} ${bodyFR.variable} ${bodyAR.variable} ${meta.variable}`;