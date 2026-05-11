import type { CSSProperties } from "react";

const ICONS: Record<string, string> = {
  Executive: "fa-duotone fa-solid fa-building-columns",
  "Policy & TA": "fa-duotone fa-solid fa-scale-balanced",
  "Customer Experience": "fa-duotone fa-solid fa-hand-holding-heart",
  Sales: "fa-duotone fa-solid fa-arrow-trend-up",
  Marketing: "fa-duotone fa-solid fa-bullhorn",
  "Product & Design": "fa-duotone fa-solid fa-compass-drafting",
  "Engineering & IT": "fa-duotone fa-solid fa-microchip",
  Operations: "fa-duotone fa-solid fa-gears",
  "Careers & HR": "fa-duotone fa-solid fa-user-tie",
};

const FALLBACK = "fa-duotone fa-solid fa-grid-2";

export function departmentIcon(name: string): string {
  return ICONS[name] ?? FALLBACK;
}

export const departmentIconStyle: CSSProperties = {
  // @ts-expect-error CSS custom properties on inline style
  "--fa-primary-color": "currentColor",
  "--fa-secondary-color": "currentColor",
  "--fa-secondary-opacity": "0.42",
};
