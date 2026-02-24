# CMTools

<div align="center">
  <img src="src/assets/Cubicise.Logo.png" alt="CMTools Logo" width="120" height="120">
  <h3>现代化的色谱数据处理工具集</h3>
  <p>基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台、高性能桌面应用</p>
  
  [![Version](https://img.shields.io/badge/version-2.8.5-blue.svg)](https://github.com/Cubicise/CMTools)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Tauri](https://img.shields.io/badge/Tauri-2.9-orange.svg)](https://tauri.app/)
  [![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)](https://vuejs.org/)
</div>

## 📋 项目简介

CMTools 是一个基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台桌面应用，专为色谱数据处理而设计。采用前后端分离架构，通过 Rust 后端调用外部命令行工具实现核心数据处理功能。

**架构特点：**
- **前端**：Vue 3 (Composition API) + TypeScript + Vite，提供现代化的用户界面
- **后端**：Rust + Tauri + Tokio，确保高性能和内存安全
- **扩展性**：通过外部可执行文件机制（Windows下为.exe，Unix系无后缀），支持灵活添加新的数据处理工具

**核心优势：**
- 🚀 **高性能**：Rust 后端可快速处理大型数据集
- 🛠️ **可扩展**：清晰的架构设计，易于添加新工具
- 🌍 **跨平台**：支持 Windows、macOS 和 Linux
- 📦 **绿色软件**：无需安装，开箱即用

> **用户指南**：如需了解如何使用 CMTools，请查阅 [user_manual.md](user_manual.md)

## 🏗️ 技术架构

CMTools 采用前后端分离的现代桌面应用架构，利用 Tauri 将基于 Web 技术的 Vue 前端与高性能的 Rust 后端相结合。

### 技术栈概览

- **前端**：Vue 3.5 + TypeScript 5.6 + Vite 6.0 + Tailwind CSS 4.1
- **后端**：Rust (Edition 2024) + Tauri 2.9 + Tokio 1.0
- **核心依赖**：serde, tauri-plugin-dialog, tauri-plugin-opener

**版本信息**：详见 [package.json](package.json) 和 [src-tauri/Cargo.toml](src-tauri/Cargo.toml)

### 项目结构详解

```
CMTools/
├── src/                      # Vue 前端源码
│   ├── App.vue               # 核心 UI 组件
│   ├── main.ts               # Vue 应用入口
│   └── assets/               # 资源文件（工具二进制文件和图片资源）
│       ├── Cubicise.Logo.png # 项目 Logo
│       ├── AneuFiler         # 数据处理核心工具 (Windows版需为.exe)
│       ├── Aneu23
│       ├── SMNFiler_v1
│       ├── SMNFiler_v2
│       ├── SHCarrier
│       ├── STR-Matcher
│       ├── UPDFiler_v1
│       └── UPDFiler_v2
├── src-tauri/                # Tauri 后端源码 (Rust)
│   ├── src/
│   │   ├── main.rs           # Rust 应用主入口
│   │   └── lib.rs            # 核心业务逻辑 (命令处理、工具调用)
│   ├── Cargo.toml            # Rust 依赖配置
│   └── tauri.conf.json       # Tauri 应用配置
├── scripts/                  # 构建与维护脚本
│   ├── build-current-system.cjs # 构建当前系统版本
│   ├── build-windows-all.cjs    # 构建 Windows 全架构版本
│   ├── build-all-platforms.cjs  # 构建全平台版本
│   └── clean-build-cache.cjs    # 清理构建缓存
├── user_manual.md            # 用户手册
└── package.json              # Node.js 配置
```

## 🚀 开发环境搭建

### 前置要求

- **Node.js**: ^18.0.0
- **Rust**: ^1.70.0 (通过 [rustup](https://rustup.rs/) 安装)
- **操作系统**: Windows 10 1809+ / macOS 10.15+ / Linux
- **Windows 额外要求**: Microsoft Edge WebView2 运行时

### 快速开始

```bash
# 克隆项目
git clone https://github.com/Cubicise/CMTools.git
cd CMTools

# 安装依赖
npm install

# 启动开发服务器（带热重载）
npm run tauri dev
```

**首次构建前**: 如需构建32位版本，需安装Rust目标：`rustup target add i686-pc-windows-msvc`

## 🔨 构建与维护命令

### 构建命令

| 命令 | 输出 | 说明 |
|------|------|------|
| `npm run tauri:build` | `CMTools.x64.exe` 或 `CMTools.x86.exe` | 构建当前系统匹配的版本 |
| `npm run tauri:build:win` | 所有Windows版本（含Win7兼容版） | Windows平台发布 |
| `npm run tauri:build:all` | 所有支持的平台 | 多平台发布 |

### 维护命令

| 命令 | 说明 |
|------|------|
| `npm run clean:cache` | 清理所有构建缓存（Cargo + Frontend） |
| `npm run clean:cache:cargo` | 仅清理 Rust/Cargo 构建缓存 |
| `npm run clean:cache:frontend` | 仅清理前端构建缓存 |

**构建产物**（Windows示例）：
- 64位: `CMTools.x64.exe`
- 32位: `CMTools.x86.exe`
- Win7兼容: `CMTools.Win7.x86.exe`

构建脚本会自动处理文件重命名和复制到项目根目录。

### Windows版本选择指南

我们为不同的Windows系统提供了3个专门优化的版本：

| 版本文件名 | 目标系统 | 架构 | 推荐用户 |
|----------|----------|------|----------|
| **CMTools.x64.exe** | Windows 10+ (64位) | x86_64 | 现代系统用户(推荐) |
| **CMTools.x86.exe** | Windows 10+ (32位) | x86 | 低配置现代系统 |
| **CMTools.Win7.x86.exe** | Windows 7 SP1+ (32位) | x86 | 老旧系统用户 |

## 🛠️ 开发指南

### 代码规范

- **前端**: Vue 3 Composition API + TypeScript
- **后端**: Rust (cargo fmt + clippy)
- **提交信息**: Conventional Commits

### 核心架构：外部工具驱动设计

CMTools 的核心功能是通过 Rust 后端调用 `src/assets/` 中嵌入的命令行工具来实现的。这种设计极大地提高了系统的灵活性和可扩展性。

**工作原理：**

1.  **编译期嵌入**：
    - 根据目标操作系统 (`target_os`)，Rust 宏 `include_bytes!` 会将对应的二进制工具文件直接编译进最终的可执行文件中。
    - **Windows**: 寻找 `.exe` 后缀的文件（如 `AneuFiler.exe`）。
    - **macOS/Linux**: 寻找无后缀的文件（如 `AneuFiler`）。

2.  **运行时释放**：
    - 当用户请求执行某个工具时，后端会将嵌入的二进制数据释放到系统的临时目录（如 Windows 的 `%TEMP%`）。
    - 临时文件命名格式：`cmtools_[ToolName][_Suffix]`。

3.  **命令调用**：
    - 通过 Rust 的 `std::process::Command` 执行临时文件。
    - 后端负责构造命令行参数，捕获标准输出 (stdout) 和标准错误 (stderr)。

**关键文件**：
- `src-tauri/src/lib.rs` - **核心逻辑**：定义了 `Tool` 枚举、参数处理逻辑 (`process_files_internal`) 以及错误处理 (`ProcessError`)。
- `src/App.vue` - **前端交互**：负责 UI 展示、参数收集并通过 `invoke` 调用后端。

### 如何添加新工具

以添加名为 `NewTool` 的工具为例：

**1. 准备工具文件**
```bash
# Windows
cp NewTool.exe src/assets/

# macOS/Linux
cp NewTool src/assets/
```

**2. 后端注册（src-tauri/src/lib.rs）**

在 `Tool` 枚举中添加新成员，并在 `exe_name` 和 `exe_data` 方法中添加对应的 `match` 分支：

```rust
// 1. 添加枚举成员
enum Tool {
    // ...
    NewTool,
}

// 2. 配置可执行文件名 (exe_name) 和 嵌入逻辑 (exe_data)
// 注意处理 cfg(target_os) 宏以支持跨平台
```

在 `process_files_internal` 函数中配置参数构建逻辑：

```rust
match tool {
    Tool::NewTool => {
        cmd.arg("-i").arg(&file_path);
        // 添加其他特定参数
    }
    // ...
}
```

**3. 前端注册（src/App.vue）**

在 `tools` 数组中添加配置：
```typescript
{ 
  name: ToolType.NewTool, 
  label: "NewTool", 
  supportsStdSample: false, // 是否支持标准品参数 (-STD / -c)
  supportsWindowsOptimization: true, // 是否支持 Windows 编码优化 (-GBK)
  supportsAreaData: true // 是否支持峰面积参数 (-Area / -a)
}
```

### 调试技巧

- **查看后端日志**：在开发模式下 (`npm run tauri dev`)，后端 `println!` 输出会显示在终端中，包含完整的命令行调用参数、工作目录和调试信息。
- **检查临时文件**：前往系统临时目录查看释放的 `cmtools_*` 文件，验证工具是否正确释放。
- **构建脚本调试**：运行 `npm run tauri:build` 时，脚本会输出详细的 Rust 目标检测和构建进度信息。

## 📦 部署

### 自动化构建

项目配置了 GitHub Actions，可在推送 Tag 时自动构建发布版本。

### 手动构建发布

建议使用 `scripts/build-all-platforms.cjs` 脚本进行全平台构建，或使用 `npm run tauri:build:win` 专门构建 Windows 版本。构建产物将自动复制到项目根目录，方便提取和分发。

## 🤝 贡献指南

1.  **Fork** 本项目
2.  **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3.  **提交更改** (`git commit -m 'feat: Add some AmazingFeature'`)
4.  **推送到分支** (`git push origin feature/AmazingFeature`)
5.  **提交 Pull Request**

> 在提交 PR 前，请确保通过所有测试 (`cargo test` 和 `npm run test`)。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">
  <p>Made with ❤️ by the CMTools Team</p>
</div>
