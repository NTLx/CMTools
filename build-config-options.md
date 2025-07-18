# Tauri 构建配置选项

## 当前配置
项目已配置为只构建单个可执行文件（绿色软件），不生成安装包。

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
# 构建单个可执行文件
npm run tauri build
```

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

### 当前配置输出
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
|---------|---------|---------|---------|---------|
| 仅可执行文件 | 快 | 小 | 无 | 开发测试、个人使用 |
| NSIS 便携版 | 中等 | 中等 | 需要 NSIS | 软件分发 |
| 多格式打包 | 慢 | 大 | 需要多个工具 | 正式发布 |

## 注意事项

1. **当前配置优势：**
   - 无需下载额外的打包工具（如 NSIS）
   - 构建过程更快更简洁
   - 生成的 `cmtools.exe` 可直接运行

2. **使用建议：**
   - 开发阶段建议使用当前配置
   - 正式发布时可考虑启用打包功能
   - 根据分发需求选择合适的打包格式

3. **文件管理：**
   - 主要关注 `src-tauri/target/release/cmtools.exe`
   - 其他文件为构建过程中的中间文件
   - 可以安全删除 `target` 目录重新构建