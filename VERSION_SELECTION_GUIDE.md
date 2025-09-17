# CMTools Windows版本选择指南

## 📋 版本概览

我们为不同的Windows系统提供了3个专门优化的版本：

| 版本文件名 | 目标系统 | 架构 | 推荐用户 |
|----------|----------|------|----------|
| **CMTools.x64.exe** | Windows 10+ (64位) | x86_64 | 现代系统用户(推荐) |
| **CMTools.x86.exe** | Windows 10+ (32位) | x86 | 低配置现代系统 |
| **CMTools.Win7.x86.exe** | Windows 7 SP1+ (32位) | x86 | 老旧系统用户 |

## 🎯 如何选择版本

### 1. 首选推荐：CMTools.x64.exe
**适用于：** 大多数现代Windows用户
- ✅ Windows 10、Windows 11 (64位)
- ✅ 最佳性能和兼容性
- ✅ 支持大内存处理
- ✅ 未来更新优先支持

### 2. 32位系统：CMTools.x86.exe  
**适用于：** 32位Windows 10+系统
- ✅ Windows 10、Windows 11 (32位)
- ✅ 功能与64位版本完全相同
- ✅ 适合低配置系统

### 3. 老旧系统：CMTools.Win7.x86.exe
**适用于：** Windows 7用户
- ✅ Windows 7 SP1 及以上版本
- ✅ 解决了API兼容性问题
- ✅ 专门优化的兼容版本
- ⚠️ 需要额外安装Visual C++运行库

## 🔧 系统要求

### Windows 10/11用户
**推荐版本：** CMTools.x64.exe 或 CMTools.x86.exe
- **操作系统：** Windows 10 版本1809 (17763) 或更高
- **内存：** 至少4GB (推荐8GB+)
- **存储：** 200MB可用空间
- **依赖：** Microsoft Edge WebView2 (通常已预装)

### Windows 7用户
**必须使用：** CMTools.Win7.x86.exe
- **操作系统：** Windows 7 SP1 (32位)
- **内存：** 至少2GB
- **存储：** 200MB可用空间
- **必需依赖：** 
  - Visual C++ 2015-2022 Redistributable (x86)
  - 所有重要的Windows更新

## 📦 一键获取所有版本

开发者可使用以下命令一次性构建所有版本：

```
# 构建所有Windows版本
npm run tauri:build:all

# 验证构建结果
npm run tauri:verify
```

构建完成后将得到：
- `CMTools.x64.exe` (约57MB)
- `CMTools.x86.exe` (约55MB)  
- `CMTools.Win7.x86.exe` (约55MB)

## 🚨 常见问题与解决方案

### Windows 7错误：ProcessPrng could not be located
**原因：** 使用了标准版本而非Windows 7兼容版本
**解决方案：** 下载并使用 `CMTools.Win7.x86.exe`

### Windows 10+系统提示缺少WebView2
**原因：** 系统缺少Microsoft Edge WebView2运行时
**解决方案：** 从[微软官网](https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/)下载安装

### 防病毒软件拦截
**原因：** 软件未进行数字签名
**解决方案：** 添加到防病毒软件白名单，或临时关闭实时防护

### Visual C++运行库缺失
**适用于：** Windows 7用户
**解决方案：** 安装[Microsoft Visual C++ Redistributable](https://docs.microsoft.com/zh-cn/cpp/windows/latest-supported-vc-redist)

## 📚 详细文档

- **[WINDOWS7_COMPATIBILITY.md](WINDOWS7_COMPATIBILITY.md)** - Windows 7详细兼容性说明
- **[WIN7_COMPATIBILITY_SOLUTION.md](WIN7_COMPATIBILITY_SOLUTION.md)** - 兼容性问题技术解决方案
- **[user_manual.md](user_manual.md)** - 完整用户使用手册
- **[README.md](README.md)** - 开发者文档

## 🎉 总结

- **现代用户**：优先选择 `CMTools.x64.exe`
- **32位系统**：选择 `CMTools.x86.exe`  
- **Windows 7**：必须使用 `CMTools.Win7.x86.exe`
- **开发者**：使用 `npm run tauri:build:all` 一键构建所有版本

所有版本功能完全相同，仅在系统兼容性和性能优化方面有所不同。选择适合您系统的版本即可享受完整的CMTools功能体验。