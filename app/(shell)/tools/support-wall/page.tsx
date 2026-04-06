"use client";

import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatSupportWallDate, formatUsd, type SupportWallAdminClaim, type SupportWallAdminResponse } from "@/lib/supportWall";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";

function readError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    if (error.status === 403) {
      return "This page is limited to supporter wall admins.";
    }

    if (error.data && typeof error.data === "object" && "error" in error.data) {
      return String((error.data as { error?: unknown }).error);
    }

    return error.message || "Support wall admin data could not be loaded.";
  }

  return "Support wall admin data could not be loaded.";
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)]">
      <p className="toolkit-eyebrow">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function ClaimRow({
  claim,
  disabled,
  onReview,
}: {
  claim: SupportWallAdminClaim;
  disabled: boolean;
  onReview: (claimId: string, action: "approve" | "reject") => void;
}) {
  return (
    <article className="rounded-[22px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-[rgba(var(--toolkit-accent-rgb),0.3)] bg-[rgba(var(--toolkit-accent-rgb),0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--toolkit-text-strong)]">
              {claim.status.replace(/_/g, " ")}
            </span>
            {claim.supporterNumber ? (
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--toolkit-text-dim)]">
                Member #{claim.supporterNumber}
              </span>
            ) : null}
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--toolkit-text-strong)]">
            {claim.displayName ?? "Support-only payment"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--toolkit-text-dim)]">
            <span>{formatUsd(claim.amountCents)}</span>
            <span>Created {formatSupportWallDate(claim.createdAt)}</span>
            {claim.paidAt ? <span>Paid {formatSupportWallDate(claim.paidAt)}</span> : null}
            {claim.email ? <span>{claim.email}</span> : null}
          </div>
          {claim.message ? (
            <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
              {claim.message}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--toolkit-text-dim)]">
            {claim.socialHandle ? <span>{claim.socialHandle}</span> : null}
            {claim.socialUrl ? (
              <a
                className="text-[var(--toolkit-accent)] underline underline-offset-4"
                href={claim.socialUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open social URL
              </a>
            ) : null}
            {claim.imageUrl ? (
              <a
                className="text-[var(--toolkit-accent)] underline underline-offset-4"
                href={claim.imageUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open tile image
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            className="toolkit-button toolkit-button-primary"
            disabled={disabled}
            onClick={() => onReview(claim.id, "approve")}
            type="button"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            className="toolkit-button toolkit-button-secondary"
            disabled={disabled}
            onClick={() => onReview(claim.id, "reject")}
            type="button"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    </article>
  );
}

export default function SupportWallAdminPage() {
  const [data, setData] = useState<SupportWallAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await toolkitApi.get<SupportWallAdminResponse>("/support-wall/admin");
      setData(response);
      setError(null);
    } catch (nextError) {
      setError(readError(nextError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReview(claimId: string, action: "approve" | "reject") {
    setReviewingId(claimId);

    try {
      await toolkitApi.post<{ ok: boolean }>("/support-wall/admin/review", {
        action,
        claimId,
      });
      await load();
    } catch (nextError) {
      setError(readError(nextError));
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Support wall</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Supporter wall moderation
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Review paid wall submissions, approve clean entries for the public wall, and reject
          anything that should stay offline.
        </p>
      </section>

      {error ? (
        <div className="rounded-[20px] border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="toolkit-button toolkit-button-secondary"
          disabled={isLoading}
          onClick={() => {
            void load();
          }}
          type="button"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pending" value={String(data?.pendingCount ?? 0)} />
        <SummaryCard label="Approved" value={String(data?.approvedCount ?? 0)} />
        <SummaryCard label="Wall supporters" value={String(data?.wallSupporterCount ?? 0)} />
        <SummaryCard label="Raised" value={formatUsd(data?.totalRaisedCents ?? 0)} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="toolkit-eyebrow">Pending queue</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--toolkit-text-strong)]">
            Waiting for review
          </h2>
        </div>

        {isLoading ? (
          <div className="toolkit-surface px-6 py-8 text-sm text-[var(--toolkit-text-muted)]">
            Loading support wall claims…
          </div>
        ) : data?.pendingClaims.length ? (
          data.pendingClaims.map((claim) => (
            <ClaimRow
              claim={claim}
              disabled={reviewingId === claim.id}
              key={claim.id}
              onReview={handleReview}
            />
          ))
        ) : (
          <div className="toolkit-surface px-6 py-8 text-sm text-[var(--toolkit-text-muted)]">
            No paid wall claims are waiting for approval.
          </div>
        )}
      </section>

      <section className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
        <p className="toolkit-eyebrow">Recent activity</p>
        <div className="mt-4 space-y-3">
          {(data?.recentClaims ?? []).map((claim) => (
            <div
              className="flex flex-col gap-2 rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              key={`recent-${claim.id}`}
            >
              <div>
                <p className="text-sm font-medium text-[var(--toolkit-text-strong)]">
                  {claim.displayName ?? "Support-only payment"}
                </p>
                <p className="mt-1 text-xs text-[var(--toolkit-text-dim)]">
                  {formatUsd(claim.amountCents)} · {claim.status.replace(/_/g, " ")}
                  {claim.supporterNumber ? ` · #${claim.supporterNumber}` : ""}
                </p>
              </div>
              <p className="text-xs text-[var(--toolkit-text-dim)]">
                {formatSupportWallDate(claim.paidAt ?? claim.createdAt)}
              </p>
            </div>
          ))}
          {!data?.recentClaims.length && !isLoading ? (
            <p className="text-sm text-[var(--toolkit-text-muted)]">
              Recent paid claims will show up here once checkout starts landing.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

