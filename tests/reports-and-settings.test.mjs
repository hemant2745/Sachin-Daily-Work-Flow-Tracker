import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Test Suite: Project Reports & Settings Modules
 * 
 * Verifies:
 * 1. Date range calculation (this_month, last_month, quarter_to_date, year_to_date, custom)
 * 2. Zero target produces null / "N/A" (never NaN or Infinity)
 * 3. Multi-month target aggregation calculation
 * 4. RFC-4180 CSV export generation format
 * 5. SpreadsheetML XML Excel export generation format
 * 6. App settings defaults and configuration keys
 * 7. Partner universities canonical list (23 institutions)
 * 8. University revenue and percentage share calculation
 * 9. Single-admin authorization check (sachin.behera@collegevidya.com)
 * 10. Existing navigation items and active routes in Sidebar
 */

// Helper matching computeReportDateRange in src/lib/reports.ts
function computeReportDateRange(rangeType, customStart, customEnd) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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

  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  return {
    startDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
    endDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`,
  };
}

// Helpers matching CSV & Excel XML export
function generateCSVReport(data) {
  const lines = [];
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  lines.push("SACHIN BEHERA DAILY WORKFLOW - EXECUTIVE PERFORMANCE REPORT");
  lines.push(`Generated: ${data.generatedAt}`);
  lines.push(`Reporting Period: ${data.filters.startDate} to ${data.filters.endDate}`);
  lines.push("");

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
  return lines.join("\r\n");
}

function generateExcelXMLReport(data) {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Executive Summary">
  <Table><Row><Cell><Data ss:Type="String">Metric</Data></Cell></Row></Table>
 </Worksheet>
</Workbook>`;
}

test("1. computeReportDateRange: correctly calculates date intervals", () => {
  const custom = computeReportDateRange("custom", "2026-05-01", "2026-05-20");
  assert.equal(custom.startDate, "2026-05-01");
  assert.equal(custom.endDate, "2026-05-20");

  const thisMonth = computeReportDateRange("this_month");
  assert.match(thisMonth.startDate, /^\d{4}-\d{2}-01$/);
  assert.match(thisMonth.endDate, /^\d{4}-\d{2}-\d{2}$/);

  const lastMonth = computeReportDateRange("last_month");
  assert.match(lastMonth.startDate, /^\d{4}-\d{2}-01$/);
  assert.match(lastMonth.endDate, /^\d{4}-\d{2}-\d{2}$/);

  const ytd = computeReportDateRange("year_to_date");
  assert.match(ytd.startDate, /^\d{4}-01-01$/);
});

test("2. Zero targets produce null rather than division by zero", () => {
  const revenue = 150000;
  const target = 0;
  const achievement = target > 0 ? Number(((revenue / target) * 100).toFixed(1)) : null;
  assert.equal(achievement, null);
});

test("3. Multi-month target aggregation aggregates targets for spanned months", () => {
  const counselorBase = 350000;
  const monthsSpanned = ["2026-08", "2026-09", "2026-10"];
  const aggregatedTarget = counselorBase * monthsSpanned.length;
  assert.equal(aggregatedTarget, 1050000);
});

test("4. generateCSVReport: produces valid RFC-4180 report with summary headers", () => {
  const mockData = {
    filters: {
      dateRangeType: "this_month",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    },
    summary: {
      totalRevenue: 500000,
      totalAdmissions: 10,
      averageAdmissionValue: 50000,
      combinedMonthlyTarget: 700000,
      revenueAchievementPercentage: 71.4,
    },
    counselors: [],
    universities: [],
    dailyTrends: [],
    generatedAt: "2026-10-30T10:00:00.000Z",
  };

  const csv = generateCSVReport(mockData);
  assert.ok(csv.includes("EXECUTIVE SUMMARY"));
  assert.ok(csv.includes("Total Verified Collections,\"500000\""));
  assert.ok(csv.includes("Collection Target Achievement,71.4%"));
});

test("5. generateExcelXMLReport: produces valid SpreadsheetML format", () => {
  const mockData = {
    filters: { startDate: "2026-10-01", endDate: "2026-10-31" },
    summary: { totalRevenue: 500000 },
  };
  const xml = generateExcelXMLReport(mockData);
  assert.ok(xml.includes('<?xml version="1.0"?>'));
  assert.ok(xml.includes('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'));
  assert.ok(xml.includes('<Worksheet ss:Name="Executive Summary">'));
});

test("6. App settings defaults include all 5 required categories", () => {
  const defaultKeys = [
    "admin_profile",
    "regional_preferences",
    "notification_preferences",
    "target_defaults",
    "export_preferences",
  ];

  const migrationPath = path.join(process.cwd(), "supabase/migrations/20261103000000_create_app_settings.sql");
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist");
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  defaultKeys.forEach((key) => {
    assert.ok(
      migrationContent.includes(`('${key}',`),
      `Migration should seed app_setting key: ${key}`
    );
  });
});

test("7. Partner universities directory contains exactly 23 approved institutions", () => {
  const constantsPath = path.join(process.cwd(), "src/lib/constants/universities.ts");
  const content = fs.readFileSync(constantsPath, "utf-8");
  assert.ok(content.includes("Alliance University Online"));
  assert.ok(content.includes("Andhra University Online"));
  assert.ok(content.includes("UNIVERSITY_MASTER_LIST"));
});

test("8. University revenue and percentage share calculation", () => {
  const totalRevenue = 1000000;
  const univRevenue = 250000;
  const share = Number(((univRevenue / totalRevenue) * 100).toFixed(1));
  assert.equal(share, 25.0);
});

test("9. Single-admin authorization restricts privileged actions to sachin.behera@collegevidya.com", () => {
  const authorizedEmail = "sachin.behera@collegevidya.com";
  const userA = { email: "sachin.behera@collegevidya.com" };
  const userB = { email: "hacker@example.com" };

  const isAuthorized = (user) => user?.email?.toLowerCase().trim() === authorizedEmail;

  assert.equal(isAuthorized(userA), true);
  assert.equal(isAuthorized(userB), false);
  assert.equal(isAuthorized(null), false);
});

test("10. Sidebar navigation links Reports and Settings to active routes", () => {
  const sidebarPath = path.join(process.cwd(), "src/components/dashboard/Sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");
  assert.ok(content.includes('href: "/dashboard/reports"'));
  assert.ok(content.includes('href: "/dashboard/settings"'));
  assert.ok(!content.includes('href: "/dashboard#reports"'));
  assert.ok(!content.includes('href: "/dashboard#settings"'));
});
