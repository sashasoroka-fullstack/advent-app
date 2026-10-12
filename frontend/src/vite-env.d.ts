/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_MODE?: string;
  readonly VITE_APP_AUTH_AUTHORITY?: string;
  readonly VITE_APP_AUTH_REDIRECT_URI?: string;
  readonly VITE_APP_AUTH_CLIENT_ID?: string;
  readonly VITE_APP_AUTH_SCOPE?: string;
  readonly VITE_APP_AUTH_ROLE_CLAIM?: string;
  readonly VITE_APP_AUTH_PRIVILEGED_ROLES?: string;
  readonly VITE_GOOGLE_SHEET_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
