import './globals.css';
import { Space_Grotesk, Oxanium } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';

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
  title: 'Avalanche',
  description: 'Trouvez, suivez et découvrez les meilleurs jeux vidéo avec Avalanche, votre plateforme gaming ultime',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`dark ${spaceGrotesk.variable} ${oxanium.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <Toaster richColors theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
