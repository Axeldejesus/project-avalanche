'use client';

import dynamic from 'next/dynamic';

// Dynamically import AuthButtons with SSR disabled
const AuthButtonsClient = dynamic(
  () => import('./AuthButtons'),
  { ssr: false }
);

export default function AuthButtonsWrapper() {
  return <AuthButtonsClient />;
}
