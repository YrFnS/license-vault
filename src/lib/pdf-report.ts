import jsPDF from 'jspdf';

// === Type Definitions ===

interface LicenseReportData {
  license: {
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    issuedBy: string;
    issueDate: Date;
    expirationDate: Date;
    notes: string | null;
    isRenewed: boolean;
    renewalDate: Date | null;
    autoRenew: boolean;
    renewalHistory: string | null;
    status: string;
  };
  org: {
    name: string;
    tradeType: string;
    primaryState: string;
  };
  renewalHistory: Array<{
    date: string;
    notes: string;
    renewedBy: string;
  }>;
  ceRecords: Array<{
    courseName: string;
    provider: string;
    hoursEarned: number;
    hoursRequired: number;
    completionDate: Date;
    category: string;
  }>;
  documents: Array<{
    fileName: string;
    category: string;
    createdAt: Date;
  }>;
}

interface OrgReportData {
  org: {
    name: string;
    tradeType: string;
    primaryState: string;
  };
  licenses: Array<{
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    issuedBy: string;
    expirationDate: Date;
    status: string;
  }>;
  insurance: Array<{
    name: string;
    type: string;
    provider: string;
    expirationDate: Date;
    status: string;
  }>;
  ceRecords: Array<{
    courseName: string;
    hoursEarned: number;
    hoursRequired: number;
  }>;
  users: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  complianceScore: number;
}

// === Color Constants ===
const EMERALD: [number, number, number] = [16, 185, 129];
const EMERALD_DARK: [number, number, number] = [5, 150, 105];
const TEAL: [number, number, number] = [20, 184, 166];
const GRAY_100: [number, number, number] = [243, 244, 246];
const GRAY_400: [number, number, number] = [156, 163, 175];
const GRAY_500: [number, number, number] = [107, 114, 128];
const GRAY_600: [number, number, number] = [75, 85, 99];
const GRAY_900: [number, number, number] = [17, 24, 39];
const RED: [number, number, number] = [220, 38, 38];
const AMBER: [number, number, number] = [217, 119, 6];
const WHITE: [number, number, number] = [255, 255, 255];

// === Helper Functions ===

function formatDate(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatus(expirationDate: Date): string {
  const now = new Date();
  const exp = new Date(expirationDate);
  const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 60) return 'expiring_soon';
  return 'active';
}

function getDaysUntil(expirationDate: Date): number {
  const now = new Date();
  const exp = new Date(expirationDate);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'active': return EMERALD;
    case 'expiring_soon': return AMBER;
    case 'expired': return RED;
    default: return GRAY_500;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'expiring_soon': return 'Expiring Soon';
    case 'expired': return 'Expired';
    default: return status;
  }
}

function safeParseJSON(str: string | null): any[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

// === PDF Builder Class ===

class PdfBuilder {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private contentWidth: number;
  private y = 20;
  private currentPage = 1;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.margin;
  }

  private checkPageBreak(needed: number): boolean {
    if (this.y + needed > this.pageHeight - 30) {
      this.addFooter();
      this.doc.addPage();
      this.currentPage++;
      this.y = 20;
      return true;
    }
    return false;
  }

  private addText(
    text: string,
    x: number,
    yPos: number,
    options?: {
      fontSize?: number;
      fontStyle?: string;
      color?: [number, number, number];
      maxWidth?: number;
      align?: 'left' | 'center' | 'right';
    }
  ) {
    const fontSize = options?.fontSize || 10;
    const fontStyle = options?.fontStyle || 'normal';
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    if (options?.color) {
      this.doc.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }

    const textOptions: Record<string, unknown> = {};
    if (options?.maxWidth) textOptions.maxWidth = options.maxWidth;
    if (options?.align) textOptions.align = options.align;

    this.doc.text(text, x, yPos, textOptions);
  }

  private addLine(yPos: number) {
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
  }

  private addHeader(title: string, subtitle: string) {
    // Green gradient header bar
    this.doc.setFillColor(5, 150, 105);
    this.doc.rect(0, 0, this.pageWidth, 38, 'F');

    // Subtle gradient overlay
    this.doc.setFillColor(16, 185, 129);
    this.doc.rect(this.pageWidth * 0.6, 0, this.pageWidth * 0.4, 38, 'F');

    // Logo icon
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(this.margin, 8, 20, 20, 3, 3, 'F');
    this.doc.setTextColor(5, 150, 105);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LV', this.margin + 4.5, 21);

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(15);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 27, 18);

    // Subtitle
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(subtitle, this.margin + 27, 25);

    // Date
    this.doc.setFontSize(8);
    this.doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      this.pageWidth - this.margin,
      22,
      { align: 'right' }
    );

    this.y = 50;
  }

  private addSectionTitle(title: string) {
    this.checkPageBreak(25);
    this.addText(title, this.margin, this.y, {
      fontSize: 11,
      fontStyle: 'bold',
      color: EMERALD_DARK,
    });
    this.y += 7;
    this.addLine(this.y);
    this.y += 8;
  }

  private addKeyValueRow(
    label: string,
    value: string,
    highlight?: 'red' | 'amber' | 'green'
  ) {
    this.checkPageBreak(10);
    this.addText(label, this.margin, this.y, {
      fontSize: 9,
      color: GRAY_500,
    });
    const valueColor = highlight === 'red'
      ? RED
      : highlight === 'amber'
        ? AMBER
        : highlight === 'green'
          ? EMERALD
          : GRAY_900;
    const valueStyle = highlight ? 'bold' : 'normal';
    this.addText(value, this.margin + 72, this.y, {
      fontSize: 9,
      fontStyle: valueStyle,
      color: valueColor,
      maxWidth: this.contentWidth - 72,
    });
    this.y += 8;
  }

  private addInfoBlock(data: Array<{ label: string; value: string; highlight?: 'red' | 'amber' | 'green' }>) {
    // Light background card
    const startY = this.y - 2;
    const height = data.length * 8 + 8;
    this.checkPageBreak(height + 10);
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin, startY, this.contentWidth, height, 3, 3, 'F');
    this.doc.setDrawColor(229, 231, 235);
    this.doc.roundedRect(this.margin, startY, this.contentWidth, height, 3, 3, 'S');
    this.y += 4;
    for (const item of data) {
      this.addKeyValueRow(item.label, item.value, item.highlight);
    }
    this.y += 4;
  }

  private addTable(headers: string[], rows: string[][], colWidths: number[]) {
    this.checkPageBreak(30);

    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = this.margin;

    // Header row
    this.doc.setFillColor(5, 150, 105);
    this.doc.rect(startX, this.y - 4, tableWidth, 9, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');

    let xPos = startX + 3;
    for (let i = 0; i < headers.length; i++) {
      this.doc.text(headers[i], xPos, this.y + 1, { maxWidth: colWidths[i] - 6 });
      xPos += colWidths[i];
    }
    this.y += 8;

    // Data rows
    this.doc.setFont('helvetica', 'normal');
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      this.checkPageBreak(10);

      // Alternate row background
      if (rowIdx % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(startX, this.y - 4, tableWidth, 8, 'F');
      }

      // Determine row status color
      const lastCell = rows[rowIdx][rows[rowIdx].length - 1]?.toLowerCase() || '';
      let textColor: [number, number, number] = GRAY_900;
      if (lastCell.includes('expired')) textColor = RED;
      else if (lastCell.includes('expiring')) textColor = AMBER;
      else if (lastCell.includes('active')) textColor = EMERALD;

      xPos = startX + 3;
      for (let colIdx = 0; colIdx < rows[rowIdx].length; colIdx++) {
        const isLastCol = colIdx === rows[rowIdx].length - 1;
        this.doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        if (isLastCol && (lastCell.includes('expired') || lastCell.includes('expiring') || lastCell.includes('active'))) {
          this.doc.setFont('helvetica', 'bold');
        } else {
          this.doc.setFont('helvetica', 'normal');
        }
        this.doc.text(rows[rowIdx][colIdx], xPos, this.y, { maxWidth: colWidths[colIdx] - 6 });
        xPos += colWidths[colIdx];
      }
      this.y += 8;
    }
    this.y += 4;
  }

  private addStatusIndicator(status: string) {
    this.checkPageBreak(30);
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const days = status === 'active' ? '' :
      status === 'expired' ? ' - Immediate action required' :
      ' - Renewal needed soon';

    // Status badge background
    this.doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    this.doc.roundedRect(this.margin, this.y - 3, this.contentWidth, 18, 3, 3, 'F');

    // Status text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(statusText + days, this.margin + 8, this.y + 7);

    this.y += 24;
  }

  private addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(GRAY_400[0], GRAY_400[1], GRAY_400[2]);
    this.doc.text('Powered by License Vault', this.margin, footerY);

    this.doc.text(
      `Page ${this.currentPage}`,
      this.pageWidth - this.margin,
      footerY,
      { align: 'right' }
    );
  }

  private addFinalFooter() {
    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      const footerY = this.pageHeight - 15;
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(GRAY_400[0], GRAY_400[1], GRAY_400[2]);
      this.doc.text('Powered by License Vault', this.margin, footerY);
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth - this.margin,
        footerY,
        { align: 'right' }
      );
    }
  }

  getBuffer(): Buffer {
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  // === License Report ===

  generateLicenseReport(data: LicenseReportData) {
    const { license, org, renewalHistory, ceRecords, documents } = data;
    const status = getStatus(license.expirationDate);
    const daysLeft = getDaysUntil(license.expirationDate);
    const statusHighlight = status === 'expired' ? 'red' as const : status === 'expiring_soon' ? 'amber' as const : 'green' as const;

    // Header
    this.addHeader('License Compliance Report', org.name);

    // Organization Info
    this.addSectionTitle('ORGANIZATION INFORMATION');
    this.addInfoBlock([
      { label: 'Organization:', value: org.name },
      ...(org.tradeType ? [{ label: 'Trade Type:', value: org.tradeType }] : []),
      ...(org.primaryState ? [{ label: 'Primary State:', value: org.primaryState }] : []),
    ]);

    this.y += 4;

    // License Details
    this.addSectionTitle('LICENSE DETAILS');
    this.addInfoBlock([
      { label: 'License Name:', value: license.name },
      { label: 'License Type:', value: license.type.charAt(0).toUpperCase() + license.type.slice(1) },
      { label: 'License Number:', value: license.licenseNumber },
      { label: 'Issuing Authority:', value: license.issuedBy },
      { label: 'Issue Date:', value: formatDate(license.issueDate) },
      {
        label: 'Expiration Date:',
        value: formatDate(license.expirationDate),
        highlight: statusHighlight,
      },
      ...(license.notes ? [{ label: 'Notes:', value: license.notes }] : []),
    ]);

    this.y += 4;

    // Compliance Status
    this.addSectionTitle('COMPLIANCE STATUS');
    this.addStatusIndicator(status);
    this.addInfoBlock([
      { label: 'Status:', value: getStatusText(status), highlight: statusHighlight },
      {
        label: 'Days Until Expiration:',
        value: daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`,
        highlight: statusHighlight,
      },
      { label: 'Renewal Status:', value: license.isRenewed ? 'Renewed' : 'Not Renewed' },
      { label: 'Auto-Renew:', value: license.autoRenew ? 'Enabled' : 'Disabled' },
      ...(license.renewalDate ? [{ label: 'Last Renewed:', value: formatDate(license.renewalDate) }] : []),
    ]);

    this.y += 4;

    // Renewal History
    this.addSectionTitle('RENEWAL HISTORY');
    if (renewalHistory.length > 0) {
      this.addTable(
        ['Date', 'Renewed By', 'Notes'],
        renewalHistory.map((entry) => [
          formatDate(entry.date),
          entry.renewedBy || '-',
          entry.notes || '-',
        ]),
        [45, 55, this.contentWidth - 100]
      );
    } else {
      this.addText('No renewal history available.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    this.y += 4;

    // CE Tracking Summary
    this.addSectionTitle('CE TRACKING SUMMARY');
    if (ceRecords.length > 0) {
      const totalEarned = ceRecords.reduce((sum, r) => sum + r.hoursEarned, 0);
      const totalRequired = ceRecords.reduce((sum, r) => sum + r.hoursRequired, 0);

      this.addInfoBlock([
        { label: 'Total Courses:', value: `${ceRecords.length}` },
        { label: 'Hours Earned:', value: `${totalEarned}`, highlight: totalEarned >= totalRequired ? 'green' : 'amber' },
        { label: 'Hours Required:', value: `${totalRequired}` },
        { label: 'Remaining:', value: `${Math.max(0, totalRequired - totalEarned)}`, highlight: totalEarned >= totalRequired ? 'green' : 'amber' },
      ]);

      this.y += 4;

      this.addTable(
        ['Course', 'Provider', 'Hours', 'Date', 'Category'],
        ceRecords.map((r) => [
          r.courseName,
          r.provider,
          `${r.hoursEarned}h`,
          formatDate(r.completionDate),
          r.category,
        ]),
        [50, 40, 20, 40, this.contentWidth - 150]
      );
    } else {
      this.addText('No CE records on file.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    this.y += 4;

    // Document Inventory
    this.addSectionTitle('DOCUMENT INVENTORY');
    if (documents.length > 0) {
      this.addTable(
        ['Document Name', 'Category', 'Date Added'],
        documents.map((d) => [
          d.fileName,
          d.category,
          formatDate(d.createdAt),
        ]),
        [this.contentWidth * 0.5, this.contentWidth * 0.25, this.contentWidth * 0.25]
      );
    } else {
      this.addText('No documents on file.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    // Final footer on all pages
    this.addFinalFooter();

    return this.getBuffer();
  }

  // === Organization Report ===

  generateOrgComplianceReport(data: OrgReportData) {
    const { org, licenses, insurance, ceRecords, users, complianceScore } = data;

    // Header
    this.addHeader('Organization Compliance Report', org.name);

    // Executive Summary
    this.addSectionTitle('EXECUTIVE SUMMARY');

    const activeLicenses = licenses.filter((l) => l.status === 'active').length;
    const expiredLicenses = licenses.filter((l) => l.status === 'expired').length;
    const expiringLicenses = licenses.filter((l) => l.status === 'expiring_soon').length;
    const atRiskCount = expiredLicenses + expiringLicenses;

    // Compliance score badge
    const scoreColor: [number, number, number] = complianceScore >= 80
      ? EMERALD
      : complianceScore >= 60
        ? AMBER
        : RED;

    this.doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    this.doc.roundedRect(this.margin, this.y - 2, this.contentWidth, 22, 3, 3, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${complianceScore}%`, this.margin + 10, this.y + 10);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Compliance Score', this.margin + 10, this.y + 17);

    // Quick stats beside score
    const statsX = this.margin + 70;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${licenses.length}`, statsX, this.y + 5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Total Licenses', statsX, this.y + 10);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${atRiskCount}`, statsX + 45, this.y + 5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('At Risk', statsX + 45, this.y + 10);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${activeLicenses}`, statsX + 85, this.y + 5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Compliant', statsX + 85, this.y + 10);

    this.y += 28;

    this.y += 4;

    // License Status Overview
    this.addSectionTitle('LICENSE STATUS OVERVIEW');
    if (licenses.length > 0) {
      this.addTable(
        ['License Name', 'Type', 'License #', 'Expiration', 'Status'],
        licenses.map((l) => [
          l.name,
          l.type,
          l.licenseNumber,
          formatDate(l.expirationDate),
          getStatusText(l.status),
        ]),
        [45, 30, 35, 38, this.contentWidth - 148]
      );
    } else {
      this.addText('No licenses found.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    this.y += 4;

    // Insurance & Bonds Overview
    this.addSectionTitle('INSURANCE & BONDS OVERVIEW');
    if (insurance.length > 0) {
      this.addTable(
        ['Policy Name', 'Type', 'Provider', 'Expiration', 'Status'],
        insurance.map((i) => [
          i.name,
          i.type,
          i.provider,
          formatDate(i.expirationDate),
          getStatusText(i.status),
        ]),
        [45, 25, 40, 38, this.contentWidth - 148]
      );
    } else {
      this.addText('No insurance or bond records found.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    this.y += 4;

    // CE Compliance Summary
    this.addSectionTitle('CE COMPLIANCE SUMMARY');
    if (ceRecords.length > 0) {
      const totalEarned = ceRecords.reduce((sum, r) => sum + r.hoursEarned, 0);
      const totalRequired = ceRecords.reduce((sum, r) => sum + r.hoursRequired, 0);

      this.addInfoBlock([
        { label: 'Total CE Records:', value: `${ceRecords.length}` },
        { label: 'Total Hours Earned:', value: `${totalEarned}`, highlight: totalEarned >= totalRequired ? 'green' : 'amber' },
        { label: 'Total Hours Required:', value: `${totalRequired}` },
        { label: 'Remaining Hours:', value: `${Math.max(0, totalRequired - totalEarned)}`, highlight: totalEarned >= totalRequired ? 'green' : 'amber' },
      ]);
    } else {
      this.addText('No CE records found.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    this.y += 4;

    // At-Risk Items
    this.addSectionTitle('AT-RISK ITEMS');
    const atRiskLicenses = licenses.filter((l) => l.status === 'expired' || l.status === 'expiring_soon');
    const atRiskInsurance = insurance.filter((i) => i.status === 'expired' || i.status === 'expiring_soon');
    const allAtRisk = [
      ...atRiskLicenses.map((l) => ({
        name: l.name,
        type: 'License',
        expiration: l.expirationDate,
        status: l.status,
      })),
      ...atRiskInsurance.map((i) => ({
        name: i.name,
        type: i.type,
        expiration: i.expirationDate,
        status: i.status,
      })),
    ];

    if (allAtRisk.length > 0) {
      // Warning header
      this.doc.setFillColor(254, 243, 199);
      this.doc.roundedRect(this.margin, this.y - 3, this.contentWidth, 10, 2, 2, 'F');
      this.addText(`${allAtRisk.length} item(s) require attention`, this.margin + 5, this.y + 3, {
        fontSize: 9,
        fontStyle: 'bold',
        color: AMBER,
      });
      this.y += 12;

      this.addTable(
        ['Name', 'Type', 'Expiration', 'Status'],
        allAtRisk.map((item) => [
          item.name,
          item.type,
          formatDate(item.expiration),
          getStatusText(item.status),
        ]),
        [50, 30, 40, this.contentWidth - 120]
      );
    } else {
      this.doc.setFillColor(209, 250, 229);
      this.doc.roundedRect(this.margin, this.y - 3, this.contentWidth, 10, 2, 2, 'F');
      this.addText('All items are compliant. No at-risk items found.', this.margin + 5, this.y + 3, {
        fontSize: 9,
        fontStyle: 'bold',
        color: EMERALD,
      });
      this.y += 12;
    }

    this.y += 4;

    // Team Members
    this.addSectionTitle('TEAM MEMBERS');
    if (users.length > 0) {
      this.addTable(
        ['Name', 'Email', 'Role'],
        users.map((u) => [
          u.name || '-',
          u.email,
          u.role.charAt(0).toUpperCase() + u.role.slice(1),
        ]),
        [50, this.contentWidth * 0.45, this.contentWidth * 0.25]
      );
    } else {
      this.addText('No team members found.', this.margin, this.y, {
        fontSize: 9,
        color: GRAY_400,
      });
      this.y += 12;
    }

    // Final footer on all pages
    this.addFinalFooter();

    return this.getBuffer();
  }
}

// === Exported Functions ===

export function generateLicenseReport(data: LicenseReportData): Buffer {
  const builder = new PdfBuilder();
  return builder.generateLicenseReport(data);
}

export function generateOrgComplianceReport(data: OrgReportData): Buffer {
  const builder = new PdfBuilder();
  return builder.generateOrgComplianceReport(data);
}
