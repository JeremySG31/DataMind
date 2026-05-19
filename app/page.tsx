'use client';

import { useAuthContext } from '@/app/providers';
import { LandingPage } from '@/components/landing-page';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground/60">Cargando...</p>
        </div>
      </div>
    );
  }

  return <LandingPage />;
}
