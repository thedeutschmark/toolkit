"use client";

import { useEffect, useState } from "react";
import { ToolkitApiError, toolkitApi } from "./toolkitApi";

export interface ToolkitSettings {
  playerMode?: "compact" | "overlay" | "minimal";
  theme?: "graphite" | "night" | "obs";
}

interface SettingsResponse {
  settings: ToolkitSettings;
}

function messageFromError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    return error.message || "Settings request failed.";
  }

  return "Settings request failed.";
}

export default function useToolkitSettings() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ToolkitSettings>({});

  async function refresh() {
    setIsLoading(true);

    try {
      const data = await toolkitApi.get<SettingsResponse>("/settings");
      setSettings(data.settings ?? {});
      setError(null);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function save(nextSettings: ToolkitSettings) {
    const previous = settings;
    setSettings(nextSettings);
    setIsSaving(true);
    setError(null);

    try {
      const data = await toolkitApi.put<SettingsResponse>("/settings", nextSettings);
      setSettings(data.settings ?? nextSettings);
    } catch (err) {
      setSettings(previous);
      setError(messageFromError(err));
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    error,
    isLoading,
    isSaving,
    refresh,
    save,
    settings,
  };
}
