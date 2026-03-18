"use client";

import AppShell from '@/components/AppShell';
import ProfileContent from '../../components/ProfileContent';
import { useToast } from '@/context/ToastContext';

export default function ProfilePage() {
  const { showToast } = useToast();

  return (
    <AppShell>
      <ProfileContent onShowToast={showToast} />
    </AppShell>
  );
}
