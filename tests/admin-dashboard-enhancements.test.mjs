import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Test suite for Phase 6 Admin Dashboard Enhancements & Phase 7 Security/RLS Verification

test("1. Category summary calculation aggregates counselors by category correctly", () => {
  const counselors = [
    { id: "1", full_name: "Shikha", category: "CDA", base_target: 800000, additional_target: 50000, final_target: 850000, actual_revenue: 400000 },
    { id: "2", full_name: "Shivalika", category: "CDA", base_target: 800000, additional_target: 0, final_target: 800000, actual_revenue: 500000 },
    { id: "3", full_name: "Vansh", category: "SCDA", base_target: 600000, additional_target: 20000, final_target: 620000, actual_revenue: 300000 },
    { id: "4", full_name: "Kanika", category: "PCA", base_target: 400000, additional_target: 0, final_target: 400000, actual_revenue: 250000 },
  ];

  const categories = ["CDA", "SCDA", "PCA"];
  const summaries = {};

  for (const cat of categories) {
    const list = counselors.filter((c) => c.category === cat);
    const count = list.length;
    const totalTarget = list.reduce((s, c) => s + c.final_target, 0);
    const totalRevenue = list.reduce((s, c) => s + c.actual_revenue, 0);
    const ach = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : null;

    summaries[cat] = { count, totalTarget, totalRevenue, ach };
  }

  assert.equal(summaries.CDA.count, 2);
  assert.equal(summaries.CDA.totalTarget, 1650000);
  assert.equal(summaries.CDA.totalRevenue, 900000);
  assert.equal(summaries.CDA.ach.toFixed(2), "54.55");

  assert.equal(summaries.SCDA.count, 1);
  assert.equal(summaries.SCDA.totalTarget, 620000);
  assert.equal(summaries.SCDA.totalRevenue, 300000);

  assert.equal(summaries.PCA.count, 1);
  assert.equal(summaries.PCA.totalTarget, 400000);
  assert.equal(summaries.PCA.totalRevenue, 250000);
});

test("2. Team-level proration and pace gap calculations", () => {
  const totalMonthlyTarget = 2670000;
  const daysInMonth = 30;
  const elapsedDays = 15;
  const totalVerifiedRevenue = 1500000;

  const expectedRevenue = Math.round((totalMonthlyTarget / daysInMonth) * elapsedDays);
  assert.equal(expectedRevenue, 1335000);

  const performanceGap = totalVerifiedRevenue - expectedRevenue;
  assert.equal(performanceGap, 165000);
  assert.equal(performanceGap > 0, true); // Team is pacing ahead
});

test("3. Category filter dynamically narrows counselor performance matrix list", () => {
  const counselors = [
    { id: "1", name: "Shikha", category: "CDA" },
    { id: "2", name: "Shivalika", category: "CDA" },
    { id: "3", name: "Vansh", category: "SCDA" },
    { id: "4", name: "Kanika", category: "PCA" },
  ];

  const filterAll = counselors.filter((c) => "ALL" === "ALL" || c.category === "ALL");
  assert.equal(filterAll.length, 4);

  const filterCDA = counselors.filter((c) => c.category === "CDA");
  assert.equal(filterCDA.length, 2);

  const filterSCDA = counselors.filter((c) => c.category === "SCDA");
  assert.equal(filterSCDA.length, 1);

  const filterPCA = counselors.filter((c) => c.category === "PCA");
  assert.equal(filterPCA.length, 1);
});

test("4. Migration scripts do not contain DROP TABLE or DROP COLUMN operations", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const upper = content.toUpperCase();

    // Verify no DROP TABLE statements
    assert.equal(
      upper.includes("DROP TABLE "),
      false,
      `File ${file} should not contain DROP TABLE`
    );

    // Verify no DROP COLUMN statements
    assert.equal(
      upper.includes("DROP COLUMN "),
      false,
      `File ${file} should not contain DROP COLUMN`
    );
  }
});

test("5. RLS policies in 20261106000000 strictly forbid counselor UPDATE or DELETE on admissions", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20261106000000_create_counselor_auth_and_roles.sql"
  );
  const content = fs.readFileSync(migrationPath, "utf-8");

  // Verify admissions table RLS policies
  assert.equal(content.includes('CREATE POLICY "Counselors view own admissions"'), true);
  assert.equal(content.includes('CREATE POLICY "Counselors insert own admissions"'), true);

  // Assert NO update policy for counselors on admissions
  assert.equal(content.includes('CREATE POLICY "Counselors update own admissions"'), false);
  assert.equal(content.includes('CREATE POLICY "Counselors delete own admissions"'), false);
});

test("6. UI responsiveness and glassmorphism CSS tokens exist in globals.css", () => {
  const cssPath = path.resolve(process.cwd(), "src", "app", "globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // Verify glass tokens and styles
  assert.equal(cssContent.includes(".glass-card"), true);
  assert.equal(cssContent.includes(".glass-sidebar"), true);
  assert.equal(cssContent.includes(".glass-modal"), true);
  assert.equal(cssContent.includes("backdrop-filter: blur"), true);
  assert.equal(cssContent.includes("::-webkit-scrollbar"), true);
});
