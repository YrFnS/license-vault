'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  GripVertical,
  Plus,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
  order: number;
}

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

const CATEGORIES = ['general', 'documentation', 'payment', 'verification', 'training'];

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const t = useTranslations('checklists');
  const [newItemLabel, setNewItemLabel] = useState('');

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    const newItem: ChecklistItem = {
      id: String(Date.now()),
      label: newItemLabel.trim(),
      required: false,
      category: 'general',
      order: items.length,
    };
    onChange([...items, newItem]);
    setNewItemLabel('');
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id).map((i, idx) => ({ ...i, order: idx })));
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    onChange(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onChange(newItems.map((i, idx) => ({ ...i, order: idx })));
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors group"
        >
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveItem(idx, 'up')}
              disabled={idx === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <GripVertical className="size-3.5" />
            </button>
          </div>
          <Input
            value={item.label}
            onChange={e => updateItem(item.id, { label: e.target.value })}
            className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-1"
          />
          <Select
            value={item.category}
            onValueChange={v => updateItem(item.id, { category: v })}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>
                  <div className="flex items-center gap-1.5">
                    <Tag className="size-3" />
                    <span className="capitalize">{c}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{t('required')}</span>
            <Switch
              checked={item.required}
              onCheckedChange={v => updateItem(item.id, { required: v })}
              className="scale-75"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      {/* Add new item */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          value={newItemLabel}
          onChange={e => setNewItemLabel(e.target.value)}
          placeholder={t('addItem')}
          className="flex-1 h-9 text-sm"
          onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItemLabel.trim()}
          className="gap-1"
        >
          <Plus className="size-3.5" />
          {t('addItem')}
        </Button>
      </div>
    </div>
  );
}
