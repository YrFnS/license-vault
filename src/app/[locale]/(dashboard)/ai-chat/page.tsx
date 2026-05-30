'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Bot, User, Plus, Sparkles, Trash2,
  Shield, FileText, MapPin, AlertTriangle, BookOpen, Compass,
  Activity, Clock, GraduationCap, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Bouncing dots animation component
function BouncingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="sr-only">Thinking</span>
      <span className="size-1.5 rounded-full bg-emerald-500 animate-[bounce_1.4s_ease-in-out_infinite]" />
      <span className="size-1.5 rounded-full bg-teal-500 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="size-1.5 rounded-full bg-emerald-400 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
    </span>
  );
}

// Format time like "2:34 PM"
function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Original suggested prompt card data
const promptCards = [
  { key: 'prompt1', icon: Shield, color: 'emerald' },
  { key: 'prompt2', icon: MapPin, color: 'teal' },
  { key: 'prompt3', icon: FileText, color: 'emerald' },
  { key: 'prompt4', icon: BookOpen, color: 'teal' },
  { key: 'prompt5', icon: AlertTriangle, color: 'emerald' },
  { key: 'prompt6', icon: Compass, color: 'teal' },
] as const;

// Context-aware suggested prompt cards
const contextPromptCards = [
  { key: 'biggestRisks', icon: Activity, color: 'emerald' },
  { key: 'renewalSoon', icon: Clock, color: 'teal' },
  { key: 'ceHoursNeeded', icon: GraduationCap, color: 'emerald' },
  { key: 'renewalRequirements', icon: FileText, color: 'teal' },
  { key: 'multiStateCompliance', icon: MapPin, color: 'emerald' },
  { key: 'whatIfRenewal', icon: Scale, color: 'teal' },
] as const;

const colorMap: Record<string, { bg: string; iconBg: string; iconText: string; border: string; hoverBg: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    iconBg: 'bg-teal-100 dark:bg-teal-900/50',
    iconText: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    hoverBg: 'hover:bg-teal-100 dark:hover:bg-teal-900/40',
  },
};

// Message bubble with timestamp
function MessageBubble({
  msg,
  isRTL,
  t,
  locale,
}: {
  msg: Message;
  isRTL: boolean;
  t: (key: string) => string;
  locale: string;
}) {
  const isUser = msg.role === 'user';
  const timeStr = formatTime(msg.timestamp, locale);

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {msg.role === 'assistant' ? (
        <Avatar className="size-8 shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Bot className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="size-8 shrink-0 mt-1">
          <AvatarFallback className="bg-emerald-600 text-white dark:bg-emerald-700">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white dark:from-emerald-700 dark:to-emerald-800'
              : 'bg-muted text-foreground',
            isUser && !isRTL && 'rounded-tr-sm',
            isUser && isRTL && 'rounded-tl-sm',
            !isUser && !isRTL && 'rounded-tl-sm',
            !isUser && isRTL && 'rounded-tr-sm',
            'transition-colors duration-150',
            !isUser && 'hover:bg-muted/80'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1 prose-p:leading-relaxed
              prose-ul:my-1 prose-ol:my-1
              prose-li:my-0.5
              prose-headings:my-2 prose-headings:first:mt-0
              prose-code:bg-muted-foreground/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:my-2
              prose-strong:text-foreground
              prose-a:text-emerald-600 dark:prose-a:text-emerald-400
            ">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const t = useTranslations('aiChat');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showContextPrompts, setShowContextPrompts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQueryProcessed = useRef(false);

  const handleSend = useCallback(async (messageText?: string) => {
    const trimmed = (messageText || input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setShowClearConfirm(false);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message?.content || data.message || t('error'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('error'), timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, t]);

  // Handle pre-filled question from URL param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !initialQueryProcessed.current && messages.length === 0) {
      initialQueryProcessed.current = true;
      // Use a small timeout to ensure state is ready
      setTimeout(() => {
        handleSend(decodeURIComponent(q));
      }, 100);
    }
  }, [searchParams, handleSend, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (showClearConfirm) {
      setMessages([]);
      setInput('');
      setShowClearConfirm(false);
      inputRef.current?.focus();
    } else {
      setShowClearConfirm(true);
      // Auto-dismiss after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">{t('online')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-2.5" />
              {t('contextAware')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t('messageCount', { count: messages.length })}
            </Badge>
          )}
          {messages.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className={cn(
                  'gap-1.5 transition-colors',
                  showClearConfirm
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50'
                    : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                )}
              >
                <Trash2 className="size-3.5" />
                {showClearConfirm ? t('clearChatConfirm') : t('clearChat')}
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              setInput('');
              setShowClearConfirm(false);
              inputRef.current?.focus();
            }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            {t('newChat')}
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <Card className="flex flex-1 flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4">
          {showWelcome ? (
            /* Welcome message with suggested prompt cards */
            <div className="flex flex-col items-center justify-center py-6 px-4 min-h-[300px]">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 p-5 mb-6 shadow-sm">
                <Sparkles className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="max-w-lg text-center mb-2">
                <h2 className="text-lg font-semibold mb-1">{t('noMessages')}</h2>
                <p className="text-sm text-muted-foreground">{t('noMessagesDesc')}</p>
              </div>

              {/* Context-aware prompt cards */}
              <div className="mt-6 w-full max-w-xl">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <button
                    onClick={() => setShowContextPrompts(!showContextPrompts)}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <Activity className="size-3" />
                    {t('riskAnalysis')}
                  </button>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {showContextPrompts ? (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
                      {t('contextAware')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {contextPromptCards.map((card) => {
                        const Icon = card.icon;
                        const colors = colorMap[card.color];
                        return (
                          <button
                            key={card.key}
                            onClick={() => handleSuggestionClick(t(card.key))}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-200',
                              colors.bg,
                              colors.border,
                              colors.hoverBg,
                              'hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5'
                            )}
                          >
                            <div className={cn('shrink-0 rounded-lg p-2', colors.iconBg)}>
                              <Icon className={cn('size-4', colors.iconText)} />
                            </div>
                            <span className={cn('text-sm font-medium leading-snug', colors.iconText)}>
                              {t(card.key)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
                      {t('suggestedPrompts')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {promptCards.map((card) => {
                        const Icon = card.icon;
                        const colors = colorMap[card.color];
                        return (
                          <button
                            key={card.key}
                            onClick={() => handleSuggestionClick(t(card.key))}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-200',
                              colors.bg,
                              colors.border,
                              colors.hoverBg,
                              'hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5'
                            )}
                          >
                            <div className={cn('shrink-0 rounded-lg p-2', colors.iconBg)}>
                              <Icon className={cn('size-4', colors.iconText)} />
                            </div>
                            <span className={cn('text-sm font-medium leading-snug', colors.iconText)}>
                              {t(card.key)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} isRTL={isRTL} t={t} locale={locale} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-3 animate-in fade-in duration-200">
                  <Avatar className="size-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'rounded-2xl bg-muted px-4 py-3 text-sm flex flex-col gap-1',
                    !isRTL && 'rounded-tl-sm',
                    isRTL && 'rounded-tr-sm'
                  )}>
                    <span className="text-xs text-muted-foreground">{t('typing')}</span>
                    <BouncingDots />
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area with gradient border */}
        <div className="p-4 border-t bg-gradient-to-r from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20">
          {/* Suggestion chips below messages (when chat is active) */}
          {messages.length > 0 && !isLoading && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {contextPromptCards.slice(0, 3).map((card) => {
                const Icon = card.icon;
                const colors = colorMap[card.color];
                return (
                  <button
                    key={card.key}
                    onClick={() => handleSuggestionClick(t(card.key))}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      colors.border
                    )}
                  >
                    <Icon className="size-3" />
                    {t(card.key)}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-800 opacity-50 blur-[1px]" />
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                disabled={isLoading}
                className="relative bg-background border-0 shadow-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm"
            >
              <Send className="size-4" />
              <span className="sr-only">{t('send')}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
