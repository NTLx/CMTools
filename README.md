# CMTools

<div align="center">
  <img src="src/assets/Cubicise.Logo.png" alt="CMTools Logo" width="120" height="120">
  <h3>现代化的色谱数据处理工具集</h3>
  <p>基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台桌面应用</p>

  [![Version](https://img.shields.io/badge/version-2.8.6-blue.svg)](https://github.com/Cubicise/CMTools)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Tauri](https://img.shields.io/badge/Tauri-2.10-orange.svg)](https://tauri.app/)
  [![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)](https://vuejs.org/)
  [![Rust](https://img.shields.io/badge/Rust-1.70+-black.svg?logo=rust)](https://rustup.rs/)
</div>

## 📋 项目简介

CMTools 是一个基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台桌面应用，专为色谱数据处理而设计。采用前后端分离架构，通过 Rust 后端调用外部命令行工具实现核心数据处理功能。

**架构特点：**
- **前端**：Vue 3 (Composition API) + TypeScript + Vite，提供现代化的用户界面
- **后端**：Rust + Tauri + Tokio，确保高性能和内存安全
- **扩展性**：通过外部可执行文件机制，支持灵活添加新的数据处理工具

**核心优势：**
- 🚀 **高性能**：Rust 后端可快速处理大型数据集
- 🛠️ **可扩展**：清晰的架构设计，易于添加新工具
- 🌍 **跨平台**：支持 Windows、macOS 和 Linux
- 📦 **绿色软件**：无需安装，开箱即用

> **📖 用户使用指南**：如需了解软件下载、安装和使用方法，请查阅 [user_manual.md](user_manual.md)

## 🏗️ 技术架构

CMTools 采用前后端分离的现代桌面应用架构，利用 Tauri 将基于 Web 技术的 Vue 前端与高性能的 Rust 后端相结合。

### 技术栈概览

- **前端**：Vue 3.5 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4.2
- **后端**：Rust (Edition 2024) + Tauri 2.10 + Tokio 1.0
- **核心依赖**：serde, tauri-plugin-dialog, tauri-plugin-opener

**版本信息**：详见 [package.json](package.json) 和 [src-tauri/Cargo.toml](src-tauri/Cargo.toml)

### 项目结构

```
CMTools/
├── src/                      # Vue 前端源码
│   ├── App.vue               # 核心 UI 组件
│   ├── main.ts               # Vue 应用入口
│   └── assets/               # 资源文件（工具二进制文件和图片资源）
├── src-tauri/                # Tauri 后端源码 (Rust)
│   ├── src/
│   │   ├── main.rs           # Rust 应用主入口
│   │   └── lib.rs            # 核心业务逻辑
│   ├── Cargo.toml            # Rust 依赖配置
│   └── tauri.conf.json       # Tauri 应用配置
├── scripts/                  # 构建脚本
│   ├── build-current-system.cjs # 构建当前系统版本
│   ├── build-windows-all.cjs    # 构建 Windows 全版本
│   ├── build-all-platforms.cjs  # 构建全平台版本
│   └── clean-build-cache.cjs    # 清理构建缓存
├── user_manual.md            # 用户使用手册
└── package.json              # Node.js 配置
```

## 🔨 构建指南

### 前置要求

- **Node.js**: ^18.0.0
- **Rust**: ^1.70.0 (通过 [rustup](https://rustup.rs/) 安装)
- **操作系统**: Windows 10 1809+ / macOS 10.15+ / Linux
- **Windows 额外要求**: Microsoft Edge WebView2 运行时

### 环境搭建

```bash
# 克隆项目
git clone https://github.com/Cubicise/CMTools.git
cd CMTools

# 安装依赖
npm install
```

### 构建命令详解

项目提供了 4 个构建脚本，分别用于不同的构建场景：

#### 1. 构建当前系统版本

**适用场景**：开发测试、快速构建当前系统对应的版本

```bash
# Windows/macOS/Linux 通用
npm run tauri:build
```

**输出说明**：

| 当前系统 | 输出文件 | 说明 |
|----------|----------|------|
| Windows x64 | `CMTools.exe` | 64 位 Windows 便携版 |
| Windows x86 | `CMTools.exe` | 32 位 Windows 便携版 |
| macOS Apple Silicon | `CMTools.AppleSilicon.dmg` | M 系列芯片 macOS 版 |
| macOS Intel | `CMTools.Intel.dmg` | Intel macOS 版 |
| Linux x64 | `CMTools.AppImage` | 64 位 Linux AppImage |

#### 2. 构建 Windows 全版本（仅 Windows）

**适用场景**：发布 Windows 版本，需要所有架构支持

```bash
# 仅 Windows 平台可用
npm run tauri:build:win
```

**输出文件**：

| 文件 | 目标系统 | 架构 | 说明 |
|------|----------|------|------|
| `CMTools.x64.exe` | Windows 10+ | x86_64 | 64 位标准版 |
| `CMTools.x86.exe` | Windows 10+ | i686 | 32 位标准版 |
| `CMTools.Win7.x86.exe` | Windows 7 SP1+ | i686 | Win7 兼容版 |

> **注意**：Windows 7 版本由于 Tauri 2.9+ 的限制可能存在兼容性问题。

**前置准备**：
```bash
# 首次构建前需安装 32 位目标
rustup target add i686-pc-windows-msvc
```

#### 3. 构建全平台版本

**适用场景**：完整发布、CI/CD自动化构建

```bash
# 根据当前系统构建所有支持的版本
npm run tauri:build:all
```

**输出说明**：

| 当前平台 | 输出文件 |
|----------|----------|
| Windows | `CMTools.x64.exe`、`CMTools.x86.exe`、`CMTools.Win7.x86.exe` |
| macOS | `CMTools.AppleSilicon.dmg`、`CMTools.Intel.dmg` |
| Linux | `CMTools.x86_64.AppImage`、`CMTools.i686.AppImage` |

### 维护命令

| 命令 | 说明 |
|------|------|
| `npm run clean:cache` | 清理所有构建缓存（Cargo + Frontend） |
| `npm run clean:cache:cargo` | 仅清理 Rust/Cargo 构建缓存 |
| `npm run clean:cache:frontend` | 仅清理前端构建缓存 |

### 开发调试

```bash
# 启动开发模式（带热重载）
npm run tauri dev
```

**调试技巧**：
- **后端日志**：开发模式下，后端 `println!` 输出会显示在终端中
- **检查临时文件**：系统临时目录可查看释放的 `cmtools_*` 工具文件
- **构建调试**：构建脚本会输出详细的 Rust 目标检测和构建进度

## 🛠️ 开发者指南

### 代码规范

- **前端**: Vue 3 Composition API + TypeScript
- **后端**: Rust (cargo fmt + clippy)
- **提交信息**: Conventional Commits

### 核心架构

CMTools 采用**外部工具驱动设计**：核心功能通过 Rust 后端调用嵌入的命令行工具实现。

**工作原理**：

1. **编译期嵌入**：工具二进制通过 `include_bytes!` 宏嵌入可执行文件
2. **运行时释放**：执行时释放到系统临时目录
3. **命令调用**：通过 `std::process::Command` 执行并捕获输出

**关键文件**：
- `src-tauri/src/lib.rs` - 核心逻辑：工具枚举、参数处理、错误处理
- `src/App.vue` - 前端交互：UI 展示、参数收集、invoke 调用

> **💡 关于内置工具**：CMTools 调用的二进制工具（如 AneuFiler、SMNFiler 等）均有各自独立的文档。开发者应查阅各工具项目的文档以了解详细用法。

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

在 `Tool` 枚举中添加成员，并实现 `exe_name` 和 `exe_data` 方法：

```rust
// 添加枚举成员
enum Tool {
    // ...
    NewTool,
}

// 配置 exe_name 和 exe_data 方法
```

在 `process_files_internal` 中配置参数构建逻辑：

```rust
match tool {
    Tool::NewTool => {
        cmd.arg("-i").arg(&file_path);
        // 添加其他特定参数
    }
}
```

**3. 前端注册（src/App.vue）**

在 `tools` 数组中添加配置：

```typescript
{
  name: ToolType.NewTool,
  label: "NewTool",
  supportsStdSample: false,
  supportsWindowsOptimization: true,
  supportsAreaData: true
}
```

### 遥测与分析

CMTools 集成了 PostHog 遥测功能，用于收集匿名使用数据。

**隐私保护机制**：
- Cookieless Mode：用户 ID 服务端哈希计算
- 无身份识别：不调用 identify 方法
- 禁用自动捕获：仅追踪手动指定事件
- 数据脱敏：不收集文件内容等敏感信息
- 用户授权：首次启动需明确同意

**配置方式**（`.env` 文件）：
```bash
VITE_POSTHOG_KEY=your_posthog_api_key
VITE_POSTHOG_HOST=https://app.posthog.com
```

## 📦 部署

### 自动化构建

项目配置了 GitHub Actions，可在推送 Tag 时自动构建发布版本。

### 手动发布

使用 `npm run tauri:build:all` 进行全平台构建，产物将自动复制到项目根目录。

## 🤝 贡献指南

1. **Fork** 本项目
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'feat: Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **提交 Pull Request**

> 在提交 PR 前，请确保通过所有测试 (`cargo test` 和 `npm run test`)。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📚 相关文档

- [user_manual.md](user_manual.md) - 用户使用手册（下载、安装、使用指南）
- [CLAUDE.md](CLAUDE.md) - 开发指南（详细开发规范、工作流程）
- [CHANGELOG.md](CHANGELOG.md) - 版本更新历史

---

<div align="center">
  <p>Made with ❤️ by the CMTools Team</p>
</div>
