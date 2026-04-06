"use client";

import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { badgeForSupporterNumber, formatSupportWallDate, formatUsd, initialsForSupporter, type SupportWallEntry, type SupportWallPublicResponse } from "@/lib/supportWall";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)]">
      <div className="flex items-center justify-between gap-3">
        <p className="toolkit-eyebrow">{label}</p>
        <Icon className="h-4 w-4 text-[var(--toolkit-text-dim)]" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function SupporterTile({
  entry,
}: {
  entry: SupportWallEntry;
}) {
  const badge = badgeForSupporterNumber(entry.supporterNumber);

  return (
    <article className="group relative aspect-square overflow-hidden rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
      {entry.imageUrl ? (
        <img
          alt={entry.displayName}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-[1.03]"
          referrerPolicy="no-referrer"
          src={entry.imageUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--toolkit-accent-rgb),0.28),transparent_58%),linear-gradient(160deg,#18181b,#0c0c0f)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0.08),rgba(5,5,8,0.86))]" />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex rounded-full border border-[rgba(255,255,255,0.12)] bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
            #{entry.supporterNumber}
          </span>
          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
            {badge}
          </span>
        </div>

        <div>
          {!entry.imageUrl ? (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-lg font-semibold text-white/90">
              {initialsForSupporter(entry.displayName)}
            </div>
          ) : null}
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
            Member #{entry.supporterNumber}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
            {entry.displayName}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            {formatUsd(entry.amountCents)}
          </p>
          {entry.message ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/78">
              {entry.message}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/55">
            <span>{formatSupportWallDate(entry.approvedAt ?? entry.paidAt)}</span>
            {entry.socialHandle ? <span>{entry.socialHandle}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function UpcomingTile({
  priceCents,
  supporterNumber,
}: {
  priceCents: number;
  supporterNumber: number;
}) {
  return (
    <article className="aspect-square rounded-[22px] border border-dashed border-[var(--toolkit-border-hover)] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0)),var(--toolkit-bg-subtle)] p-4 text-[var(--toolkit-text-strong)]">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex rounded-full border border-[var(--toolkit-border-strong)] bg-[var(--toolkit-bg-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--toolkit-text-dim)]">
            Next
          </span>
          <span className="text-xs text-[var(--toolkit-text-dim)]">#{supporterNumber}</span>
        </div>

        <div>
          <p className="toolkit-eyebrow">Claimable slot</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
            {formatUsd(priceCents)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--toolkit-text-muted)]">
            The next supporter moves the wall price to the next step immediately.
          </p>
        </div>
      </div>
    </article>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ToolkitApiError) {
    return error.message || "Could not load the supporter wall.";
  }

  return "Could not load the supporter wall.";
}

export default function SupportersPage() {
  const [data, setData] = useState<SupportWallPublicResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void toolkitApi
      .get<SupportWallPublicResponse>("/support-wall")
      .then((response) => {
        if (!active) return;
        setData(response);
        setError(null);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(errorMessage(nextError));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="toolkit-surface w-full px-6 py-10 text-[var(--toolkit-text-strong)]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--toolkit-text-dim)]" />
            <p className="text-sm text-[var(--toolkit-text-muted)]">Loading supporter wall…</p>
          </div>
        </section>
      </div>
    );
  }

  const entries = data?.entries ?? [];
  const upcomingSlots = data?.upcomingSlots ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <section className="toolkit-surface overflow-hidden px-6 py-8 text-[var(--toolkit-text-strong)] sm:px-8 sm:py-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
            <div>
              <p className="toolkit-eyebrow">Supporter wall</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.07em] sm:text-[3.3rem]">
                A live wall that gets a little more expensive every time someone claims a spot.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)] sm:text-base">
                Claim a visible wall slot at the current price, or support the toolkit with any
                other amount without appearing on the wall. Wall spots lock their price at
                checkout, then go live after manual approval.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link className="toolkit-button toolkit-button-primary" href="/supporters/claim">
                  Claim a wall spot
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link className="toolkit-button toolkit-button-secondary" href="/supporters/claim?mode=support">
                  Support without a wall spot
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--toolkit-border)] bg-[radial-gradient(circle_at_top,rgba(var(--toolkit-accent-rgb),0.18),transparent_52%),var(--toolkit-bg-subtle)] p-5">
              <p className="toolkit-eyebrow">Live price</p>
              <p className="mt-4 text-5xl font-semibold tracking-[-0.07em] text-[var(--toolkit-text-strong)]">
                {formatUsd(data?.currentPriceCents ?? 100)}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                Next claim: {formatUsd(data?.nextPriceCents ?? 105)}. The wall caps at{" "}
                {formatUsd(data?.maxPriceCents ?? 10_000)}.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)] px-4 py-4">
                  <p className="toolkit-eyebrow">Wall supporters</p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                    {data?.wallSupporterCount ?? 0}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-panel)] px-4 py-4">
                  <p className="toolkit-eyebrow">Raised</p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                    {formatUsd(data?.totalRaisedCents ?? 0)}
                  </p>
                </div>
              </div>
              {!data?.claimEnabled ? (
                <div className="mt-5 rounded-[18px] border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  Checkout is temporarily paused while the payment flow is being hardened. The
                  public wall stays live and visible in the meantime.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {error ? (
          <section className="toolkit-surface px-6 py-6 text-sm text-rose-200">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Heart}
            label="Current price"
            value={formatUsd(data?.currentPriceCents ?? 100)}
          />
          <StatCard
            icon={TrendingUp}
            label="Next price"
            value={formatUsd(data?.nextPriceCents ?? 105)}
          />
          <StatCard
            icon={Users}
            label="Approved tiles"
            value={String(data?.approvedCount ?? 0)}
          />
          <StatCard
            icon={Sparkles}
            label="Total raised"
            value={formatUsd(data?.totalRaisedCents ?? 0)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="toolkit-eyebrow">Wall</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
                  Approved supporters
                </h2>
              </div>
              {data?.claimEnabled ? (
                <Link className="toolkit-button toolkit-button-secondary" href="/supporters/claim">
                  Claim your spot
                </Link>
              ) : (
                <span className="toolkit-button toolkit-button-secondary cursor-not-allowed opacity-60">
                  Checkout paused
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <SupporterTile entry={entry} key={entry.id} />
              ))}
              {upcomingSlots.map((slot) => (
                <UpcomingTile
                  key={`slot-${slot.supporterNumber}`}
                  priceCents={slot.priceCents}
                  supporterNumber={slot.supporterNumber}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6">
              <p className="toolkit-eyebrow">How it works</p>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                <li>1. The current wall price increases by five cents after every paid wall claim.</li>
                <li>2. Wall claims lock their price at checkout, then wait for manual approval before going public.</li>
                <li>3. Any other support amount helps the toolkit but does not create a visible wall tile.</li>
              </ol>
            </section>

            <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6">
              <p className="toolkit-eyebrow">Recent activity</p>
              <div className="mt-4 space-y-3">
                {(data?.recentActivity ?? []).map((entry) => (
                  <article
                    className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-3"
                    key={`recent-${entry.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--toolkit-text-strong)]">
                        {entry.displayName}
                      </p>
                      <span className="text-xs text-[var(--toolkit-text-dim)]">
                        #{entry.supporterNumber}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--toolkit-text-muted)]">
                      {formatUsd(entry.amountCents)} · {formatSupportWallDate(entry.approvedAt ?? entry.paidAt)}
                    </p>
                  </article>
                ))}
                {!data?.recentActivity?.length ? (
                  <p className="text-sm text-[var(--toolkit-text-muted)]">
                    The first approved wall supporters will show up here.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
