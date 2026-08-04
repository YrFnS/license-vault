import crypto from "node:crypto";
import { db } from "@/lib/db";
import { assertSafeWebhookUrl } from "@/lib/safe-webhook-url";
import { decryptWebhookSecret } from "@/lib/webhook-secret";

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  orgId: string;
}

interface DispatchResult {
  webhookId: string;
  status?: number;
  ok: boolean;
  error?: string;
}

export async function dispatchWebhook(
  orgId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<PromiseSettledResult<DispatchResult>[]> {
  const webhooks = await db.webhook.findMany({
    where: { orgId, isActive: true },
  });

  const matchingWebhooks = webhooks.filter((webhook) => {
    const events = webhook.events.split(",").map((item) => item.trim());
    return events.includes(event) || events.includes("*");
  });

  if (matchingWebhooks.length === 0) return [];

  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    orgId,
  };

  return Promise.allSettled(
    matchingWebhooks.map(async (webhook): Promise<DispatchResult> => {
      try {
        const body = JSON.stringify(payload);
        const signature = crypto
          .createHmac("sha256", decryptWebhookSecret(webhook.secret))
          .update(body)
          .digest("hex");
        const safeUrl = await assertSafeWebhookUrl(webhook.url);
        const response = await fetch(safeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Event": event,
            "X-Webhook-Delivery-ID": crypto.randomUUID(),
          },
          body,
          redirect: "manual",
          signal: AbortSignal.timeout(10_000),
        });

        const redirected = response.status >= 300 && response.status < 400;
        const ok = response.ok && !redirected;

        await db.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            failureCount: ok ? 0 : { increment: 1 },
          },
        });

        return {
          webhookId: webhook.id,
          status: response.status,
          ok,
          ...(redirected ? { error: "Redirects are not allowed for webhook delivery" } : {}),
        };
      } catch (error) {
        await db.webhook.update({
          where: { id: webhook.id },
          data: { failureCount: { increment: 1 } },
        });

        return {
          webhookId: webhook.id,
          error: error instanceof Error ? error.message : String(error),
          ok: false,
        };
      }
    }),
  );
}
