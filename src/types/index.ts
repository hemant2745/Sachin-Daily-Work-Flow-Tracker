export type NavItem = {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  isActive?: boolean;
};

export type MetricPlaceholder = {
  id: string;
  title: string;
  placeholderValue: string;
  description: string;
  iconName: string;
  statusText: string;
};

export * from "./counselor";
export * from "./admissions";
export * from "./projections";
export * from "./reports";
export * from "./settings";

