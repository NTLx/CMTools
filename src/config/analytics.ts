/**
 * PostHog 分析配置
 *
 * 配置方式：
 * 1. 复制 .env.example 为 .env
 * 2. 在 .env 中设置 VITE_POSTHOG_PROJECT_TOKEN
 *
 * 安全说明：
 * - Project Token 在编译时注入到前端代码中
 * - .env 文件已在 .gitignore 中，不会被提交
 * - 建议在 PostHog 控制台设置域名白名单限制 Token 的使用范围
 */

// PostHog 配置
export const analyticsConfig = {
  // PostHog Project Token
  // 格式：phc_xxxxxxxxxxxx
  // 获取方式：PostHog 控制台 -> 项目设置 -> Project API Key
  // 构建时从 .env 或 CI/CD 环境变量读取
  projectToken: import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || '',

  // PostHog API Host
  // 默认使用美国区域，欧盟区域请设置为 https://eu.i.posthog.com
  apiHost: import.meta.env.VITE_POSTHOG_API_HOST || 'https://us.i.posthog.com',
};

/**
 * 检查是否已配置 Project Token
 */
export function isAnalyticsConfigured(): boolean {
  return analyticsConfig.projectToken.length > 0;
}
