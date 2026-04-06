export interface SupportWallEntry {
  amountCents: number;
  approvedAt: string | null;
  displayName: string;
  id: string;
  imageUrl: string | null;
  message: string | null;
  paidAt: string;
  socialHandle: string | null;
  socialUrl: string | null;
  supporterNumber: number;
}

export interface SupportWallUpcomingSlot {
  priceCents: number;
  supporterNumber: number;
}

export interface SupportWallPublicResponse {
  approvedCount: number;
  claimEnabled: boolean;
  currentPriceCents: number;
  entries: SupportWallEntry[];
  maxPriceCents: number;
  nextPriceCents: number;
  recentActivity: SupportWallEntry[];
  totalRaisedCents: number;
  upcomingSlots: SupportWallUpcomingSlot[];
  wallSupporterCount: number;
}

export interface SupportWallAdminClaim {
  amountCents: number;
  approvedAt: string | null;
  checkoutSessionId: string | null;
  createdAt: string;
  currency: "usd";
  displayName: string | null;
  email: string | null;
  id: string;
  imageUrl: string | null;
  kind: "support_only" | "wall_spot";
  message: string | null;
  paidAt: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewerLogin: string | null;
  socialHandle: string | null;
  socialUrl: string | null;
  status: "approved" | "checkout_pending" | "paid_pending_approval" | "rejected" | "support_complete";
  stripePaymentStatus: string | null;
  supporterNumber: number | null;
  updatedAt: string;
}

export interface SupportWallAdminResponse {
  approvedCount: number;
  pendingClaims: SupportWallAdminClaim[];
  pendingCount: number;
  recentClaims: SupportWallAdminClaim[];
  totalRaisedCents: number;
  viewer: {
    avatar: string | null;
    id: string;
    login: string;
    name: string;
  };
  wallSupporterCount: number;
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function formatSupportWallDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function initialsForSupporter(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DM";
}

export function badgeForSupporterNumber(supporterNumber: number) {
  if (supporterNumber <= 25) return "Origin";
  if (supporterNumber <= 100) return "Founder";
  if (supporterNumber <= 250) return "Pioneer";
  if (supporterNumber <= 500) return "Builder";
  if (supporterNumber <= 1000) return "Patron";
  return "Legend";
}

