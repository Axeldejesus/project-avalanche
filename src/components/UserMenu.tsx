'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Library, BarChart2, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from './UserAvatar';
import { logoutUser } from '../services/authenticate';

interface UserMenuProps {
  username: string;
  imageUrl?: string | null;
}

const UserMenu: React.FC<UserMenuProps> = ({ username, imageUrl }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50 focus:outline-none"
          aria-label="Menu utilisateur"
        >
          <UserAvatar username={username} imageUrl={imageUrl} size="sm" />
          <span className="hidden text-sm font-medium text-foreground md:block">
            {username}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 bg-popover border-border">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          @{username}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/collections" className="flex items-center gap-2 cursor-pointer">
            <Library className="h-4 w-4" />
            Collections
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/stats" className="flex items-center gap-2 cursor-pointer">
            <BarChart2 className="h-4 w-4" />
            Statistiques
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
