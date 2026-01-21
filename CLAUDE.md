# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CMTools 是一个基于 Tauri 2.0 + Vue 3 + TypeScript 构建的色谱数据处理桌面应用。核心特点是采用**外部工具驱动架构**：通过 Rust 后端调用嵌入的命令行工具来实现数据处理功能。

**技术栈**：
- 前端：Vue 3.5 + TypeScript 5.6 + Vite 6.0 + Tailwind CSS 4.1
- 后端：Rust (Edition 2024) + Tauri 2.9 + Tokio 1.0

## 常用开发命令

### 开发与构建
```bash
# 安装依赖
npm install

# 启动开发模式（带热重载）
npm run tauri dev

# 构建当前系统版本
npm run tauri:build

# 构建所有 Windows 版本（x64, x86, Win7 兼容版）
npm run tauri:build:win

# 构建所有平台版本
npm run tauri:build:all
```

### 清理缓存
```bash
# 清理所有构建缓存
npm run clean:cache

# 仅清理 Rust/Cargo 缓存
npm run clean:cache:cargo

# 仅清理前端构建缓存
npm run clean:cache:frontend
```

### 测试
```bash
# Rust 后端测试
cd src-tauri && cargo test

# 前端类型检查
npm run build  # 内部执行 vue-tsc --noEmit
```

### Rust 代码规范
```bash
cd src-tauri
cargo fmt      # 格式化代码
cargo clippy   # 静态分析
```

## 核心架构：外部工具驱动机制

CMTools 的核心功能通过调用嵌入的外部命令行工具实现，这是理解整个项目的关键。

### 工作流程

1. **编译期嵌入**（`src-tauri/src/lib.rs`）
   - 使用 `include_bytes!` 宏将 `src/assets/` 中的工具二进制文件编译进可执行文件
   - 根据 `target_os` 自动选择正确的文件（Windows 使用 `.exe` 后缀，macOS/Linux 无后缀）

2. **运行时释放**
   - 当用户触发处理任务时，后端将嵌入的二进制数据写入系统临时目录
   - 临时文件命名格式：`cmtools_[ToolName][_Suffix]`

3. **命令执行**
   - 使用 `std::process::Command` 执行临时文件
   - 构造命令行参数并捕获 stdout/stderr

4. **结果返回**
   - 通过 Tauri 的 `invoke` 机制将处理结果返回给 Vue 前端

### 关键文件

- **`src-tauri/src/lib.rs`**：核心业务逻辑
  - `Tool` 枚举：定义所有可用工具（AneuFiler、Aneu23、SMNFiler_v1/v2、SHCarrier、STR-Matcher、UPDFiler_v1/v2）
  - `process_files_internal`：处理文件的核心函数，负责工具释放、参数构造、命令执行
  - `ProcessError`：自定义错误类型，用于错误传播

- **`src/App.vue`**：前端主界面
  - `tools` 数组：配置所有工具的 UI 展示和功能特性（是否支持标准品、峰面积、编码优化等）
  - `processFiles` 函数：调用后端的入口点

- **`src/assets/`**：存放所有项目资源文件
  - 外部工具的可执行文件
    - macOS/Linux：无后缀（如 `AneuFiler`）
    - Windows：需要 `.exe` 后缀（如 `AneuFiler.exe`）
  - 图片资源（如 `Cubicise.Logo.png`）

### 平台差异处理

代码中使用 `#[cfg(target_os = "windows")]` 和 `#[cfg(not(target_os = "windows"))]` 宏来处理平台差异：
- 可执行文件名（是否加 `.exe` 后缀）
- 嵌入文件路径（指向不同的二进制文件）

## 添加新工具的完整流程

假设要添加名为 `NewTool` 的工具：

### 1. 准备工具文件
```bash
# macOS/Linux
cp NewTool src/assets/

# Windows（开发时需要两个版本）
cp NewTool.exe src/assets/
```

### 2. 后端注册（`src-tauri/src/lib.rs`）

**步骤 A：添加枚举成员**
```rust
enum Tool {
    // 现有工具...
    NewTool,  // 添加这一行
}
```

**步骤 B：实现 `from_str` 解析**
```rust
fn from_str(s: &str) -> Result<Self, ProcessError> {
    match s {
        // 现有工具...
        "NewTool" => Ok(Tool::NewTool),  // 添加这一行
        _ => Err(ProcessError::UnknownTool { tool: s.to_string() }),
    }
}
```

**步骤 C：实现 `exe_name` 方法**
```rust
fn exe_name(&self) -> String {
    let base_name = match self {
        // 现有工具...
        Tool::NewTool => "NewTool",  // 添加这一行
    };
    // ... 后续逻辑会自动添加平台后缀
}
```

**步骤 D：实现 `exe_data` 方法（嵌入二进制）**
```rust
fn exe_data(&self) -> &'static [u8] {
    #[cfg(target_os = "windows")]
    {
        match self {
            // 现有工具...
            Tool::NewTool => include_bytes!("../../src/assets/NewTool.exe"),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        match self {
            // 现有工具...
            Tool::NewTool => include_bytes!("../../src/assets/NewTool"),
        }
    }
}
```

**步骤 E：配置命令行参数（`process_files_internal` 函数）**
```rust
match tool {
    // 现有工具...
    Tool::NewTool => {
        cmd.arg("-i").arg(&file_path);
        // 根据工具需求添加其他参数
        if use_std_sample {
            cmd.arg("-STD");
        }
        if use_area_data {
            cmd.arg("-Area");
        }
    }
}
```

### 3. 前端注册（`src/App.vue`）

在 `tools` 数组中添加配置：
```typescript
const tools = ref([
  // 现有工具...
  {
    name: ToolType.NewTool,  // 需要先在 ToolType 类型中定义
    label: 'NewTool 数据处理',
    supportsStdSample: true,           // 是否支持 -STD 参数
    supportsWindowsOptimization: true, // 是否支持 -GBK 编码优化
    supportsAreaData: true             // 是否支持 -Area 参数
  }
])
```

## 构建系统架构

项目使用自定义 Node.js 脚本管理复杂的多平台构建：

### 构建脚本（`scripts/` 目录）

- **`build-current-system.cjs`**：智能检测当前系统架构并构建对应版本
  - Windows：自动检测是 x64 还是 x86
  - macOS：构建 Apple Silicon 或 Intel 版本
  - 构建完成后自动重命名并复制到项目根目录

- **`build-windows-all.cjs`**：构建所有 Windows 版本
  - `CMTools.x64.exe`（Windows 10+ 64位）
  - `CMTools.x86.exe`（Windows 10+ 32位）
  - `CMTools.Win7.x86.exe`（Windows 7 兼容版）

- **`build-all-platforms.cjs`**：跨平台完整构建

- **`clean-build-cache.cjs`**：清理缓存工具
  - 支持选择性清理：`cargo`、`frontend` 或全部

### 构建产物位置

- **开发构建**：`src-tauri/target/[profile]/`
- **发布构建**：`src-tauri/target/release/bundle/`
- **最终产物**：自动复制到项目根目录，便于分发

## 前后端交互机制

使用 Tauri 的 `invoke` 系统进行通信：

### 前端调用（Vue）
```typescript
import { invoke } from '@tauri-apps/api/core'

const result = await invoke('process_files', {
  filePaths: ['/path/to/file.txt'],
  toolName: 'AneuFiler',
  stdSampleFile: stdPath,
  useStdSample: true,
  useAreaData: false,
  useWindowsOptimization: true
})
```

### 后端命令（Rust）
```rust
#[tauri::command]
async fn process_files(
    file_paths: Vec<String>,
    tool_name: String,
    std_sample_file: Option<String>,
    // ... 其他参数
) -> Result<Vec<ProcessResult>, String>
```

后端命令必须在 `src-tauri/src/main.rs` 中注册：
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
        process_files,
        open_file_directory
    ])
    .run(tauri::generate_context!())
```

## 调试技巧

### 后端调试
- 开发模式下运行 `npm run tauri dev`，所有 `println!` 输出会显示在终端
- 后端会打印完整的命令行调用、工作目录、参数列表
- 检查系统临时目录（如 Windows 的 `%TEMP%`）查看释放的 `cmtools_*` 文件

### 前端调试
- 右键点击应用窗口 → "检查元素" 打开开发者工具
- 使用 Vue DevTools 检查组件状态

### 构建调试
- 构建脚本会输出详细的 Rust target 检测信息
- 查看 `src-tauri/target/` 目录了解实际构建产物

## 开发与代码规范

### 开发原则
1. **使用中文与用户对话** - 所有交流、注释和文档优先使用中文
2. **总是使用最简单的方法实现需求** - 避免过度设计
3. **如无必要，不引入新的第三方依赖** - 保持项目轻量化

### 最佳实践
1. **利用配置驱动特性**
   启用工具的通用特性（如 Windows 优化）时，通常只需修改配置，无需编写新逻辑：
   - **前端**：更新 `src/App.vue` 的 `tools` 数组
   - **后端**：更新 `src-tauri/src/lib.rs` 的 `supports_*` 判定方法
   - **机制**：利用后端通用逻辑中的默认匹配分支（如 `_ => cmd.arg("-GBK")`）自动生效

2. **前后端配置同步**
   修改工具能力时，务必同时更新前后端的配置定义，确保 UI 选项能被后端正确处理。

### TypeScript/Vue 代码规范
- **字符串字面量**：优先使用单引号（`'string'` 而非 `"string"`）
- **语法风格**：使用 Composition API 和 `<script setup>` 语法
- **多行结构**：用逗号分隔的多行结构，始终加上最后一个逗号（单行不用）
  ```typescript
  // ✓ 正确
  const obj = {
    a: 1,
    b: 2,  // 最后一个逗号
  }

  // ✓ 正确（单行）
  const arr = [1, 2, 3]
  ```
- **行尾空格**：行尾不要留有空格
- **注释**：使用中文撰写注释

### Rust 代码规范
- **格式化**：遵循 `cargo fmt` 的官方格式化规则
- **静态分析**：使用 `cargo clippy` 进行代码质量检查
- **注释**：使用中文撰写注释
- **错误处理**：优先使用 `Result` 类型进行错误传播
- **行尾空格**：行尾不要留有空格

### 文档书写规范
1. **标点符号匹配**：
   - 中文内容使用中文标点符号（，。！？）
   - 英文内容使用英文标点符号（, . ! ?）

2. **空格规范**：
   - 中文与英文之间应该有一个空格
   - 中文与数字之间应该有一个空格
   ```markdown
   ✓ 正确：CMTools 是一个基于 Tauri 2.0 构建的应用
   ✗ 错误：CMTools是一个基于Tauri 2.0构建的应用
   ```

3. **技术术语标记**：
   - 变量名、文件名、路径、页面按钮、页面元素等都应使用 Markdown 的行内代码块标记
   ```markdown
   ✓ 正确：在 `src/App.vue` 文件中修改 `tools` 数组
   ✗ 错误：在 src/App.vue 文件中修改 tools 数组
   ```

### Git 提交规范
遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `refactor:` 代码重构
- `chore:` 构建/工具更新

## 重要约定

### 文档管理规范
**本项目只允许存在以下三份文档，禁止新建其他文档文件：**

1. **`CLAUDE.md`** - 开发指南，面向 AI 辅助开发和开发者
   - 技术架构说明
   - 开发命令和工作流
   - 代码规范和最佳实践
   - 添加新功能的详细步骤

2. **`README.md`** - 项目总览，面向所有人
   - 项目介绍和特性
   - 快速开始和环境搭建
   - 构建和部署说明
   - 贡献指南

3. **`user_manual.md`** - 用户手册，面向最终用户
   - 软件使用说明
   - 功能介绍
   - 常见问题解答

**原则：** 所有需要文档化沉淀的内容均应合理地整合到上述三份文档中。如果某个内容不适合任何一份文档，优先考虑是否真的需要文档化，而不是创建新文档。

### 开发约定

1. **总是使用最简单的方法实现需求**，如无必要不引入新的第三方依赖
2. **外部工具必须放在 `src/assets/`**，不能放在 `src-tauri/` 目录（构建时会找不到）
3. **Windows 版本需要 `.exe` 后缀**，macOS/Linux 版本无后缀
4. **首次构建 32 位版本前**需运行：`rustup target add i686-pc-windows-msvc`
5. **文档中中英文之间、中文与数字之间应有空格**
6. **技术术语使用行内代码标记**（如 `Tool` 枚举、`invoke` 方法）

## 相关文档

- `README.md` - 项目总体介绍和快速开始
- `user_manual.md` - 用户使用手册
