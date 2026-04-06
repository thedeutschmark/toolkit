"use client";

import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSupportWallDate, formatUsd } from "@/lib/supportWall";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";

interface ConfirmResponse {
  amountCents: number;
  claimId: string;
  kind: "support_only" | "wall_spot";
  paidAt: string;
  status: "approved" | "checkout_pending" | "paid_pending_approval" | "rejected" | "support_complete";
}

function readError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    if (error.data && typeof error.data === "object" && "error" in error.data) {
      return String((error.data as { error?: unknown }).error);
    }

    return error.message || "Payment confirmation failed.";
  }

  return "Payment confirmation failed.";
}

export default function SupportersThanksPage() {
  const [data, setData] = useState<ConfirmResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const claimId = params.get("claim_id");
    const sessionId = params.get("session_id");

    if (!claimId || !sessionId) {
      setError("Missing checkout confirmation details.");
      return;
    }

    let active = true;

    void toolkitApi
      .post<ConfirmResponse>("/support-wall/confirm", {
        claimId,
        sessionId,
      })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(readError(nextError));
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="toolkit-surface w-full px-6 py-10 text-[var(--toolkit-text-strong)] sm:px-8 sm:py-12">
        {data ? (
          <>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[var(--toolkit-success)]" />
              <p className="toolkit-eyebrow">Payment confirmed</p>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.07em] sm:text-[3rem]">
              {data.kind === "wall_spot" ? "Your supporter wall spot is locked in." : "Your support payment went through."}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)] sm:text-base">
              {data.kind === "wall_spot"
                ? "Your payment is complete. The wall entry is now waiting for manual approval before it appears publicly."
                : "Thanks for supporting the toolkit. This payment does not create a public wall tile, but it still helps fund the work."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-4">
                <p className="toolkit-eyebrow">Amount</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  {formatUsd(data.amountCents)}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-subtle)] px-4 py-4">
                <p className="toolkit-eyebrow">Paid</p>
                <p className="mt-2 text-sm text-[var(--toolkit-text-strong)]">
                  {formatSupportWallDate(data.paidAt)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="toolkit-button toolkit-button-primary" href="/supporters">
                Back to wall
              </Link>
              <Link
                className="toolkit-button toolkit-button-secondary"
                href={data.kind === "wall_spot" ? "/supporters/claim" : "/supporters/claim?mode=support"}
              >
                Make another contribution
              </Link>
            </div>
          </>
        ) : error ? (
          <>
            <p className="toolkit-eyebrow">Confirmation error</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.07em] sm:text-[3rem]">
              Could not confirm the checkout.
            </h1>
            <p className="mt-4 text-sm leading-7 text-rose-200">
              {error}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="toolkit-button toolkit-button-primary" href="/supporters">
                Back to wall
              </Link>
              <Link className="toolkit-button toolkit-button-secondary" href="/supporters/claim">
                Try again
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--toolkit-text-dim)]" />
            <p className="text-sm text-[var(--toolkit-text-muted)]">Confirming payment…</p>
          </div>
        )}
      </section>
    </div>
  );
}
