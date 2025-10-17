'use client';
import React, { useEffect } from 'react';
import { DashboardLayoutClient } from './layout-client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth state is not loading and there is no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // While checking auth state, show a loading skeleton.
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-[400px] w-[600px]" />
            </div>
        </div>
    )
  }

  // If user is logged in, render the dashboard.
  return (
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
  );
}
