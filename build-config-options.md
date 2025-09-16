# Tauri 构建配置选项

## 当前配置
项目已配置为只构建单个可执行文件（绿色软件），不生成安装包。

### 多架构构建支持

项目支持Windows平台32位和64位架构的自动构建，通过专门的构建脚本 `scripts/build-multi-arch.cjs` 实现。

**支持的架构：**
- **x64** (x86_64-pc-windows-msvc): 64位Windows版本
- **x86** (i686-pc-windows-msvc): 32位Windows版本

**软件命名规范：**
- 64位版本：`CMTools.x64.exe`
- 32位版本：`CMTools.x86.exe`

### 配置详情
- `bundle.active`: `false` - 禁用打包功能
- `bundle.targets`: `[]` - 不构建任何安装包格式
- 输出文件：`src-tauri/target/release/cmtools.exe`

## 构建模式对比

### 1. 当前模式：仅可执行文件
```json
{
  "bundle": {
    "active": false,
    "targets": []
  }
}
```
**优点：**
- 构建速度快
- 文件体积小
- 无需下载额外工具
- 真正的绿色软件，无安装过程

**输出：** `cmtools.exe` 单文件

### 2. NSIS 便携版模式（可选）
```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "windows": {
      "nsis": {
        "installMode": "currentUser"
      }
    }
  }
}
```
**特点：**
- 生成 `.exe` 安装包
- 支持便携模式
- 需要下载 NSIS 工具

### 3. 多格式打包模式（可选）
```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi", "zip"]
  }
}
```
**特点：**
- 同时生成多种格式
- 构建时间较长
- 适合发布分发

## 构建命令

### 当前推荐命令

```bash
# 多架构自动构建（推荐）
npm run tauri:build

# 单个架构构建
npm run tauri build  # 默认64位
npm run tauri:build:x64  # 明确指定64位
npm run tauri:build:x86  # 明确指定32位
```

### 多架构构建脚本说明

`npm run tauri:build` 命令使用 `scripts/build-multi-arch.cjs` 脚本，自动执行以下操作：

1. **环境检查**：自动检查并安装所需的Rust构建目标
2. **清理旧文件**：删除之前的构建产物
3. **前端构建**：执行 `npm run build`
4. **多架构构建**：并行构建32位和64位版本
5. **文件重命名**：按规范重命名为 `CMTools.x64.exe` 和 `CMTools.x86.exe`
6. **文件复制**：将重命名文件复制到项目根目录
7. **结果显示**：显示构建结果和文件信息

### 其他可用命令
```bash
# 仅构建前端
npm run build

# 开发模式
npm run tauri dev

# 检查配置
npm run tauri build --help
```

## 输出文件位置

### 多架构构建输出（推荐）

**便于使用的文件：**
- `CMTools.x64.exe` - 位于项目根目录
- `CMTools.x86.exe` - 位于项目根目录

**原始构建文件：**
- **64位版本：** `src-tauri/target/x86_64-pc-windows-msvc/release/cmtools.exe`
- **32位版本：** `src-tauri/target/i686-pc-windows-msvc/release/cmtools.exe`

### 单架构构建输出
- **主要文件：** `src-tauri/target/release/cmtools.exe`
- **调试信息：** `src-tauri/target/release/` 目录下的其他文件

### 如果启用打包功能
- **NSIS 安装包：** `src-tauri/target/release/bundle/nsis/`
- **MSI 安装包：** `src-tauri/target/release/bundle/msi/`
- **ZIP 压缩包：** `src-tauri/target/release/bundle/zip/`

## 配置切换指南

### 切换到 NSIS 便携版
1. 修改 `tauri.conf.json`：
   ```json
   "bundle": {
     "active": true,
     "targets": ["nsis"]
   }
   ```
2. 运行构建命令

### 切换回纯可执行文件
1. 修改 `tauri.conf.json`：
   ```json
   "bundle": {
     "active": false,
     "targets": []
   }
   ```
2. 运行构建命令

## 性能对比

| 配置模式 | 构建时间 | 文件大小 | 下载需求 | 适用场景 |
|---------|---------|---------|---------|----------|
| 多架构自动构建 | 中等 | 中等 | Rust目标 | **推荐** - 发布分发 |
| 单架构(64位) | 快 | 小 | 无 | 开发测试 |
| 单架构(32位) | 快 | 小 | Rust目标 | 特定需求 |
| NSIS 便携版 | 中等 | 中等 | 需要 NSIS | 软件分发 |
| 多格式打包 | 慢 | 大 | 需要多个工具 | 正式发布 |

## 注意事项

1. **多架构构建优势：**
   - 一次性生成32位和64位版本
   - 自动按规范重命名文件
   - 支持广泛的系统兼容性
   - 便于软件分发和部署

2. **使用建议：**
   - **开发阶段：** 使用单架构构建 (`npm run tauri build`)
   - **发布阶段：** 使用多架构构建 (`npm run tauri:build`)
   - **特殊需求：** 根据目标用户群体选择对应架构

3. **文件管理：**
   - **优先使用：** 项目根目录的 `CMTools.x64.exe` 和 `CMTools.x86.exe`
   - **原始文件：** `src-tauri/target/[架构]/release/cmtools.exe`
   - **清理构建：** 可以安全删除 `target` 目录重新构建

4. **构建脚本特性：**
   - 自动检查并安装缺失的Rust构建目标
   - 清理之前的构建产物避免冲突
   - 提供详细的构建进度和结果信息
   - 支持构建失败时的错误诊断
