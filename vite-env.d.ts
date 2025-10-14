/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BYPASS_PAYWALL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
