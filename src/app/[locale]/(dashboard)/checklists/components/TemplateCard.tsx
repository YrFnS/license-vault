import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MoreHorizontal, Edit3, ClipboardList, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { categoryColors } from './types';
import type { ChecklistTemplate } from './types';

export function TemplateCard({ template, index, onEdit, onNewInstance, onDelete }: {
  template: ChecklistTemplate;
  index: number;
  onEdit: (t: ChecklistTemplate) => void;
  onNewInstance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('checklists');

  let itemCount = 0;
  try { itemCount = JSON.parse(template.items).length; } catch {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.description && (
                <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit3 className="size-3.5 me-2" />
                  {t('editTemplate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNewInstance(template.id)}>
                  <ClipboardList className="size-3.5 me-2" />
                  {t('newFromTemplate')}
                </DropdownMenuItem>
                {!template.isDefault && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(template.id)}
                  >
                    <Trash2 className="size-3.5 me-2" />
                    {t('deleteTemplate')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[10px]", categoryColors[template.category] || categoryColors.general)}>
              {t(template.category as any) || template.category}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {itemCount} {t('items')}
            </Badge>
            {template.isDefault && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200">
                {t('defaultTemplates')}
              </Badge>
            )}
            {template._count && template._count.instances > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {template._count.instances} used
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
