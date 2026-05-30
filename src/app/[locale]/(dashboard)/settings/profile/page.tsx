'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  Mail,
  Shield,
  Building2,
  Lock,
  AlertTriangle,
  Loader2,
  Calendar,
  Crown,
  Users,
  Trash2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  memberSince: string;
  organization: {
    id: string;
    name: string;
    tradeType?: string;
    primaryState?: string;
  } | null;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; bgColor: string } {
  if (!password) return { score: 0, label: '', color: '', bgColor: '' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'passwordStrengthWeak', color: 'bg-red-500', bgColor: 'bg-red-500/10' };
  if (score <= 2) return { score: 2, label: 'passwordStrengthFair', color: 'bg-amber-500', bgColor: 'bg-amber-500/10' };
  if (score <= 3) return { score: 3, label: 'passwordStrengthGood', color: 'bg-emerald-400', bgColor: 'bg-emerald-400/10' };
  return { score: 4, label: 'passwordStrengthStrong', color: 'bg-emerald-600', bgColor: 'bg-emerald-600/10' };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const passwordsMatch = newPassword === confirmNewPassword;
  const canSubmitPassword = currentPassword && newPassword.length >= 8 && passwordsMatch;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.role || 'member',
          memberSince: data.memberSince,
          organization: data.organization,
        });
        setName(data.user.name || '');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setHasChanges(name !== profile.name && name.trim() !== '');
    }
  }, [name, profile]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, name } : prev);
        setHasChanges(false);
        toast.success(t('saveSuccess'));
      } else {
        toast.error(t('saveError'));
      }
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordsMatch) {
      toast.error(t('newPasswordMismatch'));
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      if (res.ok) {
        toast.success(t('passwordUpdateSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const data = await res.json();
        if (data.error?.includes('incorrect') || data.error?.includes('Current password')) {
          toast.error(t('currentPasswordIncorrect'));
        } else if (data.error?.includes('match') || data.error?.includes('Match')) {
          toast.error(t('newPasswordMismatch'));
        } else {
          toast.error(t('passwordUpdateError'));
        }
      }
    } catch {
      toast.error(t('passwordUpdateError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm gap-1">
            <Crown className="size-3" />
            {t('owner')}
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1">
            <Shield className="size-3" />
            {t('admin')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 gap-1">
            <Users className="size-3" />
            {t('member')}
          </Badge>
        );
    }
  };

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const formatMemberSince = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Profile card skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shrink-0">
          <User className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </motion.div>

      {/* A. Avatar / Profile Header Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-md">
          {/* Gradient banner background */}
          <div className="relative h-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600">
            {/* Decorative circles */}
            <div className="absolute -top-4 -end-4 size-32 rounded-full bg-white/10" />
            <div className="absolute top-2 end-12 size-16 rounded-full bg-white/5" />
            <div className="absolute -bottom-2 -start-4 size-20 rounded-full bg-white/10" />
          </div>
          <CardContent className="relative px-6 pb-6">
            {/* Avatar overlapping the banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
              <div className="size-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-background shrink-0">
                {getInitial(profile?.name || '')}
              </div>
              <div className="flex-1 text-center sm:text-start min-w-0">
                <h2 className="text-xl font-bold truncate">{profile?.name || '—'}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" />
                    {profile?.email || '—'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {t('memberSince')} {formatMemberSince(profile?.memberSince || '')}
                  </span>
                  {profile?.organization && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3.5" />
                      {profile.organization.name}
                    </span>
                  )}
                  {getRoleBadge(profile?.role || 'member')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* B. Account Information Section */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <User className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">{t('personalInfo')}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t('subtitle')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                {t('name')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="flex-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={!hasChanges || saving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shrink-0 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin me-2" />
                  ) : null}
                  {tCommon('save')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" />
                {t('email')}
              </Label>
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2.5 border border-border/50">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate">{profile?.email || '—'}</span>
                <Badge variant="outline" className="ms-auto text-[10px] shrink-0">
                  Read-only
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="size-3.5 text-muted-foreground" />
                {t('role')}
              </Label>
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2.5 border border-border/50">
                {getRoleBadge(profile?.role || 'member')}
                <span className="text-muted-foreground ms-1">
                  {profile?.role === 'owner' ? t('owner') : profile?.role === 'admin' ? t('admin') : t('member')}
                </span>
              </div>
            </div>

            <Separator />

            {/* Organization */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                {t('organization')}
              </Label>
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2.5 border border-border/50">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span>{profile?.organization?.name || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* C. Password Change Section */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Lock className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">{t('changePassword')}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">{t('currentPassword')}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="ps-9 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">{t('newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="ps-9 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors"
                />
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium min-w-fit px-2 py-0.5 rounded-full ${
                      passwordStrength.score >= 3
                        ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40'
                        : passwordStrength.score >= 2
                          ? 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40'
                          : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
                    }`}>
                      {t(passwordStrength.label as 'passwordStrengthWeak' | 'passwordStrengthFair' | 'passwordStrengthGood' | 'passwordStrengthStrong')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword" className="text-sm font-medium">{t('confirmNewPassword')}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={`ps-9 transition-colors ${
                    confirmNewPassword && !passwordsMatch
                      ? 'focus-visible:ring-red-500/30 focus-visible:border-red-500 border-red-300 dark:border-red-700'
                      : 'focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500'
                  }`}
                />
              </div>
              {confirmNewPassword && !passwordsMatch && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  {t('newPasswordMismatch')}
                </p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={!canSubmitPassword || changingPassword}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {changingPassword ? (
                <Loader2 className="size-4 animate-spin me-2" />
              ) : (
                <Lock className="size-4 me-2" />
              )}
              {t('updatePassword')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* D. Danger Zone Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-red-200 dark:border-red-900/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-base text-red-600 dark:text-red-400">{t('dangerZone')}</CardTitle>
                <CardDescription className="text-xs mt-0.5 text-red-500/80 dark:text-red-400/70">
                  {t('dangerZoneDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
              <div className="flex items-start gap-3">
                <Trash2 className="size-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">{t('deleteAccount')}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('deleteAccountDesc')}</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="destructive"
                        className="shrink-0 opacity-60 cursor-not-allowed"
                        disabled
                      >
                        <Trash2 className="size-4 me-2" />
                        {t('deleteAccount')}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="flex items-center gap-1.5">
                      <Info className="size-3.5 shrink-0" />
                      {t('contactSupport')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
