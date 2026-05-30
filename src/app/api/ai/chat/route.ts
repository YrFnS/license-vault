import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { buildUserContext } from '@/lib/ai-context';

const AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ).min(1),
});

const FALLBACK_SYSTEM_PROMPT = `You are a compliance assistant for contractors. Help with licensing requirements, renewal processes, and compliance questions. Be concise and helpful. You have expertise in:
- State contractor licensing requirements across the US
- City and county permit requirements
- Professional certification requirements
- Insurance and bonding requirements
- License renewal processes and timelines
- Compliance best practices
- Regulatory changes and updates

Always provide actionable, specific advice. When you're unsure about jurisdiction-specific details, acknowledge the limitation and suggest consulting the relevant licensing board directly.`;

function buildContextAwareSystemPrompt(context: string): string {
  return `You are License Vault AI, an expert compliance advisor for contractors. You have access to the user's current compliance data below.

USER COMPLIANCE DATA:
${context}

Your capabilities:
1. Answer questions about contractor licensing, compliance, and regulations
2. Provide state-specific guidance based on the user's licenses and locations
3. Proactively identify compliance risks and recommend actions
4. Help with renewal planning and CE requirements
5. Explain insurance and bond requirements

Guidelines:
- Always reference the user's actual data when answering questions
- If the user asks about their licenses, provide specific details from the context
- Proactively warn about upcoming expirations and compliance gaps
- Suggest specific actions with timelines (e.g., "Your CA Electrical license expires in 25 days. You need 8 more CE hours. Here's what to do...")
- When discussing state requirements, reference the actual board contact info if available
- Be concise but thorough - contractors need actionable advice, not lengthy explanations
- If you don't know something specific, say so rather than guessing`;
}

// POST: AI Chat endpoint using OpenRouter
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const result = chatSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { messages } = result.data;

    // Build context-aware system prompt
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    try {
      const userContext = await buildUserContext(userId);
      if (userContext && userContext !== 'No organization found for this user.' && userContext !== 'Unable to load user compliance data at this time.') {
        systemPrompt = buildContextAwareSystemPrompt(userContext);
      }
    } catch (contextError) {
      console.error('Failed to build user context, using fallback prompt:', contextError);
    }

    // Check if OpenRouter API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // Return a helpful message if API key is not configured
      const fallbackResponse = "I'm sorry, the AI assistant is not currently configured. Please contact your administrator to set up the OPENROUTER_API_KEY environment variable. In the meantime, I can suggest visiting your state's contractor licensing board website for specific licensing requirements.";

      // Save the user message and fallback response
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'user') {
        await db.aiChatMessage.create({
          data: { userId, role: 'user', content: lastUserMessage.content },
        });
        await db.aiChatMessage.create({
          data: { userId, role: 'assistant', content: fallbackResponse },
        });
      }

      return NextResponse.json({
        message: {
          role: 'assistant',
          content: fallbackResponse,
        },
      });
    }

    // Build messages for OpenRouter API
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call OpenRouter API
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick:free',
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, await response.text());
      const errorMessage = "I'm having trouble connecting to the AI service right now. Please try again in a moment.";

      return NextResponse.json({
        message: {
          role: 'assistant',
          content: errorMessage,
        },
      });
    }

    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content || "I apologize, but I wasn't able to generate a response. Please try again.";

    // Save messages to AiChatMessage table
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
      await db.aiChatMessage.create({
        data: { userId, role: 'user', content: lastUserMessage.content },
      });
    }
    await db.aiChatMessage.create({
      data: { userId, role: 'assistant', content: assistantContent },
    });

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantContent,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
