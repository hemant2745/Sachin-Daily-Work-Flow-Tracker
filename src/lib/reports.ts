import type {
  ReportDateRangeType,
  ReportFilterOptions,
  OverallPerformanceSummary,
  CounselorReportItem,
  UniversityReportItem,
  DailyTrendItem,
  ComprehensiveReportData,
} from "@/types/reports";
import { formatINR, normalizeMonthKey } from "./format";
import { getTodayIST } from "./projections";

/**
 * Computes exact start and end dates (YYYY-MM-DD) for a given date range filter in IST.
 */
export function computeReportDateRange(
  rangeType: ReportDateRangeType,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const todayStr = getTodayIST();
  const [yearStr, monthStr, dayStr] = todayStr.split("-");
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10); // 1-12

  if (rangeType === "custom" && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  if (rangeType === "last_month") {
    const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const lYear = lastMonthDate.getFullYear();
    const lMonth = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(lYear, lastMonthDate.getMonth() + 1, 0).getDate();
    return {
      startDate: `${lYear}-${lMonth}-01`,
      endDate: `${lYear}-${lMonth}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (rangeType === "quarter_to_date") {
    // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    const quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;
    const qMonthStr = String(quarterStartMonth).padStart(2, "0");
    return {
      startDate: `${currentYear}-${qMonthStr}-01`,
      endDate: todayStr,
    };
  }

  if (rangeType === "year_to_date") {
    return {
      startDate: `${currentYear}-01-01`,
      endDate: todayStr,
    };
  }

  // Default: this_month (1st of current month to end of month / today)
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  return {
    startDate: `${yearStr}-${monthStr}-01`,
    endDate: `${yearStr}-${monthStr}-${String(lastDayOfMonth).padStart(2, "0")}`,
  };
}

/**
 * Generates an RFC-4180 compliant CSV string for the comprehensive report.
 */
export function generateCSVReport(data: ComprehensiveReportData): string {
  const lines: string[] = [];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Header
  lines.push("SACHIN BEHERA DAILY WORKFLOW - EXECUTIVE PERFORMANCE REPORT");
  lines.push(`Generated: ${data.generatedAt}`);
  lines.push(`Reporting Period: ${data.filters.startDate} to ${data.filters.endDate}`);
  lines.push("");

  // Executive Summary Section
  lines.push("=== EXECUTIVE SUMMARY ===");
  lines.push("Metric,Value");
  lines.push(`Total Verified Collections,${escapeCSV(data.summary.totalRevenue)}`);
  lines.push(`Total Admissions Count,${escapeCSV(data.summary.totalAdmissions)}`);
  lines.push(`Average Admission Ticket Size,${escapeCSV(data.summary.averageAdmissionValue.toFixed(2))}`);
  lines.push(`Combined Collection Target,${escapeCSV(data.summary.combinedMonthlyTarget)}`);
  lines.push(
    `Collection Target Achievement,${
      data.summary.revenueAchievementPercentage !== null
        ? `${data.summary.revenueAchievementPercentage.toFixed(1)}%`
        : "N/A"
    }`
  );
  lines.push(`Combined Admission Target,${escapeCSV(data.summary.combinedAdmissionTarget)}`);
  lines.push(
    `Admission Target Achievement,${
      data.summary.admissionAchievementPercentage !== null
        ? `${data.summary.admissionAchievementPercentage.toFixed(1)}%`
        : "N/A"
    }`
  );
  lines.push(`Total Revenue Projected,${escapeCSV(data.summary.totalProjectedRevenue)}`);
  lines.push(
    `Primary Projection Completion (Met/Reviewed),${
      data.summary.projectionCompletionPercentage !== null
        ? `${data.summary.projectionCompletionPercentage.toFixed(1)}%`
        : "N/A"
    }`
  );
  lines.push(
    `Revenue-Weighted Projection Achievement,${
      data.summary.projectionRevenueWeightedPercentage !== null
        ? `${data.summary.projectionRevenueWeightedPercentage.toFixed(1)}%`
        : "N/A"
    }`
  );
  lines.push("");

  // Counsellor Performance Table
  lines.push("=== COUNSELLOR PERFORMANCE BREAKDOWN ===");
  lines.push(
    "Counselor Name,Employee Code,Collection Target,Actual Collections,Collection Ach %,Admission Target,Actual Admissions,Adm Ach %,Projections Total,Projections Met,Projections Not Met,Projections Pending,Projection Ach %,Revenue-Weighted %"
  );
  data.counselors.forEach((c) => {
    lines.push(
      [
        escapeCSV(c.name),
        escapeCSV(c.employee_code),
        c.collectionTarget,
        c.actualCollections,
        c.collectionAchievementPercentage !== null
          ? `${c.collectionAchievementPercentage.toFixed(1)}%`
          : "N/A",
        c.admissionTarget,
        c.actualAdmissions,
        c.admissionAchievementPercentage !== null
          ? `${c.admissionAchievementPercentage.toFixed(1)}%`
          : "N/A",
        c.projectionsTotal,
        c.projectionsMet,
        c.projectionsNotMet,
        c.projectionsPending,
        c.projectionCompletionPercentage !== null
          ? `${c.projectionCompletionPercentage.toFixed(1)}%`
          : "N/A",
        c.revenueWeightedPercentage !== null
          ? `${c.revenueWeightedPercentage.toFixed(1)}%`
          : "N/A",
      ].join(",")
    );
  });
  lines.push("");

  // University Distribution Table
  lines.push("=== UNIVERSITY REVENUE & ADMISSION DISTRIBUTION ===");
  lines.push("University,Admissions Count,Revenue Collected,Avg Value per Admission,% of Total Revenue,% of Total Admissions");
  data.universities.forEach((u) => {
    lines.push(
      [
        escapeCSV(u.universityName),
        u.admissionsCount,
        u.revenueCollected,
        u.averagePerAdmission.toFixed(2),
        `${u.percentageOfTotalRevenue.toFixed(1)}%`,
        `${u.percentageOfTotalAdmissions.toFixed(1)}%`,
      ].join(",")
    );
  });
  lines.push("");

  // Daily Trends Table
  lines.push("=== DAILY ACTIVITY LOG ===");
  lines.push("Date,Admissions Count,Revenue Collected,Projected Revenue");
  data.dailyTrends.forEach((d) => {
    lines.push([d.date, d.admissionsCount, d.revenueCollected, d.projectedRevenue].join(","));
  });

  return lines.join("\r\n");
}

/**
 * Generates an Excel-compatible Spreadsheet XML string.
 * Microsoft Excel opens this natively with styled headers, borders, and numbers.
 */
export function generateExcelXMLReport(data: ComprehensiveReportData): string {
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Color="#1E3A8A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#6B7280" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0"/>
  </Style>
  <Style ss:ID="Percentage">
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
 </Styles>
`;

  // Sheet 1: Summary & Counsellors
  const sheetContent = `
 <Worksheet ss:Name="Executive Summary">
  <Table ss:DefaultColumnWidth="120">
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">Sachin Behera Daily Workflow - Executive Report</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="SubTitle"><Data ss:Type="String">Period: ${data.filters.startDate} to ${data.filters.endDate} | Generated: ${data.generatedAt}</Data></Cell>
   </Row>
   <Row></Row>
   
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Collections (INR)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.summary.totalRevenue}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Admissions</Data></Cell>
    <Cell><Data ss:Type="Number">${data.summary.totalAdmissions}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Combined Collection Target</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${data.summary.combinedMonthlyTarget}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Target Achievement %</Data></Cell>
    <Cell><Data ss:Type="String">${data.summary.revenueAchievementPercentage !== null ? data.summary.revenueAchievementPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Projection Completion %</Data></Cell>
    <Cell><Data ss:Type="String">${data.summary.projectionCompletionPercentage !== null ? data.summary.projectionCompletionPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Revenue-Weighted Projection %</Data></Cell>
    <Cell><Data ss:Type="String">${data.summary.projectionRevenueWeightedPercentage !== null ? data.summary.projectionRevenueWeightedPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
   </Row>
   <Row></Row>

   <!-- Counsellors Table -->
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Counselor Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Emp Code</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Target Amount</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Actual Collections</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Collection Ach %</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Target Adm</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Actual Adm</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Adm Ach %</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proj Met</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proj Total</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proj Ach %</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue-Weighted %</Data></Cell>
   </Row>
   ${data.counselors.map((c) => `
   <Row>
    <Cell><Data ss:Type="String">${c.name}</Data></Cell>
    <Cell><Data ss:Type="String">${c.employee_code}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.collectionTarget}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.actualCollections}</Data></Cell>
    <Cell><Data ss:Type="String">${c.collectionAchievementPercentage !== null ? c.collectionAchievementPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.admissionTarget}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.actualAdmissions}</Data></Cell>
    <Cell><Data ss:Type="String">${c.admissionAchievementPercentage !== null ? c.admissionAchievementPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.projectionsMet}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.projectionsTotal}</Data></Cell>
    <Cell><Data ss:Type="String">${c.projectionCompletionPercentage !== null ? c.projectionCompletionPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
    <Cell><Data ss:Type="String">${c.revenueWeightedPercentage !== null ? c.revenueWeightedPercentage.toFixed(1) + "%" : "N/A"}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="University Breakdown">
  <Table ss:DefaultColumnWidth="150">
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">University</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Admissions</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue (INR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Avg per Admission</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">% of Total Revenue</Data></Cell>
   </Row>
   ${data.universities.map((u) => `
   <Row>
    <Cell><Data ss:Type="String">${u.universityName}</Data></Cell>
    <Cell><Data ss:Type="Number">${u.admissionsCount}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${u.revenueCollected}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${u.averagePerAdmission.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">${u.percentageOfTotalRevenue.toFixed(1)}%</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>
</Workbook>`;

  return xmlHeader + sheetContent;
}
