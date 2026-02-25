/**
 * 网络状态守卫模块
 * 负责非阻塞检测 PostHog API Host 连通性
 */

// PostHog API Host 配置
const DEFAULT_API_HOST = 'https://us.i.posthog.com';

// 网络检测超时时间（毫秒）
const NETWORK_CHECK_TIMEOUT = 3000;

// 网络状态缓存
let lastOnlineStatus: boolean | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // 缓存 30 秒

/**
 * 检测 API Host 连通性
 * 使用 fetch 请求检测，超时即视为离线
 * @param apiHost - API Host 地址，默认使用 PostHog 默认地址
 * @returns Promise<boolean> - true 表示在线，false 表示离线
 */
export async function checkApiConnectivity(
  apiHost: string = DEFAULT_API_HOST,
): Promise<boolean> {
  // 检查缓存
  const now = Date.now();
  if (
    lastOnlineStatus !== null &&
    now - lastCheckTime < CACHE_DURATION
  ) {
    return lastOnlineStatus;
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_CHECK_TIMEOUT);

  try {
    // 发送 HEAD 请求检测连通性
    await fetch(`${apiHost}/health`, {
      method: 'HEAD',
      mode: 'no-cors', // 跨域模式下不检查响应状态
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // no-cors 模式下，只要不抛错就认为连通
    lastOnlineStatus = true;
    lastCheckTime = now;
    return true;
  } catch (error) {
    clearTimeout(timeoutId);

    // 请求失败，视为离线
    lastOnlineStatus = false;
    lastCheckTime = now;
    return false;
  }
}

/**
 * 快速检测当前是否在线
 * 首先使用 navigator.onLine，然后异步验证 API 连通性
 * @returns boolean - navigator.onLine 的值
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 延迟检测网络状态（非阻塞）
 * 使用 requestIdleCallback 或 setTimeout 延迟执行
 * @param callback - 检测完成后的回调函数
 * @param delay - 延迟时间（毫秒），默认 100ms
 */
export function scheduleNetworkCheck(
  callback: (isOnline: boolean) => void,
  delay: number = 100,
): void {
  const performCheck = async () => {
    // 首先检查 navigator.onLine
    if (!navigator.onLine) {
      callback(false);
      return;
    }

    // 然后验证 API 连通性
    const isConnectivityAvailable = await checkApiConnectivity();
    callback(isConnectivityAvailable);
  };

  // 使用 requestIdleCallback 或降级到 setTimeout
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(
      () => {
        setTimeout(performCheck, delay);
      },
      { timeout: delay + 50 },
    );
  } else {
    setTimeout(performCheck, delay);
  }
}

/**
 * 监听网络状态变化
 * @param onOnline - 网络恢复时的回调
 * @param onOffline - 网络断开时的回调
 * @returns 清理函数，用于移除监听器
 */
export function listenNetworkChange(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  // 防抖处理
  let debounceTimer: number | null = null;

  const debouncedOnOnline = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    // 3 秒防抖，等网络真正稳定
    debounceTimer = window.setTimeout(() => {
      onOnline();
    }, 3000);
  };

  const handleOnline = () => {
    lastOnlineStatus = true;
    lastCheckTime = Date.now();
    debouncedOnOnline();
  };

  const handleOffline = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    lastOnlineStatus = false;
    lastCheckTime = Date.now();
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}

/**
 * 清除网络状态缓存
 */
export function clearNetworkCache(): void {
  lastOnlineStatus = null;
  lastCheckTime = 0;
}
