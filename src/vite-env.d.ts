/// <reference types='vite/client' />

// 声明全局变量
declare const __APP_VERSION__: string;

// Vite 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_POSTHOG_PROJECT_TOKEN: string;
  readonly VITE_POSTHOG_API_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// requestIdleCallback 类型声明
interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

declare function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout?: number },
): number;

declare function cancelIdleCallback(handle: number): void;
