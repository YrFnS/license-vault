'use client';

import { useSession } from 'next-auth/react';

export type UserRole = 'owner' | 'admin' | 'member';

export function useRole() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as UserRole || 'member';

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isMember: role === 'member',
    canManage: role === 'owner' || role === 'admin',
    /** Can create, edit, delete, renew licenses */
    canManageLicenses: role === 'owner' || role === 'admin',
    /** Can invite team members */
    canManageTeam: role === 'owner' || role === 'admin',
    /** Can access admin dashboard */
    canAccessAdmin: role === 'owner' || role === 'admin',
  };
}
