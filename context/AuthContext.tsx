import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "https://speakit-api-78524125987.asia-southeast1.run.app";

interface AuthContextType {
  token: string | null;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  getValidToken: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = "speakit_token";
const REFRESH_TOKEN_KEY = "speakit_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        // Try to refresh immediately on load to ensure token is valid
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          setToken(stored); // Use stored token if refresh fails
        }
      }
    } catch (e) {
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh_token);
        setToken(data.access_token);
        return true;
      } else {
        // Refresh token also expired — force logout
        await logout();
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  // Use this instead of token directly in API calls
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) return null;

    // Try using stored token first, refresh if needed
    const testResponse = await fetch(`${BASE_URL}/api/v1/settings`, {
      headers: { Authorization: `Bearer ${stored}` },
    }).catch(() => null);

    if (testResponse?.status === 401) {
      // Token expired — refresh it
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
      return null;
    }

    return stored;
  }, []);

  const login = async (newToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    setToken(newToken);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoading, getValidToken }}>
      {children}
    </AuthContext.Provider>
  );
}