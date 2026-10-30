export interface AdminProfileSettings {
  name: string;
  email: string;
  role: string;
  organization: string;
}

export interface RegionalPreferences {
  timezone: string;
  timezone_label: string;
  currency: string;
  currency_symbol: string;
  date_format: string;
}

export interface NotificationPreferences {
  offsets: number[];
  sender_email: string;
  recipient_fallback: string;
  frequency: string;
}

export interface TargetDefaults {
  default_collection_target: number;
  default_admission_target: number;
  team_target_amount: number;
  team_target_admissions: number;
}

export interface ExportPreferences {
  default_format: "xlsx" | "csv" | "pdf";
  include_audit_stamps: boolean;
  csv_delimiter: string;
}

export interface AppSettings {
  admin_profile: AdminProfileSettings;
  regional_preferences: RegionalPreferences;
  notification_preferences: NotificationPreferences;
  target_defaults: TargetDefaults;
  export_preferences: ExportPreferences;
}

export interface SystemInfo {
  appName: string;
  version: string;
  framework: string;
  nodeEnv: string;
  authorizedAdmin: string;
  databaseStatus: "connected" | "disconnected" | "simulated";
  schedulerStatus: string;
}
