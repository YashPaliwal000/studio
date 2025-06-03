
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { logout, username } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {username && <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {username}</span>}
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="mr-1.5 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
