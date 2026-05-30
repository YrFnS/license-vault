import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';

function computeInsuranceStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

// GET: Generate a PDF compliance report
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can generate PDF reports.' },
        { status: 403 }
      );
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'compliance'; // compliance, licenses, insurance, ce, full
    const stateFilter = searchParams.get('state') || undefined;
    const licenseTypeFilter = searchParams.get('licenseType') || undefined;
    const startDateStr = searchParams.get('startDate') || undefined;
    const endDateStr = searchParams.get('endDate') || undefined;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const orgId = orgMember.orgId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // Get organization
    const org = await db.organization.findUnique({ where: { id: orgId } });

    // Build license where clause with filters
    const licenseWhere: any = { orgId };
    if (stateFilter && stateFilter !== 'all') {
      licenseWhere.state = stateFilter;
    }
    if (licenseTypeFilter && licenseTypeFilter !== 'all') {
      licenseWhere.type = licenseTypeFilter;
    }
    if (startDate || endDate) {
      licenseWhere.expirationDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    // Get filtered licenses
    const licenses = await db.license.findMany({
      where: licenseWhere,
      orderBy: { expirationDate: 'asc' },
    });

    // Build insurance where clause with filters
    const insuranceWhere: any = { orgId };
    if (startDate || endDate) {
      insuranceWhere.expirationDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    // Get filtered insurance/bonds
    const insuranceBonds = await db.insuranceBond.findMany({
      where: insuranceWhere,
      orderBy: { expirationDate: 'asc' },
    });

    // Get filtered CE tracking
    const ceWhere: any = { orgId };
    if (startDate || endDate) {
      ceWhere.completionDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }
    const ceTrackings = await db.cETracking.findMany({
      where: ceWhere,
    });

    // Calculate stats
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter((l) => l.expirationDate > thirtyDaysFromNow).length;
    const expiringLicenses = licenses.filter((l) => l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow).length;
    const expiredLicenses = licenses.filter((l) => l.expirationDate < now).length;
    const complianceScore = totalLicenses > 0 ? Math.round(((totalLicenses - expiredLicenses) / totalLicenses) * 100) : 100;

    const activeInsurance = insuranceBonds.filter((ib) => computeInsuranceStatus(ib.expirationDate) === 'active');
    const totalCoverage = activeInsurance.reduce((sum, ib) => sum + ib.coverageAmount, 0);
    const totalPremium = activeInsurance.reduce((sum, ib) => sum + ib.premiumAmount, 0);

    const totalCEHoursEarned = ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
    const totalCEHoursRequired = ceTrackings.reduce((sum, ce) => sum + ce.hoursRequired, 0);

    const expiringItemsLicenses = licenses.filter((l) => l.expirationDate >= now && l.expirationDate <= ninetyDaysFromNow);
    const expiringItemsInsurance = insuranceBonds.filter((ib) => ib.expirationDate >= now && ib.expirationDate <= ninetyDaysFromNow);

    // Generate recommendations
    const recommendations: string[] = [];
    if (expiredLicenses > 0) {
      recommendations.push(`${expiredLicenses} expired license(s) need immediate renewal to restore compliance.`);
    }
    if (expiringLicenses > 0) {
      recommendations.push(`${expiringLicenses} license(s) expiring within 30 days - initiate renewal process now.`);
    }
    if (complianceScore < 80) {
      recommendations.push('Compliance score is below 80%. Focus on renewing expired and expiring licenses.');
    }
    if (totalCEHoursRequired > 0 && totalCEHoursEarned < totalCEHoursRequired) {
      recommendations.push(`CE hours deficit: ${totalCEHoursRequired - totalCEHoursEarned} hours still needed.`);
    }
    if (activeInsurance.length === 0 && insuranceBonds.length > 0) {
      recommendations.push('No active insurance policies found. Renew or add active coverage.');
    }
    if (recommendations.length === 0) {
      recommendations.push('All systems are compliant. Continue monitoring expiration dates.');
    }

    // Build PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let y = 0;

    // Helper: add page footer
    const addFooter = (pageNum: number) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`LicenseVault Compliance Report - ${org?.name || 'Organization'}`, margin, pageHeight - 8);
      doc.text(`Page ${pageNum}`, pageWidth - margin - 10, pageHeight - 8);
    };

    // ===== COVER PAGE =====
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 100, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    const reportTypeLabels: Record<string, string> = {
      compliance: 'Compliance Report',
      licenses: 'License Status Report',
      insurance: 'Insurance Status Report',
      ce: 'CE Tracking Report',
      full: 'Full Audit Report',
    };
    doc.text(reportTypeLabels[reportType] || 'Compliance Report', margin, 40);
    doc.setFontSize(16);
    doc.text(org?.name || 'Organization', margin, 55);
    doc.setFontSize(11);
    doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 70);

    // Show applied filters on cover page
    const filterLines: string[] = [];
    if (stateFilter && stateFilter !== 'all') filterLines.push(`State: ${stateFilter}`);
    if (licenseTypeFilter && licenseTypeFilter !== 'all') filterLines.push(`License Type: ${licenseTypeFilter}`);
    if (startDateStr) filterLines.push(`From: ${new Date(startDateStr).toLocaleDateString()}`);
    if (endDateStr) filterLines.push(`To: ${new Date(endDateStr).toLocaleDateString()}`);
    if (filterLines.length > 0) {
      doc.setFontSize(9);
      doc.text(`Filters: ${filterLines.join(' | ')}`, margin, 80);
    }

    // Compliance score circle
    doc.setFontSize(40);
    doc.text(`${complianceScore}%`, pageWidth - margin - 30, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Compliance', pageWidth - margin - 30, 58, { align: 'center' });

    // Reset text color
    doc.setTextColor(50, 50, 50);
    y = 115;

    // Quick summary boxes
    doc.setFontSize(10);
    const summaryData = [
      { label: 'Total Licenses', value: totalLicenses.toString() },
      { label: 'Active', value: activeLicenses.toString() },
      { label: 'Expiring Soon', value: expiringLicenses.toString() },
      { label: 'Expired', value: expiredLicenses.toString() },
    ];
    const boxWidth = contentWidth / 4;
    summaryData.forEach((item, i) => {
      const bx = margin + i * boxWidth;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(bx, y, boxWidth - 3, 25, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(item.label, bx + boxWidth / 2 - 1.5, y + 9, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(50);
      doc.text(item.value, bx + boxWidth / 2 - 1.5, y + 20, { align: 'center' });
    });
    y += 35;

    addFooter(1);

    // ===== PAGE 2: EXECUTIVE SUMMARY =====
    doc.addPage();
    let pageNum = 2;
    y = margin;

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Executive Summary', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(50);
    const summaryLines = [
      `Organization: ${org?.name || 'N/A'}`,
      `Trade Type: ${org?.tradeType || 'N/A'}`,
      `Primary State: ${org?.primaryState || 'N/A'}`,
      '',
      `Compliance Score: ${complianceScore}%`,
      `Total Licenses: ${totalLicenses} (Active: ${activeLicenses}, Expiring: ${expiringLicenses}, Expired: ${expiredLicenses})`,
      '',
      `Insurance & Bonds: ${insuranceBonds.length} total (${activeInsurance.length} active)`,
      `Total Coverage: $${totalCoverage.toLocaleString()}`,
      `Total Premium: $${totalPremium.toLocaleString()}`,
      '',
      `CE Tracking: ${ceTrackings.length} records`,
      `CE Hours Earned: ${totalCEHoursEarned} / Required: ${totalCEHoursRequired}`,
    ];
    summaryLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 5;

    // ===== LICENSE STATUS TABLE =====
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('License Status', margin, y);
    y += 8;

    if (licenses.length > 0) {
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text('Name', margin + 2, y + 5.5);
      doc.text('Type', margin + 55, y + 5.5);
      doc.text('Number', margin + 85, y + 5.5);
      doc.text('Status', margin + 120, y + 5.5);
      doc.text('Expiration', margin + 150, y + 5.5);
      y += 9;

      doc.setFontSize(7);
      doc.setTextColor(50);
      licenses.forEach((license) => {
        if (y > pageHeight - 20) {
          addFooter(pageNum);
          doc.addPage();
          pageNum++;
          y = margin;
          // Repeat header
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y, contentWidth, 8, 'F');
          doc.setFontSize(8);
          doc.setTextColor(80);
          doc.text('Name', margin + 2, y + 5.5);
          doc.text('Type', margin + 55, y + 5.5);
          doc.text('Number', margin + 85, y + 5.5);
          doc.text('Status', margin + 120, y + 5.5);
          doc.text('Expiration', margin + 150, y + 5.5);
          y += 9;
          doc.setFontSize(7);
          doc.setTextColor(50);
        }

        let status = 'Active';
        if (license.expirationDate < now) status = 'Expired';
        else if (license.expirationDate <= thirtyDaysFromNow) status = 'Expiring';

        const name = license.name.length > 28 ? license.name.substring(0, 28) + '...' : license.name;
        const type = license.type.length > 15 ? license.type.substring(0, 15) : license.type;
        const num = license.licenseNumber.length > 15 ? license.licenseNumber.substring(0, 15) : license.licenseNumber;

        doc.text(name, margin + 2, y + 4);
        doc.text(type, margin + 55, y + 4);
        doc.text(num, margin + 85, y + 4);
        doc.text(status, margin + 120, y + 4);
        doc.text(license.expirationDate.toLocaleDateString(), margin + 150, y + 4);

        y += 6;
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('No licenses found.', margin, y + 4);
      y += 10;
    }
    y += 5;

    // ===== INSURANCE & BOND SUMMARY =====
    if (y > pageHeight - 60) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Insurance & Bond Summary', margin, y);
    y += 8;

    if (insuranceBonds.length > 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text('Name', margin + 2, y + 5.5);
      doc.text('Type', margin + 50, y + 5.5);
      doc.text('Provider', margin + 70, y + 5.5);
      doc.text('Coverage', margin + 110, y + 5.5);
      doc.text('Status', margin + 145, y + 5.5);
      doc.text('Expiration', margin + 165, y + 5.5);
      y += 9;

      doc.setFontSize(7);
      doc.setTextColor(50);
      insuranceBonds.forEach((ib) => {
        if (y > pageHeight - 20) {
          addFooter(pageNum);
          doc.addPage();
          pageNum++;
          y = margin;
        }

        const status = computeInsuranceStatus(ib.expirationDate);
        const name = ib.name.length > 24 ? ib.name.substring(0, 24) + '...' : ib.name;
        const provider = ib.provider.length > 18 ? ib.provider.substring(0, 18) + '...' : ib.provider;

        doc.text(name, margin + 2, y + 4);
        doc.text(ib.type, margin + 50, y + 4);
        doc.text(provider, margin + 70, y + 4);
        doc.text(`$${ib.coverageAmount.toLocaleString()}`, margin + 110, y + 4);
        doc.text(status === 'expiring_soon' ? 'Expiring' : status.charAt(0).toUpperCase() + status.slice(1), margin + 145, y + 4);
        doc.text(ib.expirationDate.toLocaleDateString(), margin + 165, y + 4);
        y += 6;
      });

      // COI compliance summary
      y += 5;
      doc.setFontSize(10);
      doc.setTextColor(50);
      const coiRecords = insuranceBonds.filter((ib) => ib.type === 'insurance' || ib.type === 'certificate');
      if (coiRecords.length > 0) {
        const coiCompliant = coiRecords.filter((ib) => {
          const endorsements: string[] = (() => {
            try { const p = JSON.parse(ib.endorsementTypes || '[]'); return Array.isArray(p) ? p : []; } catch { return []; }
          })();
          return ib.additionalInsured && ib.primaryNoncontrib && ib.waiverSubrogation && endorsements.length > 0;
        }).length;
        doc.text(`COI Compliance: ${coiCompliant}/${coiRecords.length} records fully compliant`, margin, y);
        y += 7;
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('No insurance or bond records found.', margin, y + 4);
      y += 10;
    }
    y += 5;

    // ===== CE COMPLIANCE =====
    if (y > pageHeight - 50) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('CE Compliance', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Total CE Records: ${ceTrackings.length}`, margin, y);
    y += 6;
    doc.text(`Total Hours Earned: ${totalCEHoursEarned}`, margin, y);
    y += 6;
    doc.text(`Total Hours Required: ${totalCEHoursRequired}`, margin, y);
    y += 6;
    if (totalCEHoursRequired > 0) {
      const cePercent = Math.round((totalCEHoursEarned / totalCEHoursRequired) * 100);
      doc.text(`CE Completion: ${cePercent}%`, margin, y);
    }
    y += 10;

    // ===== EXPIRING ITEMS =====
    if (y > pageHeight - 50) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Expiring Items (Next 90 Days)', margin, y);
    y += 8;

    const allExpiring = [
      ...expiringItemsLicenses.map((l) => ({ name: l.name, type: `License: ${l.type}`, expirationDate: l.expirationDate })),
      ...expiringItemsInsurance.map((ib) => ({ name: ib.name, type: `${ib.type}`, expirationDate: ib.expirationDate })),
    ].sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());

    if (allExpiring.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(50);
      allExpiring.forEach((item) => {
        if (y > pageHeight - 20) {
          addFooter(pageNum);
          doc.addPage();
          pageNum++;
          y = margin;
        }
        const daysLeft = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        doc.text(`${item.name} (${item.type}) - Expires ${item.expirationDate.toLocaleDateString()} (${daysLeft} days)`, margin, y);
        y += 6;
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('No items expiring within 90 days.', margin, y);
      y += 8;
    }
    y += 5;

    // ===== RECOMMENDATIONS =====
    if (y > pageHeight - 50) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Recommendations', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(50);
    recommendations.forEach((rec, i) => {
      if (y > pageHeight - 20) {
        addFooter(pageNum);
        doc.addPage();
        pageNum++;
        y = margin;
      }
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, contentWidth - 5);
      lines.forEach((line: string) => {
        doc.text(line, margin + 3, y);
        y += 5;
      });
      y += 2;
    });

    addFooter(pageNum);

    // Return PDF
    const pdfBuffer = doc.output('arraybuffer');
    const filename = `compliance-report-${org?.name?.replace(/\s+/g, '-').toLowerCase() || 'org'}-${now.toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Generate PDF report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
