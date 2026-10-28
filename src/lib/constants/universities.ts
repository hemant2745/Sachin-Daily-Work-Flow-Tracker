/**
 * University Master List
 * Reusable single source of truth for all 23 approved online universities.
 * Exactly preserves official spelling, numbering, and order.
 */

export interface UniversityMasterEntry {
  id: number;
  name: string;
}

export const UNIVERSITY_MASTER_LIST: readonly UniversityMasterEntry[] = [
  { id: 1, name: "Alliance University Online" },
  { id: 2, name: "Amity University Online" },
  { id: 3, name: "DY Patil University Online, Pune" },
  { id: 4, name: "Lovely Professional University (LPU) Online" },
  { id: 5, name: "Manipal University Jaipur (MUJ) Online" },
  { id: 6, name: "Chandigarh University Online" },
  { id: 7, name: "Bennett University Online" },
  { id: 8, name: "Vivekananda Global University (VGU) Online" },
  { id: 9, name: "Sharda University Online" },
  { id: 10, name: "Shoolini University Online" },
  { id: 11, name: "Uttaranchal University Online" },
  { id: 12, name: "Sikkim Manipal University Online" },
  { id: 13, name: "Assam Down Town University Online" },
  { id: 14, name: "Galgotias University Online" },
  { id: 15, name: "UPES Online" },
  { id: 16, name: "Amrita AHEAD Online" },
  { id: 17, name: "NMIMS Online" },
  { id: 18, name: "GLA University Online" },
  { id: 19, name: "D. Y. Patil University Online, Navi Mumbai" },
  { id: 20, name: "Christ University Online" },
  { id: 21, name: "Parul University Online" },
  { id: 22, name: "Kurukshetra University Online" },
  { id: 23, name: "Andhra University Online" },
] as const;

export const UNIVERSITY_NAMES: readonly string[] = UNIVERSITY_MASTER_LIST.map((u) => u.name);
