# 📖 CMTools User Manual

## 1. 📜 Introduction

CMTools is a desktop application designed to process analytical data files. It provides a user-friendly interface to apply different processing tools to your data files, streamlining your workflow and improving efficiency.

**Key Features:**

*   **🔧 Multiple Processing Tools:** Supports various tools like `AneuFiler`, `Aneu23`, `SMNFiler_v1`, `SHCarrier`, `UPDFiler_v1`, and `UPDFiler_v2`.
*   **🗂️ Batch Processing:** Process multiple files at once.
*   **⚙️ Customizable Options:** Adjust processing parameters like using peak area data and specifying standard sample names.
*   **💻 Cross-Platform:** Runs on Windows, macOS, and Linux.
*   **🌍 Multi-language Support:** Available in English and Chinese.
*   **🎨 Light/Dark Mode:** Switch between themes for your visual comfort.

## 2. 🚀 快速开始

### 系统要求

- **操作系统**：Windows 10 版本 1809 或更高版本
- **存储空间**：至少 200MB 可用空间
- **运行时**：Microsoft Edge WebView2（现代 Windows 系统通常已预装）

### 安装步骤

CMTools 是绿色软件，无需安装：

1. **下载适合您系统的版本**：
   - **64位 Windows**：下载 `CMTools.x64.exe`（推荐）
   - **32位 Windows**：下载 `CMTools.x86.exe`
   - **Windows 7**：下载 `CMTools.Win7.x86.exe`

2. **运行软件**：双击下载的 `.exe` 文件即可启动

3. **Windows 安全警告**：如果系统提示安全警告，点击"更多信息" → "仍要运行"

### 绿色软件优势

✅ **无需安装** - 双击即可运行  
✅ **系统干净** - 不向注册表写入数据  
✅ **便携使用** - 可放在U盘或云端  
✅ **轻松删除** - 直接删除文件即可卸载

> **Windows 7 用户注意**：如果遇到 `ProcessPrng could not be located` 错误，请确保使用 `CMTools.Win7.x86.exe` 版本

## 3. 🖥️ User Interface Overview

The main window of CMTools is divided into several sections:

1.  **Header:**
    *   **Help (`帮助`/`Help`):** Opens the online help documentation (https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq).
    *   **Version Display:** Shows the current version of the application (e.g., `v2.6.3`).
    *   **Language Switch (`中文`/`English`):** Toggles the interface language between Chinese and English.
    *   **Theme Toggle (`暗`/`亮` or `Dark`/`Light`):** Switches between light and dark mode. The button's `title` attribute dynamically displays `切换到亮色模式`/`Switch to light mode` or `切换到暗色模式`/`Switch to dark mode`.
    *   **Logo and Title:** Displays the application's branding.

2.  **Tool Selection:**
    *   Choose the processing tool you want to use: `AneuFiler`, `Aneu23`, `SMNFiler_v1`, `SHCarrier`, `UPDFiler_v1`, or `UPDFiler_v2`.

3.  **File Processing:**
    *   **Select Files (`📁 选择文件`/`📁 Select Files`):** Opens a dialog to select one or more data files for processing.
    *   **Clear (`🗑️ 清除`/`🗑️ Clear`):** Removes all selected files from the list.
    *   **Selected Files List:** Displays the names of the files you have chosen.

4.  **Processing Options:**
    *   These options appear after you select files and may vary depending on the chosen tool.
    *   **Use peak area data for calculation:** If checked, the tool will use peak area instead of peak height for its calculations.
    *   **Standard Sample Name:** (For `Aneu23` and `SHCarrier`) Specify the name of the standard sample (e.g., "STD").
    *   **Windows System Optimization:** (For `SHCarrier`) Optimizes file encoding for Windows systems. It's recommended to keep this enabled on Windows.

5.  **Start Processing:**
    *   **Start Processing (`🚀 开始处理`/`🚀 Start Processing`):** Begins the data processing task. The button will show `⏳ 处理中...`/`⏳ Processing...` while running.

6.  **Processing Results:**
    *   Displays the outcome for each file after processing is complete.
    *   **Success (`✅`):** Indicates the file was processed successfully.
    *   **Failure (`❌`):** Indicates an error occurred. An error dialog will appear with details.
    *   Clicking on a result item will open its containing folder and select the file in the file explorer.

## 4. 🛠️ How to Use CMTools

### 📝 Step 1: Select a Tool

Click on one of the tool buttons (`AneuFiler`, `Aneu23`, `SMNFiler_v1`, `SHCarrier`, `UPDFiler_v1`, `UPDFiler_v2`) to select the desired processing algorithm.

### 📂 Step 2: Select Files

1.  Click the `📁 Select Files` button.
2.  In the file dialog, navigate to your data files, select one or more, and click `Open`.
3.  The selected files will appear in the `Selected Files` list.

### ⚙️ Step 3: Configure Processing Options

-   **For most tools:** Decide if you want to use peak area data by checking or unchecking the corresponding box. (Note: UPDFiler_v1 and UPDFiler_v2 do not support this option)
-   **For `Aneu23`, `SMNFiler_v1`, and `SHCarrier`:** If your dataset includes a standard, enter its name in the `Standard Sample Name` text field.
-   **For `SMNFiler_v1`, `SHCarrier`, `UPDFiler_v1` and `UPDFiler_v2` on Windows:** It is recommended to keep the `Windows System Optimization` option checked.

### 🚀 Step 4: Start Processing

1.  Click the `🚀 Start Processing` button.
2.  The application will process each file sequentially. The button will be disabled and show a `Processing...` status.

### 📊 Step 5: Review Results

-   Once processing is finished, the `Processing Results` section will show the status for each file.
-   Result files are generated in the same directory as their corresponding input files.
-   If any errors occurred, a dialog box will pop up with detailed error messages.
-   You can click on any result item to quickly locate the original file in your file explorer.

## 5. ⚙️ 工具使用指南

### 🧬 AneuFiler（通用数据筛选）
**用途**：通用数据筛选和过滤

**选项说明**：
- **使用峰面积数据**：勾选后使用峰面积计算，不勾选使用峰高计算

---

### 🔬 Aneu23（染色体非整倍性筛查）
**用途**：专门用于23对染色体非整倍性筛查分析

**选项说明**：
- **使用峰面积数据**：切换计算模式（峰面积/峰高）
- **标准品样本名称**：输入标准品样本名称（如：STD）

---

### 📊 SMNFiler_v1（SMN数据分析 v1）
**用途**：专门用于SMN基因数据处理和分析（版本1）

**选项说明**：
- **使用峰面积数据**：使用峰面积而非峰高进行计算
- **标准品样本名称**：指定标准品样本名称
- **Windows系统优化**：建议Windows用户保持勾选

---

### 📊 SMNFiler_v2（SMN数据分析 v2）
**用途**：专门用于SMN基因数据处理和分析（版本2）

**选项说明**：
- **标准品样本名称**：指定标准品样本名称
- **Windows系统优化**：建议Windows用户保持勾选

⚠️ **注意**：此版本不支持峰面积数据选项，必须使用峰高数据

---

### 💉 SHCarrier（携带者筛查）
**用途**：用于携带者筛查分析

**选项说明**：
- **使用峰面积数据**：切换计算模式（峰面积/峰高）
- **标准品样本名称**：指定标准品样本名称
- **Windows系统优化**：建议Windows用户保持勾选

---

### 🔍 UPDFiler_v1（UPD分析 v1）
**用途**：分析3500dx仪器数据中的UPD和其他异常情况（版本1）

**选项说明**：
- **Windows系统优化**：建议Windows用户保持勾选

⚠️ **注意**：此版本不支持峰面积数据选项

---

### 🔍 UPDFiler_v2（UPD分析 v2）
**用途**：分析3500dx仪器数据中的UPD和其他异常情况（版本2）

**选项说明**：
- **Windows系统优化**：建议Windows用户保持勾选

⚠️ **注意**：此版本不支持峰面积数据选项

## 6. ❓ FAQ & Troubleshooting

**❓ Q: What file formats are supported?**

A: The supported file formats depend on the underlying processing tools. Please refer to the documentation for the specific tool you are using.

**❓ Q: Where are the output files saved?**

A: The output files are saved in the same directory as the original input files.

**❓ Q: I encountered an error during processing. What should I do?**

**A:** If you encounter errors during processing, please follow these troubleshooting steps:

#### 🔍 Software-Defined Error Messages

CMTools displays the following specific error messages:

**English Error Messages:**
- `File not found` - Selected file path is invalid or file has been deleted
- `Failed to process file` - Problem occurred during file processing
- `Failed to execute program` - Internal tool program cannot start properly
- `Unknown tool name` - Selected an unsupported processing tool
- `Unable to open directory` - Cannot access the file's directory
- `Unable to create temporary executable file` - Insufficient permissions in system temp directory
- `Unable to write executable file data` - Insufficient disk space or permission issues
- `Unable to get file permissions` / `Unable to set executable permissions` - File permission related issues
- `Task execution failed` - Processing task terminated abnormally
- `IO error` - File read/write operation failed
- `Command execution failed` - Underlying command execution error
- `File processing error` - File format or content issues

#### 🛠️ Common Errors and Solutions

1. **File Format Error**
   - **Symptom**: `File processing error` or no output file after processing
   - **Solution**: Ensure you select the correct file format (usually .txt or .csv files)

2. **File Path Issues**
   - **Symptom**: `File not found` or `Unable to open directory`
   - **Solution**: Ensure file path contains no special characters, avoid using non-English paths

3. **Insufficient Permissions**
   - **Symptom**: `Unable to create temporary executable file` or `IO error`
   - **Solution**: Run software as administrator, or check folder read/write permissions

4. **Insufficient Disk Space**
   - **Symptom**: `Unable to write executable file data`
   - **Solution**: Free up disk space, especially in system temp directory

6. **Windows 7 System Specific Errors**
   - **Symptom**: `ProcessPrng could not be located in the dynamic link library bcryptprimitives.dll`
   - **Solution**: Use Windows 7 compatible version `CMTools.Win7.x86.exe`, refer to [Windows 7 Compatibility Guide](WINDOWS7_COMPATIBILITY.md)

7. **Antivirus Software Interference**
   - **Symptom**: `Failed to execute program` or `Command execution failed`
   - **Solution**: Add CMTools to antivirus software whitelist

#### 📋 Troubleshooting Steps

1. **Check file format**: Ensure you select the correct file format (usually .txt or .csv files).
2. **Check file path**: Ensure the file path contains no special characters or non-English characters.
3. **Check file permissions**: Ensure you have read and write permissions for the files.
4. **Restart software**: Sometimes restarting CMTools can resolve temporary issues.
5. **Review error messages**: Carefully read the specific error information in the error dialog, which usually provides clues for solving the problem.

If the problem persists, please record the specific error message and the type of file you're processing for further diagnosis.

**❓ Q: Can I process files from different folders at the same time?**

A: Yes, you can select files from multiple directories in the file selection dialog.

**❓ Q: Windows shows a security warning when I try to run CMTools. Is it safe?**

A: Yes, CMTools is completely safe. The warning appears because the application is not digitally signed with a commercial certificate. This is common for open-source and independent software. Here's how to safely run CMTools:

**Method 1: Windows SmartScreen**
1. When you see "Windows protected your PC", click `More info`
2. Click `Run anyway` button
3. CMTools will start normally

**Method 2: Windows Security Center**
1. If Windows Security blocks the file, go to `Windows Security` → `Virus & threat protection`
2. Under "Virus & threat protection settings", click `Manage settings`
3. Scroll down to "Exclusions" and click `Add or remove exclusions`
4. Click `Add an exclusion` → `File` and select `CMTools.exe`
5. The file will be permanently trusted

**Method 3: File Properties**
1. Right-click on `CMTools.exe` and select `Properties`
2. Check the box `Unblock` at the bottom (if present)
3. Click `OK` and try running the application again

**Why this happens:**
- CMTools is distributed as a portable application without commercial code signing
- Windows treats unsigned software with caution as a security measure
- This is normal behavior and doesn't indicate any actual security risk
- Many legitimate open-source applications show similar warnings

---

## 📚 Related Documentation

### 📖 Complete Documentation Set
- **[README.md](README.md)** - Complete developer documentation

### 🆘 Getting Help
If you encounter issues during use:
1. First consult this user manual and the README.md documentation
2. Confirm you're using the correct software version
3. Check the common solutions in the troubleshooting section
4. If the issue persists, seek technical support through the project page

### 💡 Quick Links
- **Online Help**: https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq
- **GitHub Project**: https://github.com/Cubicise/CMTools
- **Issue Reports**: Submit issue reports via GitHub Issues page

### 🛠️ Developer Build Command Reference

For developers and advanced users, here are the available build commands:

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run tauri:build` | Build version matching current system environment | Daily development and testing |
| `npm run tauri:build:win` | Build all Windows versions | Windows platform release |
| `npm run tauri:build:all` | Build all supported platform versions | Multi-platform full release |

> **Note**: The `npm run tauri:build` command automatically detects the current system environment and builds the corresponding version. For example, on a Windows 64-bit system it will build `CMTools.x64.exe`, and on a Windows 32-bit system it will build `CMTools.x86.exe`. The `npm run tauri:build:all` command builds all supported platform versions, including Windows, macOS, and Linux.

---

**CMTools Team** | Made with ❤️ for data analysis professionals

# 📖 CMTools 用户手册

## 1. 📜 简介

CMTools 是一款专为处理分析数据文件而设计的桌面应用程序。它提供了一个用户友好的界面，让您可以将不同的处理工具应用于您的数据文件，从而简化您的工作流程并提高效率。

**主要功能：**

*   **🔧 多种处理工具：** 支持 `AneuFiler`、`Aneu23`、`SMNFiler_v1`、`SHCarrier`、`UPDFiler_v1` 和 `UPDFiler_v2` 等多种工具。
*   **🗂️ 批量处理：** 一次性处理多个文件。
*   **⚙️ 可自定义选项：** 可调整处理参数，如使用峰面积数据和指定标准品样本名称。
*   **💻 跨平台：** 可在 Windows、macOS 和 Linux 上运行。
*   **🌍 多语言支持：** 提供英文和中文两种语言界面。
*   **🎨 亮色/暗色模式：** 可在不同主题之间切换，以获得舒适的视觉体验。

## 2. 🚀 如何运行

CMTools 是一款绿色软件，这意味着它无需安装。只需按照以下步骤操作：

1.  从官方发布页面下载适用于您操作系统的最新版本。
    - **对64位Windows系统：** 下载 `CMTools.x64.exe`
    - **对32位Windows系统：** 下载 `CMTools.x86.exe`
    - **对于Windows 7系统：** 下载 `CMTools.Win7.x86.exe`
    - **对于其他操作系统：** 下载相应版本
2.  将下载的文件解压缩到您喜欢的任何位置（如适用）。
3.  双击可执行文件直接运行应用程序。
    - 对64位：双击 `CMTools.x64.exe`
    - 对32位：双击 `CMTools.x86.exe`
    - 对于Windows 7：双击 `CMTools.Win7.x86.exe`

![CMTools 界面](https://cdn.jsdelivr.net/gh/NTLx/Pic/PicGo/202507170855602.gif)

**绿色软件的优势：**

*   **✅ 无需安装：** 无需复杂的安装过程即可直接运行。
*   **🧹 保持系统纯净：** 它不会向系统注册表写入数据，也不会在您的计算机上创建隐藏文件，从而避免系统变得臃肿。
*   **🎒 便携性：** 您可以将其存储在 U 盘或云存储中，并在任何兼容的计算机上运行。
*   **🗑️ 轻松删除：** 要卸载软件，只需删除应用程序文件夹即可，不会在您的系统上留下任何残留物。

**系统要求：**

*   **操作系统：** Windows 10 版本 1809 (17763) 或更高
*   **架构：** x64、x86 或 ARM64
*   **存储空间：** 至少 200MB 的可用存储空间
*   **运行时：** Microsoft Edge WebView2 运行时（大多数现代 Windows 系统上自动安装）

**版本选择指南：**

*   **64 位版本 (CMTools.x64.exe)：** 适用于大多数现代 Windows 系统。提供更好的性能和内存管理。
*   **32 位版本 (CMTools.x86.exe)：** 适用于较旧的系统或特定环境要求。兼容 32 位和 64 位 Windows 系统。
*   **Windows 7兼容版 (CMTools.Win7.x86.exe)：** 专门为Windows 7系统优化，解决API兼容性问题。

> **重要提示：** 如果您在Windows 7系统上遇到 `ProcessPrng could not be located` 错误，请使用 `CMTools.Win7.x86.exe` 版本。详细信息请参考 [Windows 7兼容性指南](WINDOWS7_COMPATIBILITY.md)。

## 3. 🖥️ 用户界面概览

CMTools 的主窗口分为几个部分：

1.  **标题栏：**
    *   **帮助 (`帮助`/`Help`)：** 打开在线帮助文档 (https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq)。
    *   **版本显示：** 显示应用程序的当前版本（例如 `v2.6.3`）。
    *   **语言切换 (`中文`/`English`)：** 在中文和英文之间切换界面语言。
    *   **主题切换 (`暗`/`亮` 或 `Dark`/`Light`)：** 在亮色和暗色模式之间切换。按钮的 `title` 属性会根据当前语言动态显示 `切换到亮色模式`/`Switch to light mode` 或 `切换到暗色模式`/`Switch to dark mode`。
    *   **Logo 和标题：** 显示应用程序的品牌标识。

2.  **工具选择：**
    *   选择您要使用的处理工具：`AneuFiler`、`Aneu23`、`SMNFiler_v1`、`SHCarrier`、`UPDFiler_v1` 或 `UPDFiler_v2`。

3.  **文件处理：**
    *   **选择文件 (`📁 选择文件`/`📁 Select Files`)：** 打开一个对话框，用于选择一个或多个要处理的数据文件。
    *   **清除 (`🗑️ 清除`/`🗑️ Clear`)：** 从列表中移除所有选定的文件。
    *   **已选择的文件列表：** 显示您已选择的文件的名称。

4.  **处理选项：**
    *   这些选项在您选择文件后出现，并可能根据所选工具的不同而有所变化。
    *   **使用峰面积数据进行计算：** 如果选中，工具将使用峰面积而不是峰高进行计算。
    *   **标准品样本名称：** (适用于 `Aneu23` 和 `SHCarrier`) 指定标准品样本的名称（例如 “STD”）。
    *   **Windows 系统优化：** (适用于 `SHCarrier`) 针对 Windows 系统优化文件编码。建议在 Windows 上保持启用状态。

5.  **开始处理：**
    *   **开始处理 (`🚀 开始处理`/`🚀 Start Processing`)：** 开始数据处理任务。运行时，按钮将显示 `⏳ 处理中...`/`⏳ Processing...`。

6.  **处理结果：**
    *   处理完成后，显示每个文件的处理结果。
    *   **成功 (`✅`)：** 表示文件已成功处理。
    *   **失败 (`❌`)：** 表示发生了错误。将出现一个包含详细信息的错误对话框。
    *   点击结果项将在文件浏览器中打开其所在目录并选中该文件。

## 4. 🛠️ 如何使用 CMTools

### 📝 第 1 步：选择工具

点击工具按钮（`AneuFiler`、`Aneu23`、`SMNFiler_v1`、`SHCarrier`、`UPDFiler_v1`、`UPDFiler_v2`）之一，以选择所需的处理算法。

### 📂 第 2 步：选择文件

1.  点击 `📁 选择文件` 按钮。
2.  在文件对话框中，导航到您的数据文件，选择一个或多个文件，然后点击 `打开`。
3.  所选文件将出现在“已选择的文件”列表中。

### ⚙️ 第 3 步：配置处理选项

-   **所有工具：** 通过勾选或取消勾选相应的复选框，决定是否要使用峰面积数据。（注意：UPDFiler_v1 和 UPDFiler_v2 不支持此选项）
-   **对于 `Aneu23`、`SMNFiler_v1` 和 `SHCarrier`：** 如果您的数据集包含标准品，请在 `标准品样本名称` 文本字段中输入其名称。
-   **对于 Windows 上的 `SMNFiler_v1`、`SHCarrier`、`UPDFiler_v1` 和 `UPDFiler_v2`：** 建议保持 `Windows 系统优化` 选项为勾选状态。

### 🚀 第 4 步：开始处理

1.  点击 `🚀 开始处理` 按钮。
2.  应用程序将按顺序处理每个文件。该按钮将被禁用并显示 `处理中...` 状态。

### 📊 第 5 步：查看结果

-   处理完成后，“处理结果”部分将显示每个文件的状态。
-   结果文件与相应的输入文件生成在同一目录中。
-   如果发生任何错误，将弹出一个对话框，其中包含详细的错误消息。
-   您可以点击任何结果项以在文件浏览器中快速定位到原始文件。

## 5. ⚙️ 特定工具详情

### 🧬 AneuFiler

*   **用途：** 通用数据筛选。
*   **输入：** 数据文件。
*   **选项：**
    *   `使用峰面积数据`：在峰高和峰面积之间切换计算模式。

### 🔬 Aneu23

*   **用途：** 专业分析，可能与 23 对染色体的非整倍性筛查有关。
*   **输入：** 可能包含标准品样本的数据文件。
*   **选项：**
    *   `使用峰面积数据`：切换计算模式。
    *   `标准品样本名称`：对于识别用于归一化或比较的标准品至关重要。

### 📊 SMNFiler_v1

*   **用途：** 专门用于 SMN 数据处理和分析（版本 1）。
*   **输入：** 可能包含对照样本的数据文件。
*   **选项：**
    *   `使用峰面积数据`：使用峰面积而非峰高进行计算。
    *   `标准品样本名称`：指定用于比较的对照样本名称。
    *   `Windows 系统优化`：针对 Windows 系统优化文件编码。

### 📊 SMNFiler_v2

*   **用途：** 专门用于 SMN 数据处理和分析（版本 2）。
*   **输入：** 可能包含对照样本的数据文件。
*   **选项：**
    *   `标准品样本名称`：指定用于比较的对照样本名称。
    *   `Windows 系统优化`：针对 Windows 系统优化文件编码。
*   **注意：** SMNFiler_v2 不支持使用峰面积数据进行计算，算法文档要求使用峰高数据。

### 💉 SHCarrier

*   **用途：** 另一种专业分析，可能用于携带者筛查。
*   **输入：** 数据文件，可能带有标准品。
*   **选项：**
    *   `使用峰面积数据`：切换计算模式。
    *   `标准品样本名称`：用于识别标准品样本。
    *   `Windows 系统优化`：确保在 Windows 上正确处理字符编码。

### 🔍 UPDFiler_v1

*   **用途：** 分析 3500dx 仪器数据中的 UPD 和其他异常情况（版本1）。
*   **输入：** 来自 GeneMapper 的数据文件。
*   **选项：**
    *   `Windows 系统优化`：确保在 Windows 上正确处理字符编码。
*   **输出：** 结果文件生成在与输入文件相同的目录中。该工具支持自定义输出路径配置。
*   **注意：** UPDFiler_v1 不支持峰面积数据计算选项。

### 🔍 UPDFiler_v2

*   **用途：** 分析 3500dx 仪器数据中的 UPD 和其他异常情况（版本2）。
*   **输入：** 来自 GeneMapper 的数据文件。
*   **选项：**
    *   `Windows 系统优化`：确保在 Windows 上正确处理字符编码。
*   **输出：** 结果文件生成在与输入文件相同的目录中。

## 6. ❓ 常见问题与解决方法

### 📋 问题速查表

| 问题现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| 文件处理失败 | 文件格式不支持 | 确保文件为 .txt 或 .csv 格式 |
| 文件不存在错误 | 文件路径有误 | 检查文件路径，避免特殊字符 |
| 无法创建临时文件 | 权限不足 | 以管理员身份运行软件 |
| 磁盘空间不足 | 临时目录已满 | 清理系统临时文件夹 |
| Windows 7 运行错误 | 版本不兼容 | 使用 `CMTools.Win7.x86.exe` 版本 |
| 防病毒软件拦截 | 误报为病毒 | 将 CMTools 添加到白名单 |

### 🔧 常见错误及解决方法

**1. 文件格式错误**
- **现象**：提示"文件处理错误"或处理后无输出文件
- **解决**：确保选择正确的文件格式（通常是 .txt 或 .csv 文件）

**2. 文件路径问题**
- **现象**：提示"文件不存在"或"无法打开目录"
- **解决**：确保文件路径中没有特殊字符，避免使用中文路径

**3. 权限不足**
- **现象**：提示"无法创建临时可执行文件"或"IO 错误"
- **解决**：右键点击 CMTools.exe，选择"以管理员身份运行"

**4. 磁盘空间不足**
- **现象**：提示"无法写入可执行文件数据"
- **解决**：清理磁盘空间，特别是系统临时目录（%TEMP%）

**5. Windows 7 特殊错误**
- **现象**：提示 `ProcessPrng could not be located`
- **解决**：必须使用 `CMTools.Win7.x86.exe` 版本

**6. 防病毒软件拦截**
- **现象**：提示"执行程序失败"或"命令执行失败"
- **解决**：将 CMTools 添加到防病毒软件白名单

### 🛡️ Windows 安全警告处理

**为什么出现安全警告？**
- CMTools 是绿色软件，没有商业代码签名
- Windows 对未签名软件显示安全警告是正常保护机制
- 这并不表示软件不安全

**如何运行 CMTools？**

**方法 1：直接运行**
1. 双击 CMTools.exe
2. 如果出现 Windows SmartScreen 警告：
   - 点击"更多信息"
   - 点击"仍要运行"

**方法 2：添加到排除项（推荐）**
1. 打开 Windows 安全中心 → 病毒和威胁防护
2. 点击"管理设置"
3. 滚动到"排除项" → "添加或删除排除项"
4. 点击"添加排除项" → "文件"
5. 选择 CMTools.exe

**方法 3：解除文件阻止**
1. 右键点击 CMTools.exe → 属性
2. 在底部勾选"解除阻止"（如果有此选项）
3. 点击确定

---

## 📚 获取帮助

### 🆘 遇到问题？

1. **查阅本手册**：大多数问题可以在使用指南和故障排除部分找到答案
2. **查看错误信息**：软件会显示明确的错误提示，请仔细阅读
3. **常见问题**：参考第6节的常见问题与解决方法
4. **在线帮助**：访问 https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq

### 💡 联系我们

- **项目主页**：https://github.com/Cubicise/CMTools
- **问题反馈**：通过 GitHub Issues 提交问题

---

**CMTools 团队** | 为数据分析专业人士打造 ❤️
