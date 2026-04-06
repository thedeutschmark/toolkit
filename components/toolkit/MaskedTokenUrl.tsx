"use client";

import { useMemo, useState } from "react";

function maskToken(token: string) {
  if (token.length <= 8) {
    return "•".repeat(token.length);
  }

  return `${token.slice(0, 4)}${"•".repeat(Math.min(12, Math.max(4, token.length - 8)))}${token.slice(-4)}`;
}

function buildMaskedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const wid = parsed.searchParams.get("wid");
    if (!wid) {
      return url;
    }

    parsed.searchParams.set("wid", maskToken(wid));
    return parsed.toString();
  } catch {
    return url.replace(/([?&]wid=)([^&]+)/, (_, prefix: string, token: string) => `${prefix}${maskToken(token)}`);
  }
}

export default function MaskedTokenUrl({ url }: { url: string }) {
  const [revealed, setRevealed] = useState(false);
  const maskedUrl = useMemo(() => buildMaskedUrl(url), [url]);

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[10px] border border-[var(--toolkit-border)] bg-[var(--toolkit-bg-page)] px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 break-all font-mono text-[11px] text-[var(--toolkit-text-dim)] sm:truncate">
        {revealed ? url : maskedUrl}
      </div>
      <button
        type="button"
        className="toolkit-button toolkit-button-ghost !min-h-[28px] self-end px-2.5 text-[10px] uppercase tracking-[0.14em] sm:self-auto"
        onClick={() => setRevealed((current) => !current)}
      >
        {revealed ? "Hide" : "Reveal"}
      </button>
    </div>
  );
}
