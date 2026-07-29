import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  integrationConfigSchema,
  testIntegrationConnection,
} from "@/lib/integration-config";

export const runtime = "nodejs";

const testConnectionSchema = z.object({
  type: z.string().trim().min(1).max(100),
  config: integrationConfigSchema,
});

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can test integrations." },
        { status: 403 },
      );
    }

    const result = testConnectionSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ||
            "Provide a public HTTPS API URL and complete API key.",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const connection = await testIntegrationConnection(result.data.config);
    return NextResponse.json(connection, {
      status: connection.success ? 200 : 422,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error testing integration connection:", error);
    return NextResponse.json(
      { success: false, message: "The connection test could not be completed." },
      { status: 500 },
    );
  }
}
