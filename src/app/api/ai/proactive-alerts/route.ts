import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/org-context";
import { generateOrganizationComplianceAlerts } from "@/lib/compliance-alerts";

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await generateOrganizationComplianceAlerts(context.orgId);
    return NextResponse.json(
      { alerts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Proactive alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
