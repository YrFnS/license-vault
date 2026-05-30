import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

interface SearchResult {
  title?: string;
  name?: string;
  snippet?: string;
  description?: string;
  url?: string;
  link?: string;
}

interface GeneratedAlert {
  title: string;
  description: string;
  changeType: string;
  severity: string;
  sourceUrl?: string;
  effectiveDate?: string;
}

/**
 * Check for regulatory changes for a specific org/state/licenseType
 */
export async function checkForChanges(
  orgId: string,
  state: string,
  licenseType?: string
): Promise<GeneratedAlert[]> {
  const zai = await ZAI.create();
  const query = `${state} contractor license regulatory changes 2025 ${licenseType || ''}`.trim();

  const results = await zai.web.search({
    query,
    count: 10,
  });

  // Get existing alerts for deduplication
  const existingAlerts = await db.regulatoryAlert.findMany({
    where: { orgId, state },
    select: { title: true },
  });
  const existingTitles = new Set(existingAlerts.map(a => a.title));

  const newAlerts: GeneratedAlert[] = [];

  for (const result of (results as SearchResult[])) {
    const title = result.title || result.name || 'Regulatory Change Detected';
    if (existingTitles.has(title)) continue;
    newAlerts.push(generateAlertFromSearchResult(result, state));
  }

  return newAlerts;
}

/**
 * Generate a structured alert from a search result
 */
export function generateAlertFromSearchResult(
  result: SearchResult,
  state: string
): GeneratedAlert {
  const content = (result.snippet || result.description || '').toLowerCase();
  let severity = 'info';
  let changeType = 'regulatory_update';

  if (content.includes('emergency') || content.includes('immediate') || content.includes('critical')) {
    severity = 'critical';
  } else if (content.includes('deadline') || content.includes('change') || content.includes('update')) {
    severity = 'warning';
  }

  if (content.includes('fee') || content.includes('cost') || content.includes('price')) {
    changeType = 'fee_change';
  } else if (content.includes('deadline') || content.includes('due date')) {
    changeType = 'deadline_change';
  } else if (content.includes('new requirement') || content.includes('new regulation')) {
    changeType = 'new_requirement';
  } else if (content.includes('form') || content.includes('application')) {
    changeType = 'form_update';
  }

  return {
    title: result.title || result.name || 'Regulatory Change Detected',
    description: result.snippet || result.description || 'Regulatory change detected via web search',
    changeType,
    severity,
    sourceUrl: result.url || result.link,
  };
}

/**
 * Run a full monitoring cycle for all active watches
 */
export async function runMonitoringCycle(): Promise<{
  checkedWatches: number;
  newAlerts: number;
  errors: string[];
}> {
  const watches = await db.regulatoryWatch.findMany({
    where: { isActive: true },
  });

  let newAlerts = 0;
  const errors: string[] = [];

  for (const watch of watches) {
    try {
      const alerts = await checkForChanges(watch.orgId, watch.state, watch.licenseType || undefined);

      for (const alert of alerts) {
        await db.regulatoryAlert.create({
          data: {
            orgId: watch.orgId,
            state: watch.state,
            licenseType: watch.licenseType,
            title: alert.title,
            description: alert.description,
            changeType: alert.changeType,
            severity: alert.severity,
            sourceUrl: alert.sourceUrl || null,
            effectiveDate: alert.effectiveDate ? new Date(alert.effectiveDate) : null,
          },
        });
        newAlerts++;
      }

      await db.regulatoryWatch.update({
        where: { id: watch.id },
        data: { lastChecked: new Date() },
      });
    } catch (error) {
      errors.push(`Error checking ${watch.state}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    checkedWatches: watches.length,
    newAlerts,
    errors,
  };
}
