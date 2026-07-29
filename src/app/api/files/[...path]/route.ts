import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export const runtime = "nodejs";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function getContentType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    csv: "text/csv; charset=utf-8",
  };
  return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
}

function isInlineViewable(fileType: string): boolean {
  return ["pdf", "jpg", "jpeg", "png"].includes(fileType.toLowerCase());
}

function safeDownloadName(fileName: string): string {
  return fileName.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "document";
}

function resolveUploadPath(pathSegments: string[]): {
  relativePath: string;
  absolutePath: string;
} | null {
  if (
    pathSegments.length === 0 ||
    pathSegments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        segment.includes("\0"),
    )
  ) {
    return null;
  }

  const relativePath = pathSegments.join("/");
  const absolutePath = path.resolve(UPLOADS_DIR, ...pathSegments);
  if (
    absolutePath !== UPLOADS_DIR &&
    !absolutePath.startsWith(`${UPLOADS_DIR}${path.sep}`)
  ) {
    return null;
  }
  return { relativePath, absolutePath };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    const resolved = resolveUploadPath(pathSegments);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const [licenseDocument, subcontractorDocument, applicationDocument] =
      await Promise.all([
        db.licenseDocument.findFirst({
          where: {
            filePath: resolved.relativePath,
            orgId: context.orgId,
          },
          select: { fileName: true, fileType: true },
        }),
        db.subcontractorDocument.findFirst({
          where: {
            filePath: resolved.relativePath,
            orgId: context.orgId,
          },
          select: { fileName: true, fileType: true },
        }),
        db.licenseApplicationDocument.findFirst({
          where: {
            filePath: resolved.relativePath,
            application: { orgId: context.orgId },
          },
          select: { fileName: true, fileType: true },
        }),
      ]);

    const document =
      licenseDocument || subcontractorDocument || applicationDocument;
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(resolved.absolutePath);
    } catch {
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }

    const forceDownload =
      new URL(request.url).searchParams.get("download") === "true";
    const disposition =
      forceDownload || !isInlineViewable(document.fileType)
        ? "attachment"
        : "inline";
    const fileName = safeDownloadName(document.fileName);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": getContentType(document.fileType),
        "Content-Disposition": `${disposition}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
