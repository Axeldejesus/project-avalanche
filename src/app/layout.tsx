import './globals.css';
import { Space_Grotesk, Oxanium } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext'; // Import du provider d'authentification
import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'Avalanche - Discover Your Next Gaming Adventure',
  description: 'Find, track, and discover the best video games with Avalanche, your ultimate gaming platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${oxanium.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
