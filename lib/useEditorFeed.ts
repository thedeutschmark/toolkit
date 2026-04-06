"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEditorFeedItem,
  deleteEditorFeedItem,
  fetchEditorFeed,
  type EditorFeedItem,
} from "@/lib/editorFeed";

const EMPTY_STATE: EditorFeedItem[] = [];

export default function useEditorFeed() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState(EMPTY_STATE);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEditorFeed();
      setItems(response.items ?? EMPTY_STATE);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load editor feed.");
      setItems(EMPTY_STATE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (item: Parameters<typeof createEditorFeedItem>[0]) => {
    const response = await createEditorFeedItem(item);
    setItems(response.items ?? EMPTY_STATE);
    window.dispatchEvent(new CustomEvent("dm:editor-feed-changed"));
    return response.item ?? null;
  }, []);

  const remove = useCallback(async (id: string) => {
    const response = await deleteEditorFeedItem(id);
    setItems(response.items ?? EMPTY_STATE);
    window.dispatchEvent(new CustomEvent("dm:editor-feed-changed"));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleChange = () => {
      void refresh();
    };

    window.addEventListener("dm:editor-feed-changed", handleChange);
    return () => window.removeEventListener("dm:editor-feed-changed", handleChange);
  }, [refresh]);

  return {
    create,
    error,
    isLoading,
    items,
    refresh,
    remove,
  };
}
