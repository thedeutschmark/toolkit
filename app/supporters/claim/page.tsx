"use client";

import Link from "next/link";
import { ArrowRight, Heart, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatUsd, type SupportWallPublicResponse } from "@/lib/supportWall";
import { ToolkitApiError, toolkitApi } from "@/lib/toolkitApi";

type ClaimMode = "support" | "wall";

function readError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    if (error.data && typeof error.data === "object" && "error" in error.data) {
      return String((error.data as { error?: unknown }).error);
    }

    return error.message || "Checkout could not be started.";
  }

  return "Checkout could not be started.";
}

export default function SupportersClaimPage() {
  const [data, setData] = useState<SupportWallPublicResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<ClaimMode>("wall");
  const [wasCancelled, setWasCancelled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [supportAmount, setSupportAmount] = useState("10");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("mode") === "support" ? "support" : "wall");
    setWasCancelled(params.get("cancelled") === "1");
  }, []);

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
        setError(readError(nextError));
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

  const supportAmountCents = useMemo(() => {
    const amount = Number.parseFloat(supportAmount);
    if (!Number.isFinite(amount)) {
      return 0;
    }

    return Math.round(amount * 100);
  }, [supportAmount]);

  async function handleCheckout() {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload =
        mode === "wall"
          ? {
              displayName: displayName.trim(),
              imageUrl: imageUrl.trim() || null,
              kind: "wall_spot",
              message: message.trim() || null,
              socialHandle: socialHandle.trim() || null,
              socialUrl: socialUrl.trim() || null,
            }
          : {
              amountCents: supportAmountCents,
              kind: "support_only",
            };
      const response = await toolkitApi.post<{
        amountCents: number;
        checkoutUrl: string;
        claimId: string;
      }>("/support-wall/checkout", payload);

      window.location.assign(response.checkoutUrl);
    } catch (nextError) {
      setError(readError(nextError));
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="toolkit-surface w-full px-6 py-10 text-[var(--toolkit-text-strong)]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--toolkit-text-dim)]" />
            <p className="text-sm text-[var(--toolkit-text-muted)]">Preparing checkout…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <section className="toolkit-surface overflow-hidden px-6 py-8 text-[var(--toolkit-text-strong)] sm:px-8 sm:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
            <div>
              <p className="toolkit-eyebrow">Checkout</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.07em] sm:text-[3rem]">
                {mode === "wall" ? "Claim a visible supporter wall spot." : "Support the toolkit without taking a wall spot."}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)] sm:text-base">
                {mode === "wall"
                  ? "Wall spots lock the live price at checkout. After payment, the entry waits for manual approval before it appears on the public wall."
                  : "Use this when you want to support the toolkit at any amount without creating a public tile on the supporter wall."}
              </p>
              {!data?.claimEnabled ? (
                <div className="mt-5 rounded-[18px] border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  Checkout is temporarily paused while the payment flow is being hardened. The wall
                  is still public, but new claims and support payments are disabled for now.
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  className={`toolkit-button ${mode === "wall" ? "toolkit-button-primary" : "toolkit-button-secondary"}`}
                  onClick={() => setMode("wall")}
                  type="button"
                >
                  Claim wall spot
                </button>
                <button
                  className={`toolkit-button ${mode === "support" ? "toolkit-button-primary" : "toolkit-button-secondary"}`}
                  onClick={() => setMode("support")}
                  type="button"
                >
                  Support only
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--toolkit-border)] bg-[radial-gradient(circle_at_top,rgba(var(--toolkit-accent-rgb),0.18),transparent_52%),var(--toolkit-bg-subtle)] p-5">
              <p className="toolkit-eyebrow">{mode === "wall" ? "Current wall price" : "Support amount"}</p>
              <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-[var(--toolkit-text-strong)]">
                {mode === "wall" ? formatUsd(data?.currentPriceCents ?? 100) : formatUsd(supportAmountCents)}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                {mode === "wall"
                  ? `Next wall claim becomes ${formatUsd(data?.nextPriceCents ?? 105)}.`
                  : "Support-only payments help the toolkit but never create a public tile."}
              </p>
            </div>
          </div>
        </section>

        {wasCancelled ? (
          <section className="rounded-[20px] border border-amber-300/15 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
            Checkout was cancelled before payment completed.
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[20px] border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
            {mode === "wall" ? (
              <div className="space-y-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Display name</span>
                  <input
                    className="toolkit-input"
                    maxLength={60}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="How should your tile appear?"
                    type="text"
                    value={displayName}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Tile image URL</span>
                  <input
                    className="toolkit-input"
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://…"
                    type="url"
                    value={imageUrl}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Short message</span>
                  <textarea
                    className="toolkit-textarea min-h-[120px]"
                    maxLength={280}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Optional message for the supporter card."
                    value={message}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Social handle</span>
                    <input
                      className="toolkit-input"
                      maxLength={64}
                      onChange={(event) => setSocialHandle(event.target.value)}
                      placeholder="@yourname"
                      type="text"
                      value={socialHandle}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Social URL</span>
                    <input
                      className="toolkit-input"
                      onChange={(event) => setSocialUrl(event.target.value)}
                      placeholder="https://…"
                      type="url"
                      value={socialUrl}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Support amount</span>
                  <input
                    className="toolkit-input max-w-xs"
                    min="1"
                    onChange={(event) => setSupportAmount(event.target.value)}
                    step="0.01"
                    type="number"
                    value={supportAmount}
                  />
                </label>
                <p className="text-sm leading-7 text-[var(--toolkit-text-muted)]">
                  Choose any amount. Support-only payments help fund the toolkit but do not appear
                  on the public wall.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="toolkit-button toolkit-button-primary"
                disabled={!data?.claimEnabled || isSubmitting}
                onClick={() => {
                  void handleCheckout();
                }}
                type="button"
              >
                {!data?.claimEnabled
                  ? "Checkout paused"
                  : isSubmitting
                    ? "Redirecting…"
                    : "Continue to checkout"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link className="toolkit-button toolkit-button-secondary" href="/supporters">
                Back to wall
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 text-[var(--toolkit-accent)]" />
                <p className="toolkit-eyebrow">Wall rules</p>
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                <li>1. Wall spot pricing is locked when checkout starts.</li>
                <li>2. Entries go live only after manual approval.</li>
                <li>3. Support-only payments never create a visible wall tile.</li>
              </ol>
            </section>

            <section className="toolkit-surface px-5 py-5 text-[var(--toolkit-text-strong)] sm:px-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[var(--toolkit-accent)]" />
                <p className="toolkit-eyebrow">Moderation</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
                Image URLs, names, and public text are reviewed before they appear on the wall.
                Keep submissions clean and link only to assets you control.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
