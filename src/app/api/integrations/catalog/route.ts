import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/org-context";

const INTEGRATION_CATALOG = [
  {
    type: "procore",
    name: "Procore",
    category: "construction_erp",
    icon: "HardHat",
    description:
      "Verify and store a Procore API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "projects", "documents"],
  },
  {
    type: "autodesk_construction",
    name: "Autodesk Construction Cloud",
    category: "construction_erp",
    icon: "Layers",
    description:
      "Verify and store an Autodesk Construction API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "projects", "documents"],
  },
  {
    type: "viewpoint",
    name: "Viewpoint",
    category: "construction_erp",
    icon: "Building",
    description:
      "Verify and store a Viewpoint API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "projects", "contractors"],
  },
  {
    type: "cmic",
    name: "CMiC",
    category: "construction_erp",
    icon: "Building",
    description:
      "Verify and store a CMiC API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "projects", "contractors"],
  },
  {
    type: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    icon: "Calculator",
    description:
      "Verify and store an API endpoint securely. A supported OAuth and data-sync adapter is required for production QuickBooks sync.",
    dataFlows: ["licenses", "contractors", "documents"],
  },
  {
    type: "sage",
    name: "Sage",
    category: "accounting",
    icon: "DollarSign",
    description:
      "Verify and store a Sage API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors", "documents"],
  },
  {
    type: "freshbooks",
    name: "FreshBooks",
    category: "accounting",
    icon: "Calculator",
    description:
      "Verify and store a FreshBooks API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors"],
  },
  {
    type: "xero",
    name: "Xero",
    category: "accounting",
    icon: "Calculator",
    description:
      "Verify and store a Xero API endpoint securely. A supported OAuth and data-sync adapter is required for production sync.",
    dataFlows: ["licenses", "contractors", "documents"],
  },
  {
    type: "adp",
    name: "ADP",
    category: "hris",
    icon: "Users",
    description:
      "Verify and store an ADP API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors", "documents"],
  },
  {
    type: "workday",
    name: "Workday",
    category: "hris",
    icon: "Users",
    description:
      "Verify and store a Workday API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors"],
  },
  {
    type: "bamboohr",
    name: "BambooHR",
    category: "hris",
    icon: "Users",
    description:
      "Verify and store a BambooHR API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors"],
  },
  {
    type: "gusto",
    name: "Gusto",
    category: "hris",
    icon: "Users",
    description:
      "Verify and store a Gusto API endpoint securely. Automatic record sync requires a provider adapter.",
    dataFlows: ["licenses", "contractors"],
  },
].map((integration) => ({
  ...integration,
  connectionAvailable: true,
  syncAvailable: false,
  availability: "connection_only" as const,
}));

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { catalog: INTEGRATION_CATALOG },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    console.error("Error fetching integration catalog:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
