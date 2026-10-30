import type { CalculatedAPR, CallingPerformanceFormData } from "@/types/calling";

export const CALLING_TARGET_BENCHMARKS = {
  CALLS_MADE: 200,
  TALK_TIME_MINUTES: 90,
} as const;

/**
 * Calculates Call Achievement %, Talk-Time Achievement %, and APR %
 * Both metrics carry equal 50% weight.
 * Formula:
 *   Call Achievement % = (Calls Made / 200) * 100
 *   Talk-Time Achievement % = (Talk Time / 90) * 100
 *   APR % = (Call Achievement % + Talk-Time Achievement %) / 2
 *
 * Achievement is not capped at 100% and displays true overperformance.
 * Returned numbers are rounded to 2 decimal places.
 */
export function calculateAPR(callsMade: number, talkTimeMinutes: number): CalculatedAPR {
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

/**
 * Strict server-side and client-side validation for daily calling performance records
 */
export function validateCallingInput(data: Partial<CallingPerformanceFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
  calculated: CalculatedAPR;
} {
  const errors: Record<string, string> = {};

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

  // Calculate APR with authoritative formula
  const calculated = calculateAPR(callsMade || 0, talkTimeMinutes || 0);

  // Enforce mandatory reason if APR < 100%
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
