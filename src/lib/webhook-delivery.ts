// Webhook delivery library for License Vault
// Finds active webhooks matching an event and dispatches HTTP POST payloads with HMAC signatures

import { db } from '@/lib/db';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  orgId: string;
}

interface DispatchResult {
  webhookId: string;
  status?: number;
  ok: boolean;
  error?: string;
}

/**
 * Dispatch a webhook event to all active webhooks in the organization that subscribe to this event.
 *
 * @param orgId  The organization ID to scope the webhook lookup
 * @param event  The event name (e.g. "license.created")
 * @param data   Arbitrary data to include in the payload
 * @returns      Array of settled results (one per matching webhook)
 */
export async function dispatchWebhook(
  orgId: string,
  event: string,
  data: Record<string, any>
): Promise<PromiseSettledResult<DispatchResult>[]> {
  // Find all active webhooks for this org
  const webhooks = await db.webhook.findMany({
    where: { orgId, isActive: true },
  });

  // Filter to webhooks that listen for this event (or wildcard "*")
  const matchingWebhooks = webhooks.filter((wh) => {
    const events: string[] = wh.events.split(',').map((e) => e.trim());
    return events.includes(event) || events.includes('*');
  });

  // Nothing to dispatch
  if (matchingWebhooks.length === 0) return [];

  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    orgId,
  };

  const results = await Promise.allSettled(
    matchingWebhooks.map(async (webhook): Promise<DispatchResult> => {
      const body = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-Event': event,
            'X-Webhook-Delivery-ID': crypto.randomUUID(),
          },
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        // Update webhook stats
        await db.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            failureCount: response.ok ? 0 : webhook.failureCount + 1,
          },
        });

        return { webhookId: webhook.id, status: response.status, ok: response.ok };
      } catch (error) {
        await db.webhook.update({
          where: { id: webhook.id },
          data: { failureCount: webhook.failureCount + 1 },
        });

        return { webhookId: webhook.id, error: String(error), ok: false };
      }
    })
  );

  return results;
}
