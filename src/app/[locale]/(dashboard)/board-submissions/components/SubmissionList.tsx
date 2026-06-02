'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Eye, Trash2, MapPin, BadgeCheck, Receipt, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { BoardSubmission } from './types';
import { getSubmissionTypeIcon, getStatusColor, getPriorityColor, formatDate, getSubmissionTypeLabel, getPriorityLabel } from './helpers';

interface SubmissionListProps {
  submissions: BoardSubmission[];
  loading: boolean;
  activeTab: string;
  onTabChange: (v: string) => void;
  tabs: { value: string; label: string; count: number }[];
  onView: (sub: BoardSubmission) => void;
  onDelete: (sub: BoardSubmission) => void;
  onSubmitToBoard: (sub: BoardSubmission) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
  getStatusLabel: (s: string) => string;
}

export function SubmissionList({
  submissions, loading, activeTab, onTabChange, tabs,
  onView, onDelete, onSubmitToBoard,
  t, tc, getStatusLabel,
}: SubmissionListProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <div className="overflow-x-auto">
        <TabsList className="w-full justify-start mb-4 bg-muted/50 p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm gap-1.5">
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-[10px]">{tab.count}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Send className="size-12 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold">{t('noSubmissions')}</h3>
                  <p className="text-muted-foreground mt-1">{t('noSubmissionsDesc')}</p>
                  <Button
                    onClick={() => {}}
                    className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <Plus className="size-4 me-2" />
                    {t('newSubmission')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="popLayout">
                {submissions.map((sub) => {
                  const TypeIcon = getSubmissionTypeIcon(sub.submissionType);
                  return (
                    <motion.div
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => onView(sub)}>
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="size-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <TypeIcon className="size-5 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={cn('text-xs', getStatusColor(sub.status))}>
                                    {getStatusLabel(sub.status)}
                                  </Badge>
                                  <Badge className={cn('text-xs', getPriorityColor(sub.priority))}>
                                    {getPriorityLabel(sub.priority)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {getSubmissionTypeLabel(sub.submissionType)}
                                  </Badge>
                                </div>
                                <p className="font-semibold mt-1 truncate">{sub.boardName}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><MapPin className="size-3" />{sub.state}</span>
                                  {sub.trackingNumber && (
                                    <span className="flex items-center gap-1"><BadgeCheck className="size-3" />{sub.trackingNumber}</span>
                                  )}
                                  <span className="flex items-center gap-1"><Receipt className="size-3" />${sub.filingFee}</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(sub.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {(sub.status === 'draft' || sub.status === 'ready') && (
                                <Button size="sm" variant="ghost"
                                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={(e) => { e.stopPropagation(); onSubmitToBoard(sub); }}>
                                  <Send className="size-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onView(sub); }}>
                                <Eye className="size-4" />
                              </Button>
                              <Button size="sm" variant="ghost"
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={(e) => { e.stopPropagation(); onDelete(sub); }}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
