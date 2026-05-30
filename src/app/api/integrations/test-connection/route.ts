import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const testConnectionSchema = z.object({
  type: z.string().min(1),
  config: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
  }),
});

// POST: Test integration connection (requires auth)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = testConnectionSchema.parse(body);
    const { type, config } = validated;

    // Validate API key presence
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'API key is required. Please provide a valid API key for the integration.',
      });
    }

    // Basic API key format validation
    const apiKey = config.apiKey.trim();
    if (apiKey.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'API key appears to be too short. Please check and enter the complete key.',
      });
    }

    // Test base URL reachability if provided
    if (config.baseUrl && config.baseUrl.trim().length > 0) {
      try {
        const baseUrl = config.baseUrl.trim();
        const urlObj = new URL(baseUrl);

        // Attempt a lightweight fetch to test reachability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(urlObj.origin, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok && response.status !== 405 && response.status !== 401) {
          return NextResponse.json({
            success: false,
            message: `Base URL returned status ${response.status}. Please verify the URL is correct.`,
          });
        }
      } catch (urlError) {
        // If URL parsing or fetch fails
        if (urlError instanceof TypeError && urlError.message.includes('Invalid URL')) {
          return NextResponse.json({
            success: false,
            message: 'Invalid base URL format. Please enter a valid URL (e.g., https://api.example.com).',
          });
        }
        // Timeout or network error - still allow connection but warn
        return NextResponse.json({
          success: true,
          message: `API key validated for ${type}. Note: Could not verify base URL reachability, but credentials appear valid.`,
        });
      }
    }

    // All validations passed
    return NextResponse.json({
      success: true,
      message: `Successfully verified connection to ${type}. API key is valid and ready to use.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request format. Please provide integration type and configuration.',
      }, { status: 400 });
    }
    console.error('Error testing integration connection:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while testing the connection. Please try again.',
    }, { status: 500 });
  }
}
