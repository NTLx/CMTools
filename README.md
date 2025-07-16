# CMTools

<div align="center">
  <img src="Cubicise.Logo.png" alt="CMTools Logo" width="120" height="120">
  <h3>现代化的色谱数据处理工具集</h3>
  <p>基于 Tauri 2.0 + Vue 3 + TypeScript 构建的跨平台桌面应用</p>
  
  [![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/cmtools)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://tauri.app/)
  [![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)](https://vuejs.org/)
</div>

## 📋 项目简介

CMTools 是一个专业的色谱数据处理工具集，提供了三个核心工具：

- **AneuFiler** - 基础色谱数据文件处理工具
- **Aneu23** - 高级色谱数据分析工具，支持标准品识别
- **SHCarrier** - 专业载体分析工具，支持Windows系统编码优化

### ✨ 主要特性

- 🎨 **现代化UI设计** - 支持亮色/暗色主题切换
- 🌍 **国际化支持** - 中文/英文双语界面
- 📁 **批量文件处理** - 支持多文件同时处理
- ⚙️ **灵活配置选项** - 峰面积/峰高数据选择、标准品名称配置等
- 🔧 **系统优化** - Windows系统编码优化支持
- 📊 **实时处理反馈** - 详细的处理结果和错误信息显示
- 🚀 **跨平台支持** - Windows、macOS、Linux

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Vue 3.5.13 (Composition API)
- **语言**: TypeScript 5.6.2
- **构建工具**: Vite 6.0.3
- **UI**: 自定义CSS (Material Design风格)
- **状态管理**: Vue 3 Reactivity API

### 后端技术栈
- **框架**: Tauri 2.6.2
- **语言**: Rust (Edition 2021)
- **异步运行时**: Tokio 1.x
- **序列化**: Serde 1.x
- **插件**: 
  - `tauri-plugin-dialog` - 文件对话框
  - `tauri-plugin-opener` - 外部链接打开

### 项目结构

```
CMTools_Tauri/
├── src/                    # Vue 前端源码
│   ├── App.vue            # 主应用组件
│   ├── main.ts            # 应用入口
│   └── assets/            # 静态资源
├── src-tauri/             # Tauri 后端源码
│   ├── src/
│   │   ├── main.rs        # 应用入口
│   │   └── lib.rs         # 核心业务逻辑
│   ├── icons/             # 应用图标
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 配置文件
├── public/                # 公共静态资源
├── dist/                  # 构建输出目录
├── package.json           # Node.js 依赖配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目文档
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **Rust**: >= 1.70.0
- **操作系统**: Windows 10+, macOS 10.15+, 或 Linux

### 安装依赖

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/cmtools.git
   cd cmtools
   ```

2. **安装 Node.js 依赖**
   ```bash
   npm install
   ```

3. **安装 Rust 和 Tauri CLI**
   ```bash
   # 安装 Rust (如果尚未安装)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # 安装 Tauri CLI
   npm install -g @tauri-apps/cli
   ```

### 开发模式

```bash
# 启动开发服务器
npm run tauri dev
```

这将同时启动：
- Vite 开发服务器 (http://localhost:1420)
- Tauri 应用窗口

### 构建生产版本

```bash
# 构建应用
npm run tauri build
```

构建产物将生成在 `src-tauri/target/release/bundle/` 目录下：
- Windows: `.exe` 可执行文件 + `.msi` 安装包
- macOS: `.app` 应用包 + `.dmg` 磁盘镜像
- Linux: `.AppImage` 或 `.deb` 包

## 🛠️ 开发指南

### 代码规范

- **TypeScript**: 使用严格模式，遵循 ESLint 规范
- **Vue**: 使用 Composition API 和 `<script setup>` 语法
- **Rust**: 遵循 Rust 官方代码风格，使用 `cargo fmt`
- **提交信息**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

### 项目配置

#### Tauri 配置 (`src-tauri/tauri.conf.json`)

```json
{
  "productName": "cmtools",
  "version": "2.0.1",
  "identifier": "com.cmtools.app",
  "app": {
    "windows": [{
      "title": "CMTools",
      "width": 900,
      "height": 700,
      "minWidth": 600,
      "minHeight": 500,
      "maximized": true
    }]
  }
}
```

#### Vite 配置 (`vite.config.ts`)

- 配置了 Vue 插件
- 设置了开发服务器端口为 1420
- 配置了构建输出目录

### 核心功能实现

#### 1. 文件处理流程

```rust
// src-tauri/src/lib.rs
#[tauri::command]
async fn process_files(
    tool_name: String,
    file_paths: Vec<String>,
    use_area_data: bool,
    std_sample_name: Option<String>,
    windows_optimization: Option<bool>
) -> Result<Vec<ProcessResult>, String>
```

#### 2. 前端状态管理

```typescript
// src/App.vue
const selectedFiles = ref<string[]>([]);
const selectedTool = ref<string>("AneuFiler");
const useAreaData = ref<boolean>(false);
const processing = ref<boolean>(false);
```

#### 3. 国际化实现

```typescript
const translations = {
  zh: { /* 中文翻译 */ },
  en: { /* 英文翻译 */ }
};

function t(key: string): string {
  return translations[currentLanguage.value][key] || key;
}
```

### 添加新功能

1. **添加新的处理工具**:
   - 在 `src-tauri/src/lib.rs` 中添加新的工具逻辑
   - 在前端 `tools` 数组中添加新工具选项
   - 更新相关的UI和配置选项

2. **添加新的配置选项**:
   - 在 Rust 后端的 `process_files` 函数中添加新参数
   - 在 Vue 前端添加对应的UI控件
   - 更新国际化文本

3. **UI主题定制**:
   - 修改 CSS 变量定义 (`:root` 和 `.dark-theme`)
   - 更新组件样式

## 🧪 测试

### 运行测试

```bash
# 前端测试
npm run test

# Rust 测试
cd src-tauri
cargo test
```

### 测试覆盖

- 单元测试：核心业务逻辑
- 集成测试：文件处理流程
- E2E测试：用户界面交互

## 📦 部署

### 自动化构建

项目支持 GitHub Actions 自动化构建：

```yaml
# .github/workflows/build.yml
name: Build and Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
```

### 手动部署

1. 更新版本号 (`package.json` 和 `src-tauri/tauri.conf.json`)
2. 运行构建命令 `npm run tauri build`
3. 上传构建产物到发布平台

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'feat: add amazing feature'`)
4. **推送到分支** (`git push origin feature/amazing-feature`)
5. **创建 Pull Request**

### 提交规范

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 代码审查

所有 PR 都需要经过代码审查：
- 代码质量和规范性
- 功能完整性和正确性
- 测试覆盖率
- 文档完整性

## 🐛 问题报告

如果您发现了 bug 或有功能建议，请：

1. 检查 [Issues](https://github.com/your-repo/cmtools/issues) 是否已存在相关问题
2. 如果没有，请创建新的 Issue
3. 提供详细的问题描述和复现步骤
4. 包含系统信息和错误日志

## 📚 相关资源

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Rust 官方文档](https://doc.rust-lang.org/)
- [项目帮助中心](https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 维护者

- [@your-username](https://github.com/your-username) - 项目维护者

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

<div align="center">
  <p>如果这个项目对您有帮助，请给我们一个 ⭐️</p>
  <p>Made with ❤️ by CMTools Team</p>
</div>
