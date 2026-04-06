"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TOOLKIT_AUTH_URL, ToolkitApiError, toolkitApi, type ToolkitUser } from "@/lib/toolkitApi";

interface SpotifyConnection {
  connected: boolean;
  hasCredentials?: boolean;
  profile: {
    avatar: string | null;
    displayName: string;
    id: string;
  } | null;
}

interface ConnectionsResponse {
  spotify: SpotifyConnection;
  twitch: {
    connected: boolean;
    profile: ToolkitUser;
  };
}

const spotifyErrorMessages: Record<string, string> = {
  access_denied: "Spotify authorization was canceled before the connection was completed.",
  invalid_client: "Spotify rejected this Client ID or Client Secret. Check the project settings and try again.",
  invalid_grant: "Spotify rejected the authorization grant. Reconnect from the beginning and confirm the redirect URI matches exactly.",
};

function describeError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    const details =
      typeof error.data === "object" && error.data && "error" in error.data
        ? String((error.data as { error?: unknown }).error)
        : error.message;

    return details || "Connection request failed.";
  }

  return "Connection request failed.";
}

export default function ToolkitConnectionsPage() {
  const searchParams = useSearchParams();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [connections, setConnections] = useState<ConnectionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const spotifyError = searchParams.get("spotify_error");
  const spotifyMessage = useMemo(() => {
    if (!spotifyError) {
      return null;
    }

    return (
      spotifyErrorMessages[spotifyError] ??
      `Spotify OAuth returned: ${spotifyError.replace(/_/g, " ").toLowerCase()}.`
    );
  }, [spotifyError]);

  async function loadConnections() {
    setIsLoading(true);

    try {
      const data = await toolkitApi.get<ConnectionsResponse>("/connections");
      setConnections(data);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSpotifyConnect() {
    setIsSubmitting(true);
    setError(null);

    try {
      if (clientId.trim() && clientSecret.trim()) {
        await toolkitApi.post<{ ok: boolean }>("/spotify/credentials", {
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        });
      } else if (!connections?.spotify.hasCredentials) {
        throw new Error("Spotify Client ID and Client Secret are required.");
      }

      const authUrl = new URL(`${TOOLKIT_AUTH_URL}/spotify/auth`);
      authUrl.searchParams.set("returnTo", window.location.href);
      window.location.assign(authUrl.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : describeError(err));
      setIsSubmitting(false);
    }
  }

  async function handleSpotifyDisconnect() {
    setIsSubmitting(true);
    setError(null);

    try {
      await toolkitApi.delete<{ ok: boolean }>("/spotify/credentials");
      setClientId("");
      setClientSecret("");
      await loadConnections();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    void loadConnections();
  }, []);

  return (
    <div className="space-y-6">
      <section className="toolkit-surface px-4 py-5 text-[var(--toolkit-text-strong)] sm:px-6 sm:py-7">
        <p className="toolkit-eyebrow">Connections</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">
          Identity and provider status
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--toolkit-text-muted)]">
          Twitch handles account identity. Spotify is attached per user and stored against the active Twitch session.
        </p>
      </section>

      {spotifyMessage ? (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-6 py-4 text-sm text-amber-100">
          {spotifyMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-6 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
          <p className="toolkit-eyebrow">
            Twitch
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.045em]">
            {isLoading ? "Loading session" : connections?.twitch.profile.name ?? "Signed in"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            {connections?.twitch.profile.login
              ? `Authenticated as @${connections.twitch.profile.login}.`
              : "The dashboard uses the shared auth worker session cookie."}
          </p>
          {connections?.twitch.profile.avatar ? (
            <img
              alt={connections.twitch.profile.name}
              className="mt-5 h-14 w-14 rounded-full border border-[var(--toolkit-border)] object-cover"
              referrerPolicy="no-referrer"
              src={connections.twitch.profile.avatar}
            />
          ) : null}
        </div>

        <div className="toolkit-surface px-6 py-6 text-[var(--toolkit-text-strong)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="toolkit-eyebrow">
                Spotify
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.045em]">
                {connections?.spotify.connected ? "Connected to Spotify" : "Connect Spotify"}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                connections?.spotify.connected
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-200"
              }`}
            >
              {connections?.spotify.connected ? "Live" : "Needs setup"}
            </span>
          </div>

          {connections?.spotify.profile ? (
            <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
              Signed in as <span className="text-[var(--toolkit-text-strong)]">{connections.spotify.profile.displayName}</span>.
              Your Spotify project credentials are saved server-side for this Twitch account.
            </p>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
              Connect a Spotify developer project to mint user-scoped refresh tokens for your widgets.
            </p>
          )}

          <ol className="mt-5 space-y-3 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            <li>1. Use your existing Spotify Developer project, or create one if you do not have one yet.</li>
            <li>2. If Spotify only allows you one app, keep using that same project and add multiple redirect URIs to it.</li>
            <li>3. Add `https://auth.deutschmark.online/spotify/callback` as one of the redirect URIs on that project.</li>
            <li>4. Paste the Client ID and Client Secret from that same project here.</li>
            <li>5. Continue to Spotify OAuth to mint refresh tokens for this user.</li>
          </ol>

          <p className="mt-4 text-sm leading-7 text-[var(--toolkit-text-muted)]">
            You do not need a separate Spotify app just for DM Toolkit. One Spotify developer
            project can hold multiple redirect URIs for local testing, toolkit auth, and other tools.
          </p>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm text-stone-300">
              <span>Client ID</span>
              <input
                className="toolkit-input"
                onChange={(event) => setClientId(event.target.value)}
                placeholder={connections?.spotify.hasCredentials ? "Saved server-side" : "Paste Client ID"}
                type="text"
                value={clientId}
              />
            </label>

            <label className="grid gap-2 text-sm text-stone-300">
              <span>Client Secret</span>
              <input
                className="toolkit-input"
                onChange={(event) => setClientSecret(event.target.value)}
                placeholder={connections?.spotify.hasCredentials ? "Saved server-side" : "Paste Client Secret"}
                type="password"
                value={clientSecret}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="toolkit-button toolkit-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => {
                void handleSpotifyConnect();
              }}
              type="button"
            >
              {isSubmitting ? "Working..." : connections?.spotify.connected ? "Reconnect Spotify" : "Connect Spotify"}
            </button>

            {connections?.spotify.connected || connections?.spotify.hasCredentials ? (
              <button
                className="toolkit-button toolkit-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => {
                  void handleSpotifyDisconnect();
                }}
                type="button"
              >
                Disconnect
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
