'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Mail, Clock, Loader2, MoreHorizontal, Trash2, RefreshCw, Shield, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrgMember {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  invitedAt: string;
  joinedAt: string | null;
  userId: string | null;
}

export default function TeamPage() {
  const t = useTranslations('team');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [removeMember, setRemoveMember] = useState<OrgMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [roleChangeMember, setRoleChangeMember] = useState<OrgMember | null>(null);
  const [newRole, setNewRole] = useState<string>('member');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [cancelInviteMember, setCancelInviteMember] = useState<OrgMember | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Determine current user role from members list
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole(data.userRole || 'member');
        }
      } catch {
        // keep default
      }
    };
    fetchRole();
  }, []);

  const canInvite = ['owner', 'admin'].includes(currentUserRole);
  const canRemove = ['owner', 'admin'].includes(currentUserRole);
  const canChangeRole = currentUserRole === 'owner';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        toast.success(t('inviteSuccess'));
        setInviteEmail('');
        setInviteRole('member');
        setInviteOpen(false);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || t('inviteError'));
      }
    } catch {
      toast.error(t('inviteError'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMember) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/team/${removeMember.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('removeSuccess') || 'Member removed successfully');
        setRemoveMember(null);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleChangeMember || !newRole) return;
    setRoleChangeLoading(true);
    try {
      const res = await fetch(`/api/team/${roleChangeMember.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(t('roleChangeSuccess') || 'Role updated successfully');
        setRoleChangeMember(null);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to change role');
      }
    } catch {
      toast.error('Failed to change role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!cancelInviteMember) return;
    setActionLoadingId(cancelInviteMember.id);
    try {
      const res = await fetch(`/api/team/${cancelInviteMember.id}/invite`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('cancelSuccess') || 'Invite cancelled successfully');
        setCancelInviteMember(null);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to cancel invite');
      }
    } catch {
      toast.error('Failed to cancel invite');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendInvite = async (memberId: string) => {
    setActionLoadingId(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}/resend`, { method: 'POST' });
      if (res.ok) {
        toast.success(t('resendSuccess') || 'Invite resent successfully');
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to resend invite');
      }
    } catch {
      toast.error('Failed to resend invite');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100';
      case 'admin':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100';
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const activeMembers = members.filter((m) => m.joinedAt);
  const pendingMembers = members.filter((m) => !m.joinedAt);
  const ownerCount = activeMembers.filter((m) => m.role === 'owner').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {activeMembers.length} {t('members')}
            {pendingMembers.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {' '}&middot; {pendingMembers.length} {t('pending')}
              </span>
            )}
          </p>
        </div>
        {canInvite && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="size-4 me-2" />
                {t('invite')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('invite')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('inviteEmail')}</label>
                  <Input
                    type="email"
                    placeholder={t('inviteEmailPlaceholder')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('inviteRole')}</label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                      <SelectItem value="member">{t('roles.member')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin me-2" />
                      {tCommon('loading')}
                    </>
                  ) : (
                    t('invite')
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{activeMembers.length}</p>
            <p className="text-xs text-muted-foreground">{t('members')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingMembers.length}</p>
            <p className="text-xs text-muted-foreground">{t('pendingInvites')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {activeMembers.filter((m) => m.role === 'admin').length}
            </p>
            <p className="text-xs text-muted-foreground">{t('roles.admin')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {activeMembers.filter((m) => m.role === 'member').length}
            </p>
            <p className="text-xs text-muted-foreground">{t('roles.member')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Members - Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t('members')}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noMembers')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('name')}</TableHead>
                  <TableHead>{t('inviteEmail')}</TableHead>
                  <TableHead>{t('inviteRole')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.fullName, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {member.fullName || member.email.split('@')[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('capitalize', getRoleBadgeVariant(member.role))}
                      >
                        {t(`roles.${member.role}` as 'roles.owner' | 'roles.admin' | 'roles.member')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        {t('joined')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(canRemove || canChangeRole) && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canChangeRole && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setRoleChangeMember(member);
                                  setNewRole(member.role === 'admin' ? 'member' : 'admin');
                                }}
                              >
                                <Shield className="size-4 me-2" />
                                {t('changeRole') || 'Change Role'}
                              </DropdownMenuItem>
                            )}
                            {canRemove && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setRemoveMember(member)}
                              >
                                <Trash2 className="size-4 me-2" />
                                {t('removeMember') || 'Remove Member'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Members - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {activeMembers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('noMembers')}
            </CardContent>
          </Card>
        ) : (
          activeMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.fullName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {member.fullName || member.email.split('@')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" dir="ltr">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn('capitalize shrink-0', getRoleBadgeVariant(member.role))}
                    >
                      {t(`roles.${member.role}` as 'roles.owner' | 'roles.admin' | 'roles.member')}
                    </Badge>
                    {(canRemove || canChangeRole) && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canChangeRole && (
                            <DropdownMenuItem
                              onClick={() => {
                                setRoleChangeMember(member);
                                setNewRole(member.role === 'admin' ? 'member' : 'admin');
                              }}
                            >
                              <Shield className="size-4 me-2" />
                              {t('changeRole') || 'Change Role'}
                            </DropdownMenuItem>
                          )}
                          {canRemove && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setRemoveMember(member)}
                            >
                              <Trash2 className="size-4 me-2" />
                              {t('removeMember') || 'Remove Member'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">{t('pendingInvites')}</h2>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <Mail className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" dir="ltr">
                          {member.email}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {t('invited')}{' '}
                          {new Date(member.invitedAt).toLocaleDateString(
                            locale === 'ar' ? 'ar-SA' : 'en-US'
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn('capitalize shrink-0', getRoleBadgeVariant(member.role))}
                      >
                        {t(`roles.${member.role}` as 'roles.owner' | 'roles.admin' | 'roles.member')}
                      </Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                        {t('pending')}
                      </Badge>
                      {canInvite && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleResendInvite(member.id)}
                            disabled={actionLoadingId === member.id}
                            title={t('resendInvite')}
                          >
                            {actionLoadingId === member.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RefreshCw className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:text-red-600"
                            onClick={() => setCancelInviteMember(member)}
                            disabled={actionLoadingId === member.id}
                            title={t('cancelInvite')}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMember} onOpenChange={(open) => !open && setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeMember') || 'Remove Member'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeConfirm') || 'Are you sure you want to remove this member?'}
              {removeMember && (
                <span className="block mt-2 font-medium">
                  {removeMember.fullName || removeMember.email}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  {tCommon('loading')}
                </>
              ) : (
                t('removeMember') || 'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleChangeMember} onOpenChange={(open) => !open && setRoleChangeMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changeRole') || 'Change Role'}</DialogTitle>
          </DialogHeader>
          {roleChangeMember && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(roleChangeMember.fullName, roleChangeMember.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {roleChangeMember.fullName || roleChangeMember.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {roleChangeMember.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('inviteRole')}</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                    <SelectItem value="member">{t('roles.member')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleChangeRole}
                disabled={roleChangeLoading || newRole === roleChangeMember.role}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {roleChangeLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin me-2" />
                    {tCommon('loading')}
                  </>
                ) : (
                  t('saveRole') || 'Save Role'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog open={!!cancelInviteMember} onOpenChange={(open) => !open && setCancelInviteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelInvite') || 'Cancel Invitation'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelConfirm') || 'Are you sure you want to cancel this invitation?'}
              {cancelInviteMember && (
                <span className="block mt-2 font-medium" dir="ltr">
                  {cancelInviteMember.email}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvite}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('cancelInvite') || 'Cancel Invite'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
