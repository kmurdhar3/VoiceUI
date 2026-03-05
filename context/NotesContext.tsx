import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "";

interface NoteItem {
  id: string;
  text: string;
  created_at: string;
}

interface NotesContextType {
  notes: NoteItem[];
  notesCount: number;
  isLoading: boolean;
  deleteNote: (id: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType>({
  notes: [],
  notesCount: 0,
  isLoading: false,
  deleteNote: async () => {},
  refreshNotes: async () => {},
});

export function useNotes() {
  return useContext(NotesContext);
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const refreshNotes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.items || data || []);
      }
    } catch (e) {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const deleteNote = useCallback(
    async (id: string) => {
      // Optimistic removal
      setNotes((prev) => prev.filter((n) => n.id !== id));

      try {
        const response = await fetch(`${API_BASE}/api/v1/notes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          // Revert on error
          await refreshNotes();
        }
      } catch (e) {
        await refreshNotes();
      }
    },
    [token, refreshNotes]
  );

  useEffect(() => {
    if (token) refreshNotes();
  }, [token]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        notesCount: notes.length,
        isLoading,
        deleteNote,
        refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
