import { headers } from 'next/headers';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function authenticateApiKey() {
  const headersList = await headers();
  const authHeader = headersList.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const key = authHeader.substring(7);
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  
  const apiKey = await db.apiKey.findFirst({
    where: { keyHash },
    include: { org: true },
  });
  
  if (!apiKey || !apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  
  // Update lastUsedAt
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  
  return {
    orgId: apiKey.orgId,
    permissions: apiKey.permissions,
    apiKeyId: apiKey.id,
  };
}

export function hasPermission(permissions: string, required: 'read' | 'write' | 'admin'): boolean {
  const level = { read: 1, write: 2, admin: 3 };
  const userLevel = level[permissions as keyof typeof level] ?? 0;
  const requiredLevel = level[required];
  return userLevel >= requiredLevel;
}
