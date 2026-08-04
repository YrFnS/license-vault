import crypto from "crypto";

interface InvitationTokenPayload {
  memberId: string;
  orgId: string;
  email: string;
  invitedAt: number;
  expiresAt: number;
}

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function getInvitationSecret(): string {
  const secret =
    process.env.TEAM_INVITATION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("TEAM_INVITATION_SECRET or NEXTAUTH_SECRET must be configured");
  }
  return secret;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getInvitationSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createTeamInvitationToken(input: {
  memberId: string;
  orgId: string;
  email: string;
  invitedAt: Date;
}): string {
  const payload: InvitationTokenPayload = {
    memberId: input.memberId,
    orgId: input.orgId,
    email: input.email.trim().toLowerCase(),
    invitedAt: input.invitedAt.getTime(),
    expiresAt: Date.now() + INVITATION_LIFETIME_MS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyTeamInvitationToken(
  token: string,
): InvitationTokenPayload | null {
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;

  try {
    const expectedSignature = sign(encodedPayload);
    const expected = Buffer.from(expectedSignature);
    const supplied = Buffer.from(suppliedSignature);
    if (
      expected.length !== supplied.length ||
      !crypto.timingSafeEqual(expected, supplied)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<InvitationTokenPayload>;

    if (
      typeof payload.memberId !== "string" ||
      typeof payload.orgId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.invitedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload as InvitationTokenPayload;
  } catch {
    return null;
  }
}
