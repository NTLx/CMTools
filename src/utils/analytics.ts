/**
 * PostHog 分析管理器
 * 负责初始化管理、事件追踪、离线事件队列、用户授权状态管理
 */

import posthog from 'posthog-js';
import { scheduleNetworkCheck, listenNetworkChange, isOnline } from './network-guard';
import { analyticsConfig } from '../config/analytics';

// 配置类型
interface AnalyticsConfig {
  projectToken: string;
  apiHost: string;
}

// 授权状态类型
interface ConsentRecord {
  status: 'granted' | 'declined';
  timestamp: number;
  version: string;
}

// 事件类型定义
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

// 授权状态变化回调类型
export type ConsentChangeCallback = (status: 'granted' | 'declined' | null) => void;

// LocalStorage 键名
const CONSENT_KEY = 'analytics_consent';
const OFFLINE_EVENTS_KEY = 'analytics_offline_events';
const MAX_OFFLINE_EVENTS = 100; // 最大离线事件数

// 模块状态
let config: AnalyticsConfig = {
  projectToken: analyticsConfig.projectToken,
  apiHost: analyticsConfig.apiHost,
};
let isInitialized = false;
let consentCallbacks: ConsentChangeCallback[] = [];
let cleanupNetworkListener: (() => void) | null = null;

/**
 * 获取平台信息（替代已弃用的 navigator.platform）
 * @returns 平台标识字符串
 */
function getPlatformInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * 设置配置
 * @param newConfig - 新的配置对象
 */
export function setConfig(newConfig: Partial<AnalyticsConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * 获取当前授权状态
 * @returns 授权状态，null 表示未设置
 */
export function getConsentStatus(): 'granted' | 'declined' | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const record: ConsentRecord = JSON.parse(stored);
    return record.status;
  } catch {
    return null;
  }
}

/**
 * 设置授权状态
 * @param status - 授权状态
 */
export function setConsentStatus(status: 'granted' | 'declined'): void {
  const record: ConsentRecord = {
    status,
    timestamp: Date.now(),
    version: '1.0',
  };

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    // LocalStorage 不可用时静默失败
  }

  // 触发回调
  consentCallbacks.forEach((cb) => cb(status));

  // 如果同意，尝试初始化
  if (status === 'granted') {
    initPostHog();
  }
}

/**
 * 注册授权状态变化回调
 * @param callback - 回调函数
 * @returns 清理函数
 */
export function onConsentChange(callback: ConsentChangeCallback): () => void {
  consentCallbacks.push(callback);
  return () => {
    consentCallbacks = consentCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * 初始化 PostHog
 */
function initPostHog(): void {
  if (isInitialized) return;
  if (!config.projectToken) {
    console.warn('[Analytics] Project Token 未配置，跳过初始化');
    return;
  }

  try {
    posthog.init(config.projectToken, {
      api_host: config.apiHost,
      autocapture: false, // 禁用自动捕获，手动控制
      persistence: 'localStorage', // 使用 localStorage 持久化
      disable_session_recording: false,
      capture_exceptions: true, // 自动捕获未处理的 JavaScript 异常
      cookieless_mode: 'always', // 启用无 cookie 模式，使用服务端哈希计算用户 ID
      loaded: (ph) => {
        isInitialized = true;
        console.log('[Analytics] PostHog 初始化成功');

        // 发送离线期间缓存的事件
        flushOfflineEvents();

        // 发送应用启动事件
        ph.capture('app_started', {
          app_version: (globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ || 'unknown',
          platform: getPlatformInfo(),
          language: navigator.language,
        });
      },
    });
  } catch (error) {
    console.warn('[Analytics] PostHog 初始化失败:', error);
  }
}

/**
 * 发送离线期间缓存的事件
 */
function flushOfflineEvents(): void {
  try {
    const stored = localStorage.getItem(OFFLINE_EVENTS_KEY);
    if (!stored) return;

    const events: AnalyticsEvent[] = JSON.parse(stored);
    if (events.length === 0) return;

    events.forEach((event) => {
      try {
        posthog.capture(event.name, event.properties || {});
      } catch {
        // 静默失败
      }
    });

    // 清空缓存
    localStorage.removeItem(OFFLINE_EVENTS_KEY);
    console.log(`[Analytics] 已发送 ${events.length} 个离线事件`);
  } catch {
    // 静默失败
  }
}

/**
 * 缓存离线事件
 * @param event - 事件对象
 */
function cacheOfflineEvent(event: AnalyticsEvent): void {
  try {
    const stored = localStorage.getItem(OFFLINE_EVENTS_KEY);
    let events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    // 添加新事件
    events.push(event);

    // 限制最大数量，移除最旧的事件
    if (events.length > MAX_OFFLINE_EVENTS) {
      events = events.slice(-MAX_OFFLINE_EVENTS);
    }

    localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // LocalStorage 满或不可用时静默失败
  }
}

/**
 * 追踪事件（核心方法）
 * @param eventName - 事件名称
 * @param properties - 事件属性
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  // 如果未初始化且在线，缓存事件
  if (!isInitialized) {
    if (isOnline()) {
      cacheOfflineEvent({ name: eventName, properties });
    }
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch {
    // 静默失败
  }
}

/**
 * 追踪工具选择事件
 */
export function trackToolSelected(
  toolName: string,
  previousTool?: string,
): void {
  trackEvent('tool_selected', {
    tool_name: toolName,
    previous_tool: previousTool,
  });
}

/**
 * 追踪文件选择事件
 */
export function trackFilesSelected(fileCount: number, toolName: string): void {
  trackEvent('files_selected', {
    file_count: fileCount,
    tool_name: toolName,
  });
}

/**
 * 追踪处理开始事件
 */
export function trackProcessingStarted(
  toolName: string,
  fileCount: number,
  options: Record<string, unknown>,
): void {
  trackEvent('processing_started', {
    tool_name: toolName,
    file_count: fileCount,
    options,
  });
}

/**
 * 追踪处理完成事件
 */
export function trackProcessingCompleted(
  toolName: string,
  fileCount: number,
  durationMs: number,
  successCount: number,
): void {
  trackEvent('processing_completed', {
    tool_name: toolName,
    file_count: fileCount,
    duration_ms: durationMs,
    success_count: successCount,
  });
}

/**
 * 追踪处理失败事件
 */
export function trackProcessingFailed(
  toolName: string,
  errorType: string,
  errorMessage: string,
): void {
  trackEvent('processing_failed', {
    tool_name: toolName,
    error_type: errorType,
    error_message: errorMessage,
  });
}

/**
 * 追踪设置变更事件
 */
export function trackSettingsChanged(
  settingName: string,
  oldValue: unknown,
  newValue: unknown,
): void {
  trackEvent('settings_changed', {
    setting_name: settingName,
    old_value: oldValue,
    new_value: newValue,
  });
}

/**
 * 追踪批次处理摘要事件
 * @param toolName - 工具名称
 * @param totalFiles - 总文件数
 * @param successCount - 成功数量
 * @param failureCount - 失败数量
 * @param totalDurationMs - 总耗时（毫秒）
 */
export function trackBatchProcessingSummary(
  toolName: string,
  totalFiles: number,
  successCount: number,
  failureCount: number,
  totalDurationMs: number,
): void {
  trackEvent('batch_processing_summary', {
    tool_name: toolName,
    total_files: totalFiles,
    success_count: successCount,
    failure_count: failureCount,
    total_duration_ms: totalDurationMs,
    avg_time_per_file_ms: totalFiles > 0 ? Math.round(totalDurationMs / totalFiles) : 0,
    success_rate: totalFiles > 0 ? (successCount / totalFiles) : 0,
  });
}

/**
 * 追踪工具错误事件（标准化错误分类）
 * @param toolName - 工具名称
 * @param errorCategory - 错误分类
 * @param errorCode - 错误代码
 * @param fileExtension - 文件扩展名（可选）
 * @param isRetry - 是否重试
 */
export function trackToolError(
  toolName: string,
  errorCategory: string,
  errorCode: string,
  fileExtension?: string,
  isRetry: boolean = false,
): void {
  trackEvent('tool_error', {
    tool_name: toolName,
    error_category: errorCategory,
    error_code: errorCode,
    file_extension: fileExtension,
    is_retry: isRetry,
  });
}

/**
 * 追踪语言切换事件
 * @param from - 原语言
 * @param to - 新语言
 */
export function trackLanguageChanged(
  from: 'zh' | 'en',
  to: 'zh' | 'en',
): void {
  trackEvent('language_changed', {
    from,
    to,
  });
}

/**
 * 追踪主题切换事件
 * @param from - 原主题
 * @param to - 新主题
 */
export function trackThemeChanged(
  from: 'light' | 'dark',
  to: 'light' | 'dark',
): void {
  trackEvent('theme_changed', {
    from,
    to,
  });
}

/**
 * 追踪遥测设置变更事件
 * @param enabled - 是否启用
 * @param reason - 变更原因
 */
export function trackTelemetryChanged(
  enabled: boolean,
  reason?: 'user_action' | 'first_launch',
): void {
  trackEvent('telemetry_changed', {
    enabled,
    reason: reason || 'user_action',
  });
}

/**
 * 检查并初始化分析服务
 * 应在应用启动后异步调用
 * @param onShowConsentModal - 显示授权弹窗的回调
 */
export function initAnalytics(onShowConsentModal: () => void): void {
  // 设置网络状态监听
  cleanupNetworkListener = listenNetworkChange(
    () => {
      // 网络恢复时，检查授权状态
      const consent = getConsentStatus();
      if (consent === 'granted') {
        initPostHog();
      } else if (consent === null) {
        // 未授权且首次在线，显示弹窗
        onShowConsentModal();
      }
    },
    () => {
      // 网络断开时，静默处理
    },
  );

  // 延迟检测网络状态（非阻塞）
  scheduleNetworkCheck((online) => {
    if (!online) {
      // 离线时，静默等待网络恢复
      return;
    }

    // 在线时，检查授权状态
    const consent = getConsentStatus();

    if (consent === 'granted') {
      // 已授权，直接初始化
      initPostHog();
    } else if (consent === null) {
      // 未授权，显示弹窗
      onShowConsentModal();
    }
    // 如果是 declined，静默跳过
  });
}

/**
 * 清理资源
 */
export function cleanup(): void {
  if (cleanupNetworkListener) {
    cleanupNetworkListener();
    cleanupNetworkListener = null;
  }
  consentCallbacks = [];
}

/**
 * 检查是否已初始化
 */
export function isAnalyticsInitialized(): boolean {
  return isInitialized;
}
