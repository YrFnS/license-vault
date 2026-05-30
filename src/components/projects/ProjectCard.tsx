'use client';

import {
  MapPin,
  Calendar,
  Building2,
  FileBadge,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ComplianceScoreRing } from '@/components/common/ComplianceScoreRing';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    location?: string | null;
    clientName?: string | null;
    complianceScore: number;
    startDate?: string | null;
    endDate?: string | null;
    _count?: { projectLicenses: number; projectSubs: number };
  };
  onClick?: (id: string) => void;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        'cursor-pointer border-border/50',
        'dark:hover:border-emerald-800/50',
        onClick && 'hover:border-emerald-200 dark:hover:border-emerald-800/50'
      )}
      onClick={() => onClick?.(project.id)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name + Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{project.name}</h3>
              <StatusBadge status={project.status} />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {project.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-emerald-500" />
                  <span className="truncate">{project.location}</span>
                </div>
              )}
              {project.clientName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 shrink-0 text-teal-500" />
                  <span className="truncate">{project.clientName}</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{formatDate(project.startDate)}</span>
                  {project.endDate && (
                    <span className="text-muted-foreground/50">→ {formatDate(project.endDate)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Counts */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {project._count && (
                <>
                  <div className="flex items-center gap-1">
                    <FileBadge className="size-3.5 text-emerald-500" />
                    <span>{project._count.projectLicenses} {project._count.projectLicenses === 1 ? 'license' : 'licenses'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="size-3.5 text-teal-500" />
                    <span>{project._count.projectSubs} {project._count.projectSubs === 1 ? 'subcontractor' : 'subcontractors'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Compliance Score Ring */}
          <div className="shrink-0 self-center relative">
            <ComplianceScoreRing score={project.complianceScore} size="sm" />
          </div>
        </div>
      </CardContent>

      {/* Hover accent bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start" />
    </Card>
  );
}
