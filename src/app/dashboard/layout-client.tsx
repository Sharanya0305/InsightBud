'use client';

import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import {
  FileBarChart,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/expenses', icon: ReceiptText, label: 'Expenses' },
  { href: '/dashboard/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/dashboard/savings', icon: Target, label: 'Savings' },
  { href: '/dashboard/reports', icon: FileBarChart, label: 'Reports' },
];

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" side="left" collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  as={Link}
                  href={item.href}
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
