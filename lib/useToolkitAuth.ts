"use client";

import { useEffect, useState } from "react";
import { ToolkitApiError, toolkitApi, TOOLKIT_AUTH_URL, type ToolkitUser } from "./toolkitApi";

interface SessionResponse {
  user: ToolkitUser;
}

function buildReturnTo() {
  return window.location.href;
}

function buildLoginUrl() {
  const url = new URL(`${TOOLKIT_AUTH_URL}/twitch/auth`);
  url.searchParams.set("returnTo", buildReturnTo());
  return url.toString();
}

function messageFromError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    if (error.status === 0) {
      return "Auth worker unreachable.";
    }

    if (error.status === 401) {
      return null;
    }

    return error.message || "Toolkit auth failed.";
  }

  return "Toolkit auth failed.";
}

export default function useToolkitAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ToolkitUser | null>(null);

  async function refreshSession() {
    setIsLoading(true);

    try {
      const data = await toolkitApi.get<SessionResponse>("/session");
      setUser(data.user);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(messageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  return {
    error,
    isAuthenticated: Boolean(user),
    isLoading,
    login() {
      window.location.assign(buildLoginUrl());
    },
    async logout() {
      try {
        await toolkitApi.post<{ ok: boolean }>("/logout");
      } catch {
        // If logout fails, the client should still drop local auth state.
      } finally {
        setUser(null);
        setError(null);
      }
    },
    refreshSession,
    user,
  };
}
