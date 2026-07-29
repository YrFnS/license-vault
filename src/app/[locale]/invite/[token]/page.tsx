"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Invitation {
  email: string;
  fullName: string | null;
  role: string;
  expiresAt: string;
  hasAccount: boolean;
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export default function TeamInvitationPage() {
  const t = useTranslations("team");
  const locale = useLocale();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadInvitation = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/team/invitations/${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Invitation unavailable");
      setInvitation(payload.invitation);
      setName(payload.invitation.fullName || "");
    } catch (loadError) {
      setInvitation(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("invitation.invalidDescription"),
      );
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  const invitedEmail = invitation?.email.toLowerCase();
  const signedInEmail = session?.user?.email?.toLowerCase();
  const wrongAccount =
    status === "authenticated" &&
    Boolean(invitedEmail) &&
    signedInEmail !== invitedEmail;

  const roleLabel = useMemo(() => {
    if (invitation?.role === "owner") return t("roles.owner");
    if (invitation?.role === "admin") return t("roles.admin");
    return t("roles.member");
  }, [invitation?.role, t]);

  const completeAcceptance = async () => {
    const response = await fetch(
      `/api/team/invitations/${encodeURIComponent(token)}`,
      { method: "POST" },
    );
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Unable to accept invitation");

    setSuccess(true);
    await update({ activeOrgId: payload.orgId });
    router.push("/dashboard");
    router.refresh();
  };

  const handleExistingAccount = async () => {
    if (!invitation) return;
    setSubmitting(true);
    setError("");
    try {
      if (status !== "authenticated") {
        const result = await signIn("credentials", {
          email: invitation.email,
          password,
          redirect: false,
        });
        if (result?.error) throw new Error("Invalid email or password");
        await update();
      }
      await completeAcceptance();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to join organization",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!invitation) return;
    if (password !== confirmPassword) {
      setError(t("invitation.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: invitation.email,
          password,
          inviteToken: token,
        }),
      });
      const registerPayload = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerPayload.error || "Unable to create account");
      }

      const signInResult = await signIn("credentials", {
        email: invitation.email,
        password,
        redirect: false,
      });
      if (signInResult?.error) throw new Error("Account created, but sign-in failed");

      setSuccess(true);
      await update({ activeOrgId: registerPayload.orgId });
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-7 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold">
              {t("invitation.invalidTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || t("invitation.invalidDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <Card className="w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-primary" />
        <CardHeader className="items-center pb-3 text-center">
          <Avatar className="mb-3 size-16 rounded-2xl">
            {invitation.organization.logoUrl && (
              <AvatarImage
                src={invitation.organization.logoUrl}
                alt={invitation.organization.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-7" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">
            {t("invitation.title", {
              organization: invitation.organization.name,
            })}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("invitation.description", {
              role: roleLabel,
              email: invitation.email,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("invitation.expires", {
              date: new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(invitation.expiresAt)),
            })}
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-6 pt-3">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="size-12 text-emerald-500" />
              <p className="mt-3 font-medium">{t("invitation.success")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("invitation.accepting")}
              </p>
            </div>
          ) : wrongAccount ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {t("invitation.wrongAccount", { email: invitation.email })}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ redirect: false }).then(() => location.reload())}
              >
                {t("invitation.signOut")}
              </Button>
            </div>
          ) : status === "authenticated" ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleExistingAccount}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Shield className="me-2 size-4" />
              )}
              {submitting
                ? t("invitation.accepting")
                : t("invitation.accept")}
            </Button>
          ) : invitation.hasAccount ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleExistingAccount();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="invite-email">{t("inviteEmail")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    value={invitation.email}
                    readOnly
                    dir="ltr"
                    className="ps-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password">
                  {t("invitation.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invite-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="ps-10"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
                {t("invitation.signIn")}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateAccount();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="invite-name">{t("invitation.name")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invite-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                    className="ps-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-invite-password">
                  {t("invitation.password")}
                </Label>
                <Input
                  id="new-invite-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  {t("invitation.passwordRequirements")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-invite-password">
                  {t("invitation.confirmPassword")}
                </Label>
                <Input
                  id="confirm-invite-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
                {t("invitation.createAccount")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
