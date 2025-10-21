# CMTools 项目文档

## 项目概述

CMTools 是一个现代化的色谱数据处理工具集，基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台、高性能桌面应用。该项目专为数据分析设计，提供多种核心工具（AneuFiler、Aneu23、SMNFiler_v1、SMNFiler_v2、SHCarrier、UPDFiler_v1、UPDFiler_v2），并支持通过外部可执行文件进行功能扩展。

### 技术架构
- **前端**: Vue 3.5 + TypeScript 5.6 + Vite 6.0
- **后端**: Rust (Edition 2024) + Tauri 2.8 + Tokio
- **核心依赖**: serde, tauri-plugin-dialog, tauri-plugin-opener

### 项目结构
```
CMTools/
├── src/                    # Vue 前端源码
│   ├── App.vue            # 核心 UI 组件
│   └── main.ts            # Vue 应用入口
├── src-tauri/             # Tauri 后端源码 (Rust)
│   ├── src/
│   │   ├── main.rs        # Rust 应用主入口
│   │   └── lib.rs         # 核心业务逻辑
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 应用核心配置
├── scripts/               # 构建脚本集合
└── 各种文档文件
```

## 构建和运行

### 环境要求
- Node.js ^18.0.0 或更高版本
- Rust ^1.70.0 或更高版本
- Windows 10 版本1809 (17763)或更高，macOS 10.15+, 或主流 Linux 发行版
- Microsoft Edge WebView2运行时（Windows系统）

### 开发模式
```bash
npm install          # 安装依赖
npm run tauri dev    # 启动开发模式（带热重载）
```

### 构建命令
| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `npm run tauri:build` | 构建当前系统环境匹配的版本 | 日常开发和测试 |
| `npm run tauri:build:win` | 构建所有Windows版本 | Windows平台发布 |
| `npm run tauri:build:all` | 构建所有支持的平台版本 | 多平台完整发布 |

### 构建产物
- **64位版本**: `CMTools.x64.exe`
- **32位版本**: `CMTools.x86.exe`
- **Windows 7兼容版**: `CMTools.Win7.x86.exe`

## 开发约定

### 代码规范
- **TypeScript/Vue**: 使用 ESLint 保证代码质量，遵循 Composition API 和 `<script setup>` 语法
- **Rust**: 使用 `cargo fmt` 格式化代码，遵循官方编码风格和 `clippy` 建议
- **提交信息**: 遵循 Conventional Commits 规范

### 核心架构：外部工具驱动
CMTools 通过 Rust 后端调用外部的命令行可执行文件（.exe）来完成核心数据处理任务：
1. **工具嵌入**: 外部工具被放置在 `src-tauri` 目录下，构建时通过 `include_bytes!` 宏嵌入到可执行文件中
2. **运行时释放**: 从内存中读取二进制数据，写入临时目录
3. **命令调用**: 使用 `std::process::Command` 执行临时文件
4. **结果返回**: 捕获输出并返回给前端界面

### 前后端交互
使用 Tauri 的 `invoke` 机制进行通信：
- **后端命令**: `process_files` 和 `open_file_directory` (定义在 `src-tauri/src/lib.rs`)
- **前端调用**: 通过 `invoke` 函数调用后端命令

### 国际化支持
- **前端**: `t('key')` 函数用于翻译界面文本
- **后端**: `get_message(&language, "message_key")` 用于获取本地化消息

## 添加新工具

1. 将新的 `.exe` 文件放置在 `src-tauri/` 目录下
2. 在 `src-tauri/src/lib.rs` 的 `process_files` 函数中添加工具嵌入代码
3. 定义工具的命令行参数处理逻辑
4. 在 `src/App.vue` 中将工具添加到 `tools` 数组
5. 如需新的 UI 选项，添加相应的 `ref` 和 HTML 元素

## 调试技巧

- **查看后端日志**: 开发模式下，`println!` 输出会显示在控制台中
- **检查临时文件**: 在系统临时目录查找 `cmtools_*.exe` 文件
- **多架构构建调试**: 查看脚本控制台输出了解构建进度

## 测试

- **Rust 单元测试**: `cd src-tauri && cargo test`
- **前端单元测试**: `npm run test`
- **端到端测试**: 使用 Tauri 的 WebDriver 支持（待完善）

## 部署

项目配置了 GitHub Actions，可在推送 `v*` 标签时自动构建、打包和创建 Release。

对于 Windows 平台，推荐使用多架构构建脚本：
```bash
npm run tauri:build  # 一键构建32位和64位版本
```

## 相关资源

- 用户手册: `user_manual.md`
- 版本选择指南: `VERSION_SELECTION_GUIDE.md`
- Windows 7兼容性说明: `WINDOWS7_COMPATIBILITY.md`
- 构建配置选项: `build-config-options.md`
- Tauri 官方文档: https://tauri.app/
- Vue 3 官方文档: https://vuejs.org/
- Rust 官方文档: https://doc.rust-lang.org/

## 许可证

本项目采用 MIT 许可证 - 查看 `LICENSE` 文件了解详情。