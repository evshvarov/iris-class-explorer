import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const DEFAULT_BASE_URL = "/iris-table-stats/api";
const STORAGE_KEY = "iris-explorer-api-url";

function getStoredUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

interface ApiConfigContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  resetBaseUrl: () => void;
  isDefault: boolean;
}

const ApiConfigContext = createContext<ApiConfigContextType>({
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
  resetBaseUrl: () => {},
  isDefault: true,
});

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(getStoredUrl);

  const setBaseUrl = useCallback((url: string) => {
    const trimmed = url.replace(/\/+$/, "");
    setBaseUrlState(trimmed);
    try { localStorage.setItem(STORAGE_KEY, trimmed); } catch {}
  }, []);

  const resetBaseUrl = useCallback(() => {
    setBaseUrlState(DEFAULT_BASE_URL);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <ApiConfigContext.Provider value={{ baseUrl, setBaseUrl, resetBaseUrl, isDefault: baseUrl === DEFAULT_BASE_URL }}>
      {children}
    </ApiConfigContext.Provider>
  );
}

export function useApiConfig() {
  return useContext(ApiConfigContext);
}

export { DEFAULT_BASE_URL };
