import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { User } from '@/lib/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-lm-page">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
