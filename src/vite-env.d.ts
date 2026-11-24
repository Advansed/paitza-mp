/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HERE_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_PAYLER_URL?: string;
  readonly VITE_PAYLER_KEY?: string;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
