# CMTools

<p align="center">
  <img src="./Cubicise.Logo.png" alt="CMTools Logo" width="200">
</p>

## 项目概述

CMTools是一个基于Electron的桌面应用程序，为用户提供了多种文件处理工具。该应用程序集成了三种不同的处理工具（AneuFiler、Aneu23和SHCarrier），使用统一的界面进行操作，简化了文件处理流程。

## 功能特点

- **多工具集成**：集成了AneuFiler、Aneu23和SHCarrier三种处理工具
- **批量处理**：支持批量选择和处理多个文件
- **自适应主题**：自动适应系统深色/浅色主题，提供良好的视觉体验
- **进度显示**：实时显示文件处理进度
- **灵活配置**：根据不同工具提供相应的配置选项

## 安装说明

### 系统要求

- Windows操作系统
- 无需额外依赖，应用程序包含所有必要组件

### 安装方法

1. 下载最新版本的CMTools安装包
2. 运行安装程序，按照提示完成安装
3. 安装完成后，从开始菜单或桌面快捷方式启动应用程序

## 使用方法

1. **选择工具**：启动应用程序后，首先选择需要使用的工具（AneuFiler、Aneu23或SHCarrier）
2. **选择文件**：点击"选择文件"按钮，选择需要处理的CSV或TSV文件（可多选）
3. **配置选项**：
   - 标准品样本名称：设置标准品样本的名称（默认为"STD"）
   - 使用峰面积数据：选择是否使用峰面积数据进行计算
   - Windows系统优化：针对Windows系统的优化选项
4. **处理文件**：点击"处理文件"按钮开始处理
5. **查看结果**：处理完成后，结果文件将保存在原始文件的同一目录下

## 开发信息

### 技术栈

- Electron：跨平台桌面应用框架
- HTML/CSS/JavaScript：前端界面
- Node.js：后端逻辑

### 项目结构

- `main.js`：主进程文件，处理应用生命周期和IPC通信
- `preload.js`：预加载脚本，暴露安全的API给渲染进程
- `renderer.js`：渲染进程脚本，处理UI交互
- `index.html`：主界面HTML
- `tool-selector.html`：工具选择界面HTML
- `styles.css`：应用样式表
- 可执行文件：`SHCarrier.exe`、`AneuFiler.exe`、`Aneu23.exe`

### 构建与打包

```bash
# 安装依赖
npm install

# 启动开发环境
npm start

# 打包应用
npm run make

# 创建Windows可执行文件
npm run dist
```

## 许可证

本项目采用MIT许可证。详情请参阅LICENSE文件。

## 作者

NTLx

---

© 2023 CMTools. 保留所有权利。