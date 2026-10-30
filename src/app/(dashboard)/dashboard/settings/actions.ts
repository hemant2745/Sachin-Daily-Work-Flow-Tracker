"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateSessionAccess } from "@/lib/auth/admin";
import type {
  AppSettings,
  AdminProfileSettings,
  RegionalPreferences,
  NotificationPreferences,
  TargetDefaults,
  ExportPreferences,
  SystemInfo,
} from "@/types/settings";
import { UNIVERSITY_MASTER_LIST } from "@/lib/constants/universities";

/**
 * Ensures caller is an authorized administrator before executing server action
 */
async function verifyAdminAuth() {
  if (!isSupabaseConfigured()) {
    return {
      isAuthorized: false,
      isConfigured: false,
      error: "Supabase database credentials are not configured in .env.local yet.",
    };
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Unauthorized: Active administrator session required.",
      };
    }

    const evaluation = evaluateSessionAccess(data.user);
    if (!evaluation.isAuthorized) {
      return {
        isAuthorized: false,
        isConfigured: true,
        error: "Access denied: Account is not authorized as an administrator.",
      };
    }

    return {
      isAuthorized: true,
      isConfigured: true,
      supabase,
      user: data.user,
    };
  } catch (err: any) {
    return {
      isAuthorized: false,
      isConfigured: true,
      error: "Authentication service error: " + (err?.message || "Failed to verify session."),
    };
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  admin_profile: {
    name: "Sachin Behera",
    email: "sachin.behera@collegevidya.com",
    role: "Team Leader & Admissions Administrator",
    organization: "College Vidya",
  },
  regional_preferences: {
    timezone: "Asia/Kolkata",
    timezone_label: "IST (Indian Standard Time, UTC+05:30)",
    currency: "INR",
    currency_symbol: "₹",
    date_format: "DD/MM/YYYY",
  },
  notification_preferences: {
    offsets: [-60, -30, -15, 15, 30, 60],
    sender_email: "onboarding@resend.dev",
    recipient_fallback: "sachin.behera@collegevidya.com",
    frequency: "hourly_cron",
  },
  target_defaults: {
    default_collection_target: 350000,
    default_admission_target: 7,
    team_target_amount: 3500000,
    team_target_admissions: 70,
  },
  export_preferences: {
    default_format: "xlsx",
    include_audit_stamps: true,
    csv_delimiter: ",",
  },
};

/**
 * Fetch all application settings from app_settings table in Supabase.
 * Returns default configuration if table rows don't exist yet.
 */
export async function getAppSettingsAction(): Promise<{
  success: boolean;
  isConfigured: boolean;
  settings: AppSettings;
  systemInfo: SystemInfo;
  error?: string;
}> {
  const auth = await verifyAdminAuth();

  const systemInfo: SystemInfo = {
    appName: "Sachin Daily Work Flow Tracker",
    version: "2.5.0",
    framework: "Next.js 14 App Router & TypeScript",
    nodeEnv: process.env.NODE_ENV || "development",
    authorizedAdmin: "sachin.behera@collegevidya.com",
    databaseStatus: auth.isConfigured ? (auth.supabase ? "connected" : "disconnected") : "disconnected",
    schedulerStatus: "Vercel Cron Active (1/day) & External Minute Webhook Ready",
  };

  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      isConfigured: auth.isConfigured,
      settings: DEFAULT_SETTINGS,
      systemInfo,
      error: auth.error,
    };
  }

  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value");

    if (error) {
      // If table does not exist or error reading, return fallback defaults
      return {
        success: true,
        isConfigured: true,
        settings: DEFAULT_SETTINGS,
        systemInfo,
      };
    }

    const loadedSettings: AppSettings = { ...DEFAULT_SETTINGS };

    if (data && data.length > 0) {
      data.forEach((row) => {
        if (row.key in loadedSettings) {
          (loadedSettings as any)[row.key] = {
            ...(loadedSettings as any)[row.key],
            ...row.value,
          };
        }
      });
    }

    return {
      success: true,
      isConfigured: true,
      settings: loadedSettings,
      systemInfo,
    };
  } catch (err: any) {
    return {
      success: true,
      isConfigured: true,
      settings: DEFAULT_SETTINGS,
      systemInfo,
    };
  }
}

/**
 * Update a specific setting category in Supabase app_settings table.
 */
export async function updateAppSettingAction<K extends keyof AppSettings>(
  key: K,
  value: Partial<AppSettings[K]>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    return {
      success: false,
      error: auth.error || "Unauthorized",
    };
  }

  const supabase = auth.supabase;

  try {
    // 1. Fetch current value to merge
    const { data: currentRecord } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();

    const mergedValue = {
      ...(DEFAULT_SETTINGS[key] as any),
      ...(currentRecord?.value || {}),
      ...value,
    };

    // 2. Upsert
    const { error: upsertError } = await supabase
      .from("app_settings")
      .upsert({
        key,
        value: mergedValue,
        updated_at: new Date().toISOString(),
        updated_by: auth.user.email,
      });

    if (upsertError) {
      return {
        success: false,
        error: "Failed to persist setting: " + upsertError.message,
      };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/reports");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: "Error saving settings: " + (err?.message || "Unknown error"),
    };
  }
}

/**
 * Fetch list of partner universities for the settings directory
 */
export async function getUniversitiesListAction(): Promise<{
  success: boolean;
  universities: Array<{ id: string | number; name: string; is_active: boolean; created_at?: string }>;
  error?: string;
}> {
  const auth = await verifyAdminAuth();
  if (!auth.isAuthorized || !auth.supabase) {
    // Fallback to static constant master list
    return {
      success: true,
      universities: UNIVERSITY_MASTER_LIST.map((u) => ({
        id: u.id,
        name: u.name,
        is_active: true,
      })),
    };
  }

  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("universities")
      .select("id, name, is_active, created_at")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return {
        success: true,
        universities: UNIVERSITY_MASTER_LIST.map((u) => ({
          id: u.id,
          name: u.name,
          is_active: true,
        })),
      };
    }

    return {
      success: true,
      universities: data.map((u) => ({
        id: u.id,
        name: u.name,
        is_active: u.is_active ?? true,
        created_at: u.created_at,
      })),
    };
  } catch (err: any) {
    return {
      success: true,
      universities: UNIVERSITY_MASTER_LIST.map((u) => ({
        id: u.id,
        name: u.name,
        is_active: true,
      })),
    };
  }
}
