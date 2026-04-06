"use client";

import { useEffect, useState } from "react";
import {
  EditorSummary,
  EditorSummaryResponse,
  EMPTY_EDITOR_SUMMARY,
} from "./editorSummary";
import { ToolkitApiError, toolkitApi } from "./toolkitApi";

function messageFromError(error: unknown) {
  if (error instanceof ToolkitApiError) {
    return error.message || "Editor summary request failed.";
  }

  return "Editor summary request failed.";
}

export default function useEditorSummary() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<EditorSummary>(EMPTY_EDITOR_SUMMARY);

  async function refresh() {
    setIsLoading(true);

    try {
      const data = await toolkitApi.get<EditorSummaryResponse>("/editor/summary");
      setSummary(data.summary ?? EMPTY_EDITOR_SUMMARY);
      setError(null);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    error,
    isLoading,
    refresh,
    summary,
  };
}
