import type { SVGProps } from "react";

// Minimal 24px stroke icon set. 1.5px strokes, currentColor, no fills —
// quiet, functional marks in the spirit of Braun product graphics.

const base: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

type P = SVGProps<SVGSVGElement>;

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);

export const ListIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const ChartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);

export const GearIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14.5 5 8 12l6.5 7" />
  </svg>
);

export const ChevronRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.5 5 16 12l-6.5 7" />
  </svg>
);

/* ---- Category icons ---- */

const HouseCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 11 12 4.5 20 11" />
    <path d="M6.5 9.5V19h11V9.5" />
    <path d="M10.5 19v-5h3v5" />
  </svg>
);

const BoltCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" />
  </svg>
);

const WifiCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 9.5a13.5 13.5 0 0 1 18 0" />
    <path d="M6.5 13.2a8.5 8.5 0 0 1 11 0" />
    <path d="M9.8 16.6a4 4 0 0 1 4.4 0" />
    <circle cx="12" cy="19.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const ShieldCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-2.5Z" />
  </svg>
);

const PlayCat = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" />
  </svg>
);

const CarCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5 6.5 7h11L19 12.5" />
    <path d="M4 12.5h16V17h-2M4 17V12.5M4 17h2m10 0H8" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="16.5" cy="17" r="1.5" />
  </svg>
);

const BankCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 9.5 12 4l8.5 5.5" />
    <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17" />
  </svg>
);

const ChildCat = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

const HealthCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
  </svg>
);

const TagCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 4h7l9 9-7 7-9-9V4Z" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const CATEGORY_ICON_MAP: Record<string, (p: P) => React.JSX.Element> = {
  Housing: HouseCat,
  Utilities: BoltCat,
  "Internet & Phone": WifiCat,
  Insurance: ShieldCat,
  Subscriptions: PlayCat,
  Transportation: CarCat,
  "Debt & Loans": BankCat,
  Childcare: ChildCat,
  Health: HealthCat,
  Other: TagCat,
};

export function CategoryIcon({ category, ...p }: { category: string } & P) {
  const Icon = CATEGORY_ICON_MAP[category] || TagCat;
  return <Icon {...p} />;
}

/** Initials for a member avatar — one or two letters, no emoji. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
