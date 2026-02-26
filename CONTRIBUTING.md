# 贡献指南

感谢你考虑为 CMTools 项目做出贡献！本指南旨在帮助你了解如何参与项目开发。

## 目录

- [项目概述](#项目概述)
- [开发环境设置](#开发环境设置)
- [提交 Bug 报告](#提交-bug-报告)
- [提出功能建议](#提出功能建议)
- [代码提交流程](#代码提交流程)
- [代码规范](#代码规范)
- [Commit 信息格式](#commit-信息格式)
- [PR 审核流程](#pr-审核流程)

## 项目概述

CMTools 是一个基于 Tauri 2.0 + Vue 3 + TypeScript 构建的色谱数据处理桌面应用。核心特点是采用**外部工具驱动架构**：通过 Rust 后端调用嵌入的命令行工具来实现数据处理功能。

**技术栈**：

- 前端：Vue 3.5 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4.2
- 后端：Rust (Edition 2024) + Tauri 2.10 + Tokio 1.0

## 开发环境设置

### 前置要求

- [Node.js](https://nodejs.org/) (LTS 版本)
- [Rust](https://www.rust-lang.org/tools/install) (最新稳定版)
- Git

### 安装步骤

1. Fork 本仓库
2. Clone 你的 fork：

   ```bash
   git clone https://github.com/YOUR_USERNAME/cmtools.git
   cd cmtools
   ```

3. 安装依赖：

   ```bash
   npm install
   ```

4. 启动开发模式：

   ```bash
   npm run tauri dev
   ```

5. 运行测试：

   ```bash
   # Rust 后端测试
   cd src-tauri && cargo test

   # 前端类型检查
   npm run build
   ```

## 提交 Bug 报告

在提交 Bug 报告前，请先：

1. 查看 [现有 Issues](https://github.com/lx/CMTools/issues) 是否已有相同问题
2. 确认问题在最新版本中仍然存在
3. 收集相关信息（操作系统、版本号、复现步骤）

创建 Issue 时请使用 Bug Report 模板，并尽可能提供：

- 清晰的标题
- 详细的复现步骤
- 预期行为与实际行为
- 相关日志或截图

## 提出功能建议

欢迎提出功能建议！请：

1. 查看现有 Issues 确认建议未被提出
2. 使用 Feature Request 模板创建 Issue
3. 说明使用场景和期望的解决方案

在功能被接受前，建议先在 Issue 中讨论。

## 代码提交流程

我们采用 [GitHub Flow](https://guides.github.com/introduction/flow/) 工作流：

1. **Fork 仓库**（仅外部贡献者）

2. **创建分支**：

   ```bash
   git checkout -b feature/your-feature-name
   ```

   或：

   ```bash
   git checkout -b fix/issue-123
   ```

3. **进行修改**并测试

4. **格式化代码**：

   ```bash
   # Rust
   cd src-tauri && cargo fmt
   ```

   ```bash
   # 前端
   npm run build
   ```

5. **提交更改**：

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **推送到远程**：

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**

## 代码规范

### TypeScript/Vue 代码规范

- 使用单引号（`'string'` 而非 `"string"`）
- 使用 Composition API 和 `<script setup>` 语法
- 多行结构使用逗号分隔，最后加上逗号
- 行尾不留空格
- 注释使用中文

### Rust 代码规范

- 遵循 `cargo fmt` 的官方格式化规则
- 使用 `cargo clippy` 进行代码质量检查
- 注释使用中文
- 优先使用 `Result` 类型进行错误传播

### 提交前检查清单

- [ ] `cargo fmt` 格式化 Rust 代码
- [ ] `cargo clippy` 无警告
- [ ] `cargo test` 所有测试通过
- [ ] `npm run build` 前端类型检查通过
- [ ] 代码符合项目规范

## Commit 信息格式

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Type 类型

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `refactor`: 代码重构（不修复 bug 或添加功能）
- `style`: 代码格式调整（不影响代码运行）
- `test`: 添加或更新测试
- `chore`: 构建过程或辅助工具变动

### 示例

```text
feat(analytics): 添加 PostHog 分析集成

- 启用 cookieless 模式
- 实现离线事件队列
- 添加用户授权开关

Closes #123
```

```text
fix(process): 修复 Windows 7 兼容性问题

修复在 Windows 7 系统上启动时崩溃的问题

Fixes #456
```

## PR 审核流程

1. 创建 Pull Request 后，维护者会进行代码审查
2. 可能需要根据反馈进行修改
3. 审核通过后，PR 会被合并到主分支
4. 下一个版本发布时，你的贡献将随新版本一起发布

### PR 检查清单

创建 PR 时，请确保：

- [ ] PR 描述清晰说明变更内容
- [ ] 遵循 Conventional Commits 规范
- [ ] 已通过所有测试
- [ ] 代码符合项目规范
- [ ] 相关 Issue 已链接

## 许可证

本项目采用 MIT License。提交代码即表示你同意将你的贡献在 MIT License 下授权。

## 需要帮助？

如有任何问题，可以：

- 查看 [README.md](README.md) 了解项目基础
- 查看 [CLAUDE.md](CLAUDE.md) 了解开发细节
- 在 Issue 中提问

感谢你的贡献！
