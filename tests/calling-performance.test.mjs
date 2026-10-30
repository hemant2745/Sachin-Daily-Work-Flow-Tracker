import test from "node:test";
import assert from "node:assert/strict";

/**
 * Test Suite: Counsellor Daily Calling Performance and APR Calculations
 * 
 * Verifies:
 * 1. Benchmark constants: 200 calls, 90 minutes talk time
 * 2. Exact benchmark APR formula: (Calls/200 * 100 + TalkTime/90 * 100) / 2
 * 3. Equal 50/50 weighting of calls and talk time
 * 4. User example: 180 calls (90%), 81 mins (90%) => APR 90.00%
 * 5. Overperformance: not capped at 100% (e.g., 250 calls, 135 mins)
 * 6. APR >= 100% is acceptable; APR < 100% requires mandatory reason
 * 7. Calls connected cannot exceed calls made
 * 8. Missing counselor or checkpoint date is rejected
 * 9. Negative calls, talk time, follow-ups, or admissions are rejected
 * 10. Rounding to 2 decimal places
 */

const CALLING_TARGET_BENCHMARKS = {
  CALLS_MADE: 200,
  TALK_TIME_MINUTES: 90,
};

function calculateAPR(callsMade, talkTimeMinutes) {
  const safeCalls = Math.max(0, Number(callsMade) || 0);
  const safeTalkTime = Math.max(0, Number(talkTimeMinutes) || 0);

  const callAchievementPercent = Number(
    ((safeCalls / CALLING_TARGET_BENCHMARKS.CALLS_MADE) * 100).toFixed(2)
  );

  const talkTimeAchievementPercent = Number(
    ((safeTalkTime / CALLING_TARGET_BENCHMARKS.TALK_TIME_MINUTES) * 100).toFixed(2)
  );

  const aprPercent = Number(
    ((callAchievementPercent + talkTimeAchievementPercent) / 2).toFixed(2)
  );

  return {
    callAchievementPercent,
    talkTimeAchievementPercent,
    aprPercent,
    isAcceptable: aprPercent >= 100,
  };
}

function validateCallingInput(data) {
  const errors = {};

  if (!data.counselor_id || !data.counselor_id.trim()) {
    errors.counselor_id = "Counsellor selection is required.";
  }

  if (!data.checkpoint_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.checkpoint_date)) {
    errors.checkpoint_date = "A valid checkpoint date (YYYY-MM-DD) is required.";
  }

  const callsMade = Number(data.calls_made);
  if (isNaN(callsMade) || callsMade < 0 || !Number.isInteger(callsMade)) {
    errors.calls_made = "Total calls made must be a non-negative integer (>= 0).";
  }

  const callsConnected = Number(data.calls_connected);
  if (isNaN(callsConnected) || callsConnected < 0 || !Number.isInteger(callsConnected)) {
    errors.calls_connected = "Calls connected must be a non-negative integer (>= 0).";
  } else if (!errors.calls_made && callsConnected > callsMade) {
    errors.calls_connected = "Calls connected cannot exceed total calls made.";
  }

  const talkTimeMinutes = Number(data.talk_time_minutes);
  if (isNaN(talkTimeMinutes) || talkTimeMinutes < 0) {
    errors.talk_time_minutes = "Talk time must be a non-negative number of minutes.";
  }

  const followUps = Number(data.follow_ups);
  if (isNaN(followUps) || followUps < 0 || !Number.isInteger(followUps)) {
    errors.follow_ups = "Follow-ups must be a non-negative integer (>= 0).";
  }

  const admissions = Number(data.admissions_converted);
  if (isNaN(admissions) || admissions < 0 || !Number.isInteger(admissions)) {
    errors.admissions_converted = "Admissions converted must be a non-negative integer (>= 0).";
  }

  const calculated = calculateAPR(callsMade || 0, talkTimeMinutes || 0);

  if (!calculated.isAcceptable) {
    if (!data.apr_reason || !data.apr_reason.trim()) {
      errors.apr_reason =
        "APR is below 100%. A valid reason for underperformance is strictly mandatory.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    calculated,
  };
}

test("1. Benchmark constants are strictly 200 calls and 90 minutes", () => {
  assert.equal(CALLING_TARGET_BENCHMARKS.CALLS_MADE, 200);
  assert.equal(CALLING_TARGET_BENCHMARKS.TALK_TIME_MINUTES, 90);
});

test("2. Exact user example: 180 calls, 81 minutes talk time produces 90.00% APR", () => {
  const result = calculateAPR(180, 81);
  assert.equal(result.callAchievementPercent, 90.0);
  assert.equal(result.talkTimeAchievementPercent, 90.0);
  assert.equal(result.aprPercent, 90.0);
  assert.equal(result.isAcceptable, false);
});

test("3. Equal 50/50 weighting: 200 calls (100%) and 45 mins (50%) produces 75.00% APR", () => {
  const result = calculateAPR(200, 45);
  assert.equal(result.callAchievementPercent, 100.0);
  assert.equal(result.talkTimeAchievementPercent, 50.0);
  assert.equal(result.aprPercent, 75.0);
  assert.equal(result.isAcceptable, false);
});

test("4. Overperformance is not capped at 100%", () => {
  const result = calculateAPR(250, 135);
  assert.equal(result.callAchievementPercent, 125.0);
  assert.equal(result.talkTimeAchievementPercent, 150.0);
  assert.equal(result.aprPercent, 137.5);
  assert.equal(result.isAcceptable, true);
});

test("5. Exactly 100% APR is acceptable", () => {
  const result = calculateAPR(200, 90);
  assert.equal(result.callAchievementPercent, 100.0);
  assert.equal(result.talkTimeAchievementPercent, 100.0);
  assert.equal(result.aprPercent, 100.0);
  assert.equal(result.isAcceptable, true);
});

test("6. APR below 100% strictly requires mandatory reason", () => {
  const underWithoutReason = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: 150,
    calls_connected: 50,
    talk_time_minutes: 60,
    follow_ups: 10,
    admissions_converted: 1,
    apr_reason: "",
  });
  assert.equal(underWithoutReason.isValid, false);
  assert.ok(underWithoutReason.errors.apr_reason);

  const underWithReason = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: 150,
    calls_connected: 50,
    talk_time_minutes: 60,
    follow_ups: 10,
    admissions_converted: 1,
    apr_reason: "Low call volume due to telephony server downtime",
  });
  assert.equal(underWithReason.isValid, true);
});

test("7. APR >= 100% does NOT require mandatory reason", () => {
  const acceptable = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: 200,
    calls_connected: 80,
    talk_time_minutes: 90,
    follow_ups: 15,
    admissions_converted: 2,
    apr_reason: "",
  });
  assert.equal(acceptable.isValid, true);
});

test("8. Calls connected cannot exceed calls made", () => {
  const invalid = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: 100,
    calls_connected: 120,
    talk_time_minutes: 90,
    follow_ups: 5,
    admissions_converted: 1,
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.calls_connected);
});

test("9. Missing counselor or date is rejected", () => {
  const missingCounselor = validateCallingInput({
    counselor_id: "",
    checkpoint_date: "2026-10-30",
    calls_made: 200,
    calls_connected: 80,
    talk_time_minutes: 90,
  });
  assert.equal(missingCounselor.isValid, false);
  assert.ok(missingCounselor.errors.counselor_id);

  const missingDate = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "",
    calls_made: 200,
    calls_connected: 80,
    talk_time_minutes: 90,
  });
  assert.equal(missingDate.isValid, false);
  assert.ok(missingDate.errors.checkpoint_date);
});

test("10. Negative values are rejected", () => {
  const negativeCalls = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: -10,
    calls_connected: 0,
    talk_time_minutes: 90,
  });
  assert.equal(negativeCalls.isValid, false);
  assert.ok(negativeCalls.errors.calls_made);

  const negativeTalk = validateCallingInput({
    counselor_id: "c-1",
    checkpoint_date: "2026-10-30",
    calls_made: 200,
    calls_connected: 50,
    talk_time_minutes: -5,
  });
  assert.equal(negativeTalk.isValid, false);
  assert.ok(negativeTalk.errors.talk_time_minutes);
});
