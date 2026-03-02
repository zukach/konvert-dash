'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { removeToken } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export function Topbar() {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <h2 className="text-sm font-medium text-muted-foreground">
        Sales Analytics Dashboard
      </h2>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </header>
  );
}
