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
  transcript: string;
  duration: number;
  created_at: string;
  results?: {
    original?: string;
    professional?: string;
    casual?: string;
    concise?: string;
  };
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
  const { token } = useAuth();

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/history?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setHasNext(data.has_next || false);
        setPage(1);
      }
    } catch (e) {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadMore = useCallback(async () => {
    if (!token || isLoading || !hasNext) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${API_BASE}/api/v1/history?page=${nextPage}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
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
  }, [token, isLoading, hasNext, page]);

  useEffect(() => {
    if (token) refresh();
  }, [token]);

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
