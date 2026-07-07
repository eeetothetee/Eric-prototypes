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

/* ---- Feature icons ---- */

export const WalletIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const SwapIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h13M14 4.5 17.5 8 14 11.5" />
    <path d="M20 16H7M10 12.5 6.5 16l3.5 3.5" />
  </svg>
);

export const FlowIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" />
  </svg>
);

export const TargetIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const GaugeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="M12 13.5 15.5 9" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const RepeatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M17.5 4.5 20 7l-2.5 2.5" />
    <path d="M4 13v-1.5A4.5 4.5 0 0 1 8.5 7H20" />
    <path d="M6.5 19.5 4 17l2.5-2.5" />
    <path d="M20 11v1.5a4.5 4.5 0 0 1-4.5 4.5H4" />
  </svg>
);

export const ArrowLeftIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />
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

const CartCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 4.5h2l2.2 11h11l2-8H7" />
    <circle cx="9.5" cy="19.5" r="1.4" />
    <circle cx="16.5" cy="19.5" r="1.4" />
  </svg>
);

const DiningCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 3.5v6a2 2 0 0 0 2 2v9M9 3.5v5M11 3.5v5" />
    <path d="M16.5 3.5c-1.7 1-2.5 3.2-2.5 5.5 0 1.7 1 2.5 2.5 2.5v9" />
  </svg>
);

const BagCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5.5 8h13l-1 12.5h-11L5.5 8Z" />
    <path d="M9 10.5V6.5a3 3 0 0 1 6 0v4" />
  </svg>
);

const PlaneCat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.5 13.5 3 11l1.5-1.5 6.5 1 5-5.5c.6-.6 1.6-.6 2.2 0 .6.6.6 1.6 0 2.2l-5.5 5 1 6.5L12 20.5l-2.5-7.5" />
  </svg>
);

const CoinCat = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9M14.8 9.2c-.6-.9-1.7-1.4-2.8-1.4-1.5 0-2.8.9-2.8 2.2 0 2.8 5.6 1.6 5.6 4.2 0 1.3-1.3 2.2-2.8 2.2-1.1 0-2.2-.5-2.8-1.4" />
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
  // Transaction categories
  Groceries: CartCat,
  Dining: DiningCat,
  Shopping: BagCat,
  Entertainment: PlayCat,
  Kids: ChildCat,
  Travel: PlaneCat,
  Home: HouseCat,
  Income: CoinCat,
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
