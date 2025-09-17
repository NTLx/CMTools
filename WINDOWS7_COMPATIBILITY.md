# Windows 7 兼容性解决方案

## 问题描述

在32位Windows 7系统上运行CMTools时出现如下错误：
```
The procedure entry point ProcessPrng could not be located in the dynamic link library bcryptprimitives.dll
```

## 根本原因

`ProcessPrng` 是Windows 8.1及以上版本引入的加密API函数，在Windows 7的 `bcryptprimitives.dll` 中不存在。这通常由以下原因导致：

1. **Rust编译器版本问题**：新版本Rust可能默认使用较新的Windows API
2. **依赖项问题**：某些crate使用了不兼容Windows 7的加密API
3. **构建配置问题**：未正确设置最低Windows版本要求

## 解决方案

### 方案一：使用专门的Windows 7兼容构建（推荐）

我们已经为您配置了专门的Windows 7兼容性构建。使用以下命令：

```bash
npm run tauri:build:win
```

此命令将：
- 设置正确的Windows API版本兼容性
- 使用特定的编译器标志
- 生成 `CMTools.Win7.x86.exe` 兼容版本

### 方案二：手动构建设置

如果需要手动构建，请按以下步骤操作：

1. **设置环境变量**：
   ```bash
   set WINVER=0x0601
   set _WIN32_WINNT=0x0601
   set RUSTFLAGS=-C target-feature=-crt-static -C link-arg=/SUBSYSTEM:WINDOWS,6.01
   ```

2. **安装32位目标**：
   ```bash
   rustup target add i686-pc-windows-msvc
   ```

3. **构建**：
   ```bash
   npm run build
   npm run tauri:build -- --target i686-pc-windows-msvc
   ```

### 方案三：目标系统升级

**最简单的解决方案**是将目标系统升级到Windows 10或更高版本，因为：
- Windows 7已于2020年停止支持
- 安全更新和现代软件兼容性问题
- 性能和功能改进

## 技术实现细节

### 配置文件修改

1. **Cargo.toml** - 添加了Windows 7兼容依赖：
   ```toml
   [target.'cfg(windows)'.dependencies]
   getrandom = { version = "0.2", features = ["rdrand"] }
   winapi = { version = "0.3", features = ["winnt", "processthreadsapi"] }
   ```

2. **build.rs** - 设置链接器参数：
   ```rust
   println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS,6.01");
   ```

3. **.cargo/config.toml** - 配置编译器标志：
   ```toml
   rustflags = [
       "-C", "link-arg=/SUBSYSTEM:WINDOWS,6.01",
       "-C", "target-feature=-crt-static",
   ]
   ```

### API版本说明

- `0x0601` = Windows 7 (NT 6.1)
- `0x0602` = Windows 8 (NT 6.2)  
- `0x0603` = Windows 8.1 (NT 6.3)
- `0x0A00` = Windows 10 (NT 10.0)

## 验证兼容性

构建完成后，可通过以下方式验证：

1. **检查PE头信息**：
   ```bash
   dumpbin /headers CMTools.Win7.x86.exe | findstr "subsystem version"
   ```

2. **依赖项分析**：
   ```bash
   dumpbin /dependents CMTools.Win7.x86.exe
   ```

3. **在Windows 7虚拟机中测试**

## 系统要求

### Windows 7兼容版本要求：
- **操作系统**：Windows 7 SP1 (32位)
- **Visual C++ 运行库**：Microsoft Visual C++ 2015-2022 Redistributable (x86)
- **内存**：至少512MB可用内存
- **存储**：200MB可用空间

### 安装Visual C++运行库：
1. 访问[微软官方下载](https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
2. 下载 "Microsoft Visual C++ Redistributable for Visual Studio 2015-2022 (x86)"
3. 以管理员身份安装

## 故障排除

### 常见问题

1. **仍然出现API错误**：
   - 确保使用了 `CMTools.Win7.x86.exe` 版本
   - 检查是否安装了正确的Visual C++运行库
   - 确认系统已安装所有Windows更新

2. **程序无法启动**：
   - 检查防病毒软件是否拦截
   - 确认文件完整性
   - 尝试以管理员身份运行

3. **功能异常**：
   - Windows 7版本可能不支持某些高级功能
   - 检查错误日志获取详细信息

### 调试方法

1. **启用调试日志**：
   在命令行运行程序查看详细输出

2. **事件查看器**：
   检查Windows事件日志中的应用程序错误

3. **依赖项检查**：
   使用Dependency Walker等工具检查DLL依赖

## 长期建议

考虑到Windows 7的生命周期已结束，我们强烈建议：

1. **升级到Windows 10/11**：获得更好的安全性和兼容性
2. **定期更新**：确保系统和应用程序保持最新
3. **备份数据**：在升级前备份重要数据

## 支持

如果仍然遇到问题，请提供以下信息：
- 具体错误信息
- Windows版本和Service Pack信息
- 已安装的Visual C++运行库版本
- 系统架构（32位/64位）

我们将根据具体情况提供进一步的技术支持.