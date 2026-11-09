export interface CollectivesGlobalContext {
  csrfToken: string;
  serverLocalTime: string;
  isAuthenticated: boolean;
}

declare global {
  interface Window {
    __COLLECTIVES_CONTEXT__?: CollectivesGlobalContext;
    csrfToken?: string;
    getServerLocalTime?: () => string;
  }
}

export function getGlobalContext(): CollectivesGlobalContext {
  if (typeof window !== "undefined" && window.__COLLECTIVES_CONTEXT__) {
    return window.__COLLECTIVES_CONTEXT__;
  }
  return {
    csrfToken: (typeof window !== "undefined" && window.csrfToken) || "",
    serverLocalTime:
      (typeof window !== "undefined" && window.getServerLocalTime?.()) || new Date().toISOString(),
    isAuthenticated: false,
  };
}
