import '../styles/globals.css';
import { Space_Grotesk, Oxanium } from 'next/font/google';
import type { AppProps } from 'next/app';

// Définition des polices avec next/font
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

const oxanium = Oxanium({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oxanium',
  weight: ['400', '500', '600', '700'],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${spaceGrotesk.variable} ${oxanium.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
