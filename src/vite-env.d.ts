/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Cashier FastAPI backend. Defaults to http://localhost:8000 */
  readonly VITE_API_BASE_URL?: string;
}

interface Window {
  /** Runtime configuration injected at container start (chart ConfigMap). */
  __CASHIER_CONFIG__?: {
    basePath?: string;
    apiBaseUrl?: string;
  };
}
