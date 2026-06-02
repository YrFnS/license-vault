import type { WorkflowStep } from '@/components/workflows/WorkflowBuilder';

export interface WorkflowDefinitionData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  triggerType: string;
  triggerConfig: string | null;
  steps: WorkflowStep[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: { instances: number; activeInstances: number; completedInstances: number };
}

export interface WorkflowInstanceData {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: string | null;
  currentStep: number;
  status: string;
  stepHistory: Array<{ stepId: string; stepName: string; action: string; userId: string; timestamp: string; notes: string | null }>;
  startedAt: string;
  completedAt: string | null;
  definition: { name: string; category: string; steps: WorkflowStep[]; totalSteps: number };
}

export interface Stats {
  total: number;
  active: number;
  runningInstances: number;
  completed: number;
}

export interface InstanceCounts {
  active: number;
  completed: number;
  cancelled: number;
  failed: number;
}
