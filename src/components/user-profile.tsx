
'use client';

import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Star, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { ProModal } from './pro-modal';
import Link from 'next/link';
import { ApiKeyModal } from './api-key-modal';

export function UserProfile() {
  const { user, signOut, isPro } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-5 w-5" />;
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isPro ? (
             <DropdownMenuItem onClick={() => setIsApiKeyModalOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Manage API Key</span>
              </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/upgrade">
                <Star className="mr-2 h-4 w-4 text-amber-500" />
                <span>Upgrade to Pro</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
    </>
  );
}
