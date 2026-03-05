import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "https://speakit-api-78524125987.asia-southeast1.run.app";

interface HistoryItem {
  id: string;
  raw_transcript: string;
  duration_seconds: number;
  language_detected: string;
  created_at: string;
  polished_count?: number;
}

interface HistoryContextType {
  items: HistoryItem[];
  historyCount: number;
  isLoading: boolean;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType>({
  items: [],
  historyCount: 0,
  isLoading: false,
  hasNext: false,
  loadMore: async () => {},
  refresh: async () => {},
});

export function useHistory() {
  return useContext(HistoryContext);
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const { getValidToken } = useAuth();

  const refresh = useCallback(async () => {
    const validToken = await getValidToken();
    if (!validToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/recordings?page=1&page_size=20`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPage(1);
        setItems(data.items || []);
        setHasNext(data.has_next || false);
      }
    } catch (e) {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNext) return;
    const validToken = await getValidToken();
    if (!validToken) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${API_BASE}/api/v1/recordings?page=${nextPage}&page_size=20`,
        { headers: { Authorization: `Bearer ${validToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setItems((prev) => [...prev, ...(data.items || [])]);
        setHasNext(data.has_next || false);
        setPage(nextPage);
      }
    } catch (e) {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, isLoading, hasNext, page]);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        items,
        historyCount: items.length,
        isLoading,
        hasNext,
        loadMore,
        refresh,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}