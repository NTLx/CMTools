# CHANGELOG.md - 版本更新历史

本文件记录 CMTools 项目的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## 关于例行版本发布

**例行版本发布**（如 2.8.2、2.8.3、2.8.4 等）通常意味着更新了 CMTools 内置的一个或多个分析工具二进制文件。

**为什么看不到具体变更？** 集成的分析工具（AneuFiler、Aneu23、SMNFiler_v1/v2、UPDFiler_v1/v2、SHCarrier、STR-Matcher 等）属于独立开发的其他项目，其二进制文件不纳入本项目的 git 版本控制。因此例行版本发布时仅更新版本号，详细的工具变更日志请参阅各工具项目的发布说明。

## [2.8.6] - 2026-02-25

### 新增
- **PostHog 分析系统集成**
  - 添加遥测核心模块，支持同意管理和事件追踪
  - 支持离线事件队列，网络恢复后自动重放
  - 添加网络状态检测工具
  - 添加隐私同意弹窗组件（支持中英文）
  - 在头部添加遥测切换按钮，与同意状态同步
  - 新增 `batch_processing_summary` 事件（批次处理摘要：成功率、平均耗时）
  - 新增 `tool_error` 事件（标准化错误分类：6 种错误类型）
  - 新增 `language_changed` 事件（语言切换）
  - 新增 `theme_changed` 事件（主题切换）
  - 新增 `telemetry_changed` 事件（遥测设置变更）
- **Cookieless 模式**
  - 启用 `cookieless_mode: 'always'` 配置
  - 服务端哈希计算用户 ID，客户端不存储任何 cookie/localStorage/sessionStorage
  - 符合 GDPR 等隐私法规要求

### 优化
- 添加 `categorizeError` 辅助函数，将错误映射为 6 种标准类型：
  - `file_not_found` - 文件不存在
  - `permission_denied` - 权限拒绝
  - `format_error` - 格式错误
  - `tool_execution_error` - 工具执行错误
  - `network_error` - 网络错误
  - `unknown_error` - 未知错误

### 依赖更新
- 新增 `posthog-js` 依赖

### 文档
- `user_manual.md` - 新增「隐私与数据收集」章节
- `CLAUDE.md` - 添加 PostHog 集成和错误分类方法说明
- `README.md` - 补充遥测配置和事件说明

---

## [2.8.5] - 2026-02-10

### 依赖更新
- **前端依赖升级**
  - Vue 3.5.28
  - TypeScript 5.9.3
  - TailwindCSS 4.2.0
- **Tauri 依赖升级**
  - tauri 2.10.2
  - tauri-build 2.5.5
  - tauri-plugin-opener 2.5.3
  - @tauri-apps/cli 2.10.0
  - @tauri-apps/api 2.10.2
- **Rust 依赖升级**
  - md5 crate 0.8

---

## [2.8.4] - 2026-02-10

### 例行发布
- 更新内置分析工具二进制文件
- 更新所有配置文件中的版本号

---

## [2.8.3] - 2026-01-28

### 例行发布
- 更新内置分析工具二进制文件
- 更新所有配置文件中的版本号

---

## [2.8.2] - 2026-01-26

### 例行发布
- 更新内置分析工具二进制文件
- 更新所有配置文件中的版本号

---

## [2.8.1] - 2026-01-21

### 优化
- **STR-Matcher Windows 优化**
  - 前端启用"Windows 系统优化"复选框配置
  - 后端支持优化参数传递，利用默认匹配机制自动传递 `-GBK` 参数

### 文档
- 更新用户手册以包含 STR-Matcher 工具说明
- `CLAUDE.md` - 新增「最佳实践」章节，说明配置驱动架构及前后端同步规范

---

## [2.8.0] - 2026-01-20

### 新增
- **STR-Matcher 工具集成**
  - 后端 `Tool` 枚举添加 `StrMatcher` 成员
  - 跨平台二进制嵌入（Windows/macOS/Linux）
  - 新增 `tolerance` 参数支持（数值容差）
  - 参数传递逻辑：仅当 tolerance > 0 时传递 `-t` 参数
  - 前端添加 `ToolType.STRMatcher` 枚举
  - 实现 Tolerance 输入框（数字类型、支持小数、最小值为 0）
  - 扩展 `ProcessOptions` 和 `ToolConfig` 接口

### 优化
- **资源文件管理**
  - 精简并统一资源文件存放位置至 `src/assets/` 目录
  - 删除整个 `public/` 目录（移除重复的 logo.png 和未使用的 tauri.svg、vite.svg）
  - 删除 `src/assets/vue.svg`
  - 更新 `index.html` 中的网站图标引用
- **文档治理**
  - 创建 `CLAUDE.md`（380 行），整合开发规范
  - 删除 `.cargo/config.toml`、`.trae/rules/project_rules.md`、`.vercel/project.json`
  - 删除 `IFLOW.md` 和 `DesignStyle/` 目录（3 个 md 文件）

### 文档
- 更新项目文档以反映资源文件结构调整
- 在 `CLAUDE.md` 中补充 Tool 枚举中缺失的 STR-Matcher 工具说明

---

## [2.7.3] - 2026-01-16

### 修复
- **Tauri 插件版本同步**
  - 将 `@tauri-apps/plugin-dialog` 从 ^2.5.0 升级至 ^2.6.0
  - 将 `tauri-plugin-dialog` 从 2.5.0 升级至 2.6.0
  - 修复 32 位和 Windows 7 兼容版本构建时的版本不匹配错误

### 优化
- 优化 `.gitignore` 配置，添加 `target/` 目录（减少 Git 仓库体积）

### 文档
- 更新 README、用户手册中的版本号为 2.7.3

---

## [2.7.2] - 2026-01-12

### 修复
- **Tauri 插件版本不匹配**
  - 同步 Rust 端和 NPM 端的 `tauri-plugin-dialog` 版本至 2.5.0
  - 修复构建错误：`Found version mismatched Tauri packages`

### 变更
- 将 `package-lock.json` 添加到 `.gitignore`

---

## [2.7.1] - 2026-01-08

### 新增
- 更新 SMNFiler_v2 工具至 v2.2.4 版本

### 文档
- 优化项目文档以支持跨平台并精简内容
  - README.md：更新架构描述，精简构建配置章节
  - user_manual.md：从 524 行精简至 324 行

---

## [2.7.0] - 2026-01-08

### 新增
- **跨平台构建支持**
  - 实现跨平台构建支持和二进制文件自动更新机制
  - 优化跨平台构建脚本，生成便携版软件包
  - 添加平台和架构自动检测逻辑
  - 改进构建产物路径查找逻辑（Windows/macOS/Linux）

### 优化
- **构建缓存管理**
  - 优化构建缓存管理和二进制文件更新机制
  - 新增 `clean-build-cache.cjs` 脚本，支持三种清理模式（cargo、frontend、all）
  - 添加 npm 命令：`clean:cache`、`clean:cache:cargo`、`clean:cache:frontend`
- **运行时改进**
  - 改为强制重新复制二进制文件，每次构建都无条件复制
  - 使用时间戳哈希强制每次构建都触发重新编译
  - 移除临时文件大小匹配检查
  - 添加应用关闭时清理临时文件的功能
- **配置优化**
  - 修复模态框背景样式问题（使用 `<Teleport to='body'>`）
  - 添加 `dmg` 到 tauri bundle targets

### 依赖
- 移除 `md5` crate 依赖

---

## [2.6.9] - 2025-12-30

### 新增
- **UI/UX 改进**
  - 统一头部按钮样式（Help、Language、Theme）使用纯图标设计
  - 实现 Toast 通知（清除结果、复制日志操作）
  - 修复主题状态管理和持久化

### 修复
- 修改详细运行日志描述文本（去除参数说明）

### 文档
- README.md：更新版本号为 2.6.9，添加 Tailwind CSS v4 到技术栈
- user_manual.md：记录新的图标化工具栏，添加结果面板操作说明

---

## [2.6.8] - 2025-12-30

### 修复
- **UPDFiler_v2 参数变更**
  - 集成 UPDFiler_v2 v2.5.8 版本
  - 修改参数从 `-verbose` 改为 `-dev`
  - 更新界面参数描述文本

---

## [2.6.7] - 2025-12-22

### 新增
- 集成 UPDFiler_v2 v2.5.7 版本

---

## [2.6.6] - 2025-12-16

### 新增
- 更新 UPDFiler_v2 至 v2.5.6 版本
- **工具版本号显示功能**
  - 后端新增 `get_tool_version` 命令
  - 前端在版本对话框中显示当前工具及版本号
  - 支持中英文界面，包含加载状态和错误处理

---

## [2.6.5] - 2025-12-15

### 依赖更新
- SHCarrier.exe 升级为 v1.6.1

---

## [2.6.4] - 2025-11-19

### 新增
- **详细日志选项**
  - 为 UPDFiler_v2 工具添加支持传入 `-verbose` 参数
  - 前端增加"输出详细运行日志文件"复选框（仅 UPDFiler_v2 可见）
  - 更新 `process_files` 接口添加 `verboseLog` 参数

### 修复
- 修正 Logo 图片路径（`assets/` → `src/assets/`）

### 文档
- 重新整理并完整翻译用户手册成中文版本
- 补充常见问题与故障排除章节
- 添加 Windows 安全警告处理方法

### 依赖更新
- 更新 Tauri 相关依赖
- 移除 Windows 7 兼容配置（仍保留构建时的配置）

### 删除
- 删除过时的兼容性和构建文档（4 个文件）

---

## [2.6.2] - 2025-11-10

### 新增
- 更新 SMNFiler_v2 分析工具

### 优化
- 整理项目资源文件路径结构
  - 将 `Cubicise.Logo.png` 从根目录移动到 `src/assets/`
  - 更新 Rust 后端代码中 7 个可执行文件的引用路径

---

## [2.6.1] - 2025-10-21

### 新增
- **设计系统文档**
  - 微软 Fluent 设计系统核心原则与实现指南
  - 苹果人机界面指南核心原则与设计规范
  - Google Material You 设计指南文档

### 优化
- **界面样式**
  - 优化界面样式并实现动态翻译结果消息
  - 新增 `getLocalizedResultMessage` 函数
  - 统一使用 Material You 设计系统色彩变量
  - 优化动画样式（缩短时间、调整曲线）
  - 主要字体使用 Roboto
  - 响应式布局调整

### 文档
- 针对 iFlow CLI 工具添加 CMTools 项目详细文档

---

## [2.6.0] - 2025-09-18

### 新增
- **SMNFiler_v2 工具支持**
  - 新增 SMNFiler_v2 工具及对应的可执行文件
  - 添加 `Tool` 枚举成员
  - 添加特有的命令行参数处理逻辑
  - 支持标准品样本名称和 Windows 系统编码优化
  - 峰面积数据选项：SMNFiler_v2 不支持

### 文档
- 修正用户手册，新增 SMNFiler_v2 使用说明
- 更新版本号为 2.6.0

---

## [2.5.1] - 2025-09-17

### 优化
- **默认参数优化**
  - 为 AneuFiler、Aneu23 和 SHCarrier 添加默认 `-dev` 参数
  - 提升兼容性和稳定性
  - 调整日志输出，增加调试信息

---

## [2.5.0] - 2025-09-17

### 新增
- **多架构构建支持**
  - 添加多架构 Windows 构建脚本及相关 npm 命令
  - 新增 `scripts/build-multi-arch.cjs`
  - 支持 32 位和 64 位 Windows 版本
  - 自动检测并安装缺失的 Rust target

### 优化
- **构建脚本**
  - 优化构建脚本及完善文档说明
  - 拆分当前系统构建和全平台构建脚本
  - 新增 Windows 多版本构建脚本（含 Windows 7 兼容版）
  - 调整 `package.json` 构建命令
- **UI**
  - 移除打字机动画相关代码
  - 降级 tauri-build 依赖（2.4.2 → 2.4.1）

### 文档
- 增加多架构构建支持及文档说明
- 新增详细版本选择指南文档
- 新增 Windows 7 兼容性解决方案文档

---

## [2.4.0] - 2025-09-05

### 新增
- **UPDFiler_v1 工具支持**

### 变更
- **工具重命名**
  - SMNFiler → SMNFiler_v1
  - UPDFiler → UPDFiler_v2

### 优化
- 扩展 Windows 优化支持范围（涵盖 UPDFiler_v1 和 UPDFiler_v2）
- 调整峰面积数据参数逻辑

### 文档
- 同步更新文档和用户手册

---

## [2.3.1] - 2025-08-25

### 依赖更新
- **Rust 版本升级**
  - Rust Edition 2024
  - Tauri 2.8.3 及相关插件
- **Node 依赖升级**
  - @tauri-apps/api 插件 2.8.0
  - @types/node 24.3.0

### 变更
- 修改开发服务器地址为 `http://127.0.0.1:5173`

---

## [2.3.0] - 2025-08-22

### 新增
- **新版 UPDFiler 分析工具**
  - 升级到基于新版算法全新开发的 UPDFiler
  - 支持 Windows 优化配置

### 变更
- UPDFiler 不再支持峰面积数据选项
- 调整 `supportsAreaData` 字段控制

### 优化
- 处理流程中根据工具类型动态控制峰面积数据
- 修正调试日志输出

### 文档
- 更新用户手册说明

---

## [2.2.0] - 2025-08-11

### 新增
- **工具扩展**
  - 添加（旧版）SMNFiler 工具支持
  - 添加 UPDFiler 工具支持
  - 添加工具二进制文件和前端界面支持
  - 实现工具特有的参数处理和配置选项

### 优化
- 版本显示为可点击的版本更新按钮

---

## [2.1.1] - 2025-07-25

### 新增
- Vercel 项目配置文件

### 优化
- **UI 样式**
  - 添加语言切换动画（淡入淡出效果）
  - 现代化 UI 样式（玻璃拟态效果）
  - 优化按钮交互效果（悬停动画、微交互）
  - 改进颜色系统和阴影效果

### 文档
- 更新错误处理部分的文档内容
- 添加 Windows 安全警告相关 FAQ 说明

---

## [2.1.0] - 2025-07-16

### 新增
- **文件目录打开功能**
  - 结果项中点击打开文件所在目录
  - 多语言支持的错误消息

### 优化
- **界面重构**
  - 重构主界面布局为左右面板结构
  - 添加响应式设计（窄屏自动切换垂直布局）
  - 统一滚动条样式
  - 改进 UI 样式，隐藏 Windows 命令行窗口
- **架构重构**
  - 重构工具处理逻辑
  - 使用枚举和接口增强类型安全
  - 后端实现自定义错误处理（`ProcessError` 类型）
  - 改进翻译系统
  - 支持并行处理
  - 升级 Rust 至 2024 edition，添加 `thiserror` 依赖

### 文档
- 更新 README 文档
- 添加用户手册文档
- 修复 Windows 文件目录打开问题

---

## [2.0.1] - 2025-07-16

### 新增
- 文件目录打开功能
- 相关翻译文本和样式优化

---

## [2.0.0] - 2025-07-15

### 重大变更
- **从 Electron 迁移到 Tauri 2.0**
  - 添加 Vue 3 前端框架
  - 添加 Tauri 2.0 后端框架
  - 更新应用标识符为 `com.cmtools.desktop`

### 新增
- 文件选择和处理功能
- 多语言支持（中英文）
- 主题切换功能（跟随系统）
- 核心工具支持：
  - AneuFiler
  - Aneu23
  - SHCarrier

### 优化
- 清空主分支并重新初始化
- 优化 Trae 规则

### 文档
- 添加完整项目文档
- 添加 LICENSE 文件
- 配置构建系统和 CI/CD

---

## [1.1.0] - 2025-07-03

### 新增
- **处理中状态样式**
  - 添加 processing 状态 CSS 样式
  - 完善状态类处理逻辑

### 依赖更新
- SHCarrier.exe 升级为 v1.5.1
- AneuFiler 输出结果调整为一行一个样本

---

## [1.0.0] - 2025-06-18

### 新增
- **基础功能**
  - 工具选择器界面
  - 文件上传和处理逻辑
  - 错误报告页面
  - 自动主题切换（跟随系统）

### 功能迭代
- 升级 Electron 至 v37.1.0
- 实现主题切换功能和持久化存储
- 添加帮助按钮
- 添加主题状态获取功能

### 文档
- 添加主题偏好自动保存功能说明
- 更新构建和启动命令文档
- 更新项目规则和 README 格式规范

### 其他
- 更新项目许可证为 CC-BY-NC-SA-4.0
- 添加更多 gitignore 规则
- 更新帮助文档链接

---

## 版本演进总结

| 版本系列 | 时间跨度 | 主要特性 |
|---------|---------|---------|
| v1.x (Electron) | 2025.06-2025.07 | 基础功能搭建、主题切换、帮助系统 |
| v2.0.x (Tauri) | 2025.07 | 从 Electron 迁移到 Tauri 2.0 |
| v2.1.x | 2025.07 | 界面重构、文件目录打开、多语言支持 |
| v2.2.x-v2.3.x | 2025.08 | SMNFiler、UPDFiler 工具链扩展 |
| v2.4.x-v2.5.x | 2025.09 | 工具版本细分、多架构构建支持 |
| v2.6.x-v2.7.x | 2025.10-2026.01 | UPDFiler_v2/SMNFiler_v2 迭代、跨平台构建优化 |
| v2.8.x | 2026.01-至今 | STR-Matcher 工具、PostHog 分析系统 |

**项目统计**：
- 总计 103+ 次提交
- 28 个发布版本
- 8 个数据处理工具（AneuFiler、Aneu23、SMNFiler_v1/v2、UPDFiler_v1/v2、SHCarrier、STR-Matcher）
- 3 个平台支持（Windows、macOS、Linux）
