"use client";

import { useEffect, useState } from "react";
import { ToolkitApiError, toolkitApi } from "./toolkitApi";
import type { WidgetConfig } from "@deutschmark/widget-config";

export interface WidgetTokenRecord {
  createdAt: string;
  label: string | null;
  scopes: string[];
  surface: string;
  token: string;
}

interface WidgetTokensResponse {
  tokens: WidgetTokenRecord[];
}

interface WidgetConfigResponse {
  config: WidgetConfig;
  configVersion: number;
}

function messageFromError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    return error.message || "Widget token request failed.";
  }

  return "Widget token request failed.";
}

export default function useWidgetTokens() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<WidgetTokenRecord[]>([]);

  async function refresh() {
    setIsLoading(true);

    try {
      const data = await toolkitApi.get<WidgetTokensResponse>("/widget-tokens");
      setTokens(data.tokens ?? []);
      setError(null);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function createToken(input: {
    config?: Partial<WidgetConfig>;
    duplicateFrom?: string;
    label?: string;
    scopes?: string[];
    surface: string;
  }) {
    try {
      const data = await toolkitApi.post<{ token: WidgetTokenRecord }>("/widget-tokens", input);
      setTokens((current) => [data.token, ...current]);
      setError(null);
      return data.token;
    } catch (err) {
      setError(messageFromError(err));
      return null;
    }
  }

  async function deleteToken(token: string) {
    try {
      const data = await toolkitApi.delete<WidgetTokensResponse>("/widget-tokens", { token });
      setTokens(data.tokens ?? []);
      setError(null);
    } catch (err) {
      setError(messageFromError(err));
    }
  }

  async function fetchConfig(token: string): Promise<WidgetConfig | null> {
    try {
      const data = await toolkitApi.get<WidgetConfigResponse>(
        `/widget-tokens/config/${encodeURIComponent(token)}`,
      );
      return data.config;
    } catch (err) {
      setError(messageFromError(err));
      return null;
    }
  }

  async function updateConfig(token: string, config: Partial<WidgetConfig>): Promise<WidgetConfig | null> {
    try {
      const data = await toolkitApi.put<WidgetConfigResponse>(
        `/widget-tokens/config/${encodeURIComponent(token)}`,
        config,
      );
      setError(null);
      return data.config;
    } catch (err) {
      setError(messageFromError(err));
      return null;
    }
  }

  async function duplicateToken(sourceToken: string, label: string): Promise<WidgetTokenRecord | null> {
    const existingToken = tokens.find((t) => t.token === sourceToken);
    return createToken({
      duplicateFrom: sourceToken,
      label,
      scopes: existingToken?.scopes ?? ["spotify:read"],
      surface: existingToken?.surface ?? "player",
    });
  }

  async function regenerateToken(oldToken: string): Promise<string | null> {
    const existing = tokens.find((t) => t.token === oldToken);
    const created = await createToken({
      duplicateFrom: oldToken,
      label: existing?.label ?? undefined,
      scopes: existing?.scopes ?? ["spotify:read"],
      surface: existing?.surface ?? "player",
    });

    if (!created) return null;

    await deleteToken(oldToken);
    return created.token;
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    createToken,
    deleteToken,
    duplicateToken,
    error,
    fetchConfig,
    isLoading,
    refresh,
    regenerateToken,
    tokens,
    updateConfig,
  };
}
