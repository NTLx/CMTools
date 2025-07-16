# CMTools User Manual

## 1. Introduction

CMTools is a desktop application designed to process analytical data files. It provides a user-friendly interface to apply different processing tools to your data files, streamlining your workflow and improving efficiency.

**Key Features:**

*   **Multiple Processing Tools:** Supports various tools like AneuFiler, Aneu23, and SHCarrier.
*   **Batch Processing:** Process multiple files at once.
*   **Customizable Options:** Adjust processing parameters like using peak area data and specifying standard sample names.
*   **Cross-Platform:** Runs on Windows, macOS, and Linux.
*   **Multi-language Support:** Available in English and Chinese.
*   **Light/Dark Mode:** Switch between themes for your visual comfort.

## 2. How to Run

CMTools is a portable (green) software, which means it doesn't require any installation. Simply follow these steps:

1.  Download the latest version for your operating system from the official release page.
2.  Unzip the downloaded file to any location you prefer.
3.  Double-click the `cmtools.exe` executable file to run the application directly.

**Benefits of Portable Software:**

*   **No Installation Needed:** Runs directly without a complex setup process.
*   **System Cleanliness:** It does not write data to the system registry or create hidden files on your computer, preventing system clutter.
*   **Portability:** You can store it on a USB drive or cloud storage and run it on any compatible computer.
*   **Easy Removal:** To uninstall, simply delete the application folder. No residue will be left on your system.

## 3. User Interface Overview

![CMTools Interface](https://cdn.jsdelivr.net/gh/NTLx/Pic/PicGo/CMTools-v2.gif)

The main window of CMTools is divided into several sections:

1.  **Header:**
    *   **Help (`❓`):** Opens the online help documentation.
    *   **Version Display:** Shows the current version of the application (e.g., `v2.1.0`).
    *   **Language Switch (`CN`/`EN`):** Toggles the interface language between Chinese and English.
    *   **Theme Toggle (`☀️`/`🌙`):** Switches between light and dark mode.
    *   **Logo and Title:** Displays the application's branding.

2.  **Tool Selection:**
    *   Choose the processing tool you want to use: `AneuFiler`, `Aneu23`, or `SHCarrier`.

3.  **File Processing:**
    *   **Select Files (`📁 Select Files`):** Opens a dialog to select one or more data files for processing.
    *   **Clear (`🗑️ Clear`):** Removes all selected files from the list.
    *   **Selected Files List:** Displays the names of the files you have chosen.

4.  **Processing Options:**
    *   These options appear after you select files and may vary depending on the chosen tool.
    *   **Use peak area data for calculation:** If checked, the tool will use peak area instead of peak height for its calculations.
    *   **Standard Sample Name:** (For `Aneu23` and `SHCarrier`) Specify the name of the standard sample (e.g., "STD").
    *   **Windows System Optimization:** (For `SHCarrier`) Optimizes file encoding for Windows systems. It's recommended to keep this enabled on Windows.

5.  **Start Processing:**
    *   **Start Processing (`🚀 Start Processing`):** Begins the data processing task. The button will show `⏳ Processing...` while running.

6.  **Processing Results:**
    *   Displays the outcome for each file after processing is complete.
    *   **Success (`✅`):** Indicates the file was processed successfully.
    *   **Failure (`❌`):** Indicates an error occurred. An error dialog will appear with details.
    *   Clicking on a result item will open its containing folder and select the file in the file explorer.

## 4. How to Use CMTools

### Step 1: Select a Tool

Click on one of the tool buttons (`AneuFiler`, `Aneu23`, `SHCarrier`) to select the desired processing algorithm.

### Step 2: Select Files

1.  Click the `📁 Select Files` button.
2.  In the file dialog, navigate to your data files, select one or more, and click `Open`.
3.  The selected files will appear in the "Selected Files" list.

### Step 3: Configure Processing Options

-   **For all tools:** Decide if you want to use peak area data by checking or unchecking the corresponding box.
-   **For `Aneu23` and `SHCarrier`:** If your dataset includes a standard, enter its name in the `Standard Sample Name` text field.
-   **For `SHCarrier` on Windows:** It is recommended to keep the `Windows System Optimization` option checked.

### Step 4: Start Processing

1.  Click the `🚀 Start Processing` button.
2.  The application will process each file sequentially. The button will be disabled and show a `Processing...` status.

### Step 5: Review Results

-   Once processing is finished, the "Processing Results" section will show the status for each file.
-   Result files are generated in the same directory as their corresponding input files.
-   If any errors occurred, a dialog box will pop up with detailed error messages.
-   You can click on any result item to quickly locate the original file in your file explorer.

## 5. Tool-Specific Details

### AneuFiler

*   **Purpose:** General-purpose data filtering.
*   **Input:** Data files.
*   **Options:**
    *   `Use peak area data`: Toggles between peak height and peak area for calculations.

### Aneu23

*   **Purpose:** Specialized analysis, possibly related to aneuploidy screening with 23 chromosome pairs.
*   **Input:** Data files that may contain a standard sample.
*   **Options:**
    *   `Use peak area data`: Toggles calculation mode.
    *   `Standard Sample Name`: Crucial for identifying the standard for normalization or comparison.

### SHCarrier

*   **Purpose:** Another specialized analysis, potentially for carrier screening.
*   **Input:** Data files, possibly with a standard.
*   **Options:**
    *   `Use peak area data`: Toggles calculation mode.
    *   `Standard Sample Name`: For identifying the standard sample.
    *   `Windows System Optimization`: Ensures correct handling of character encoding on Windows.

## 6. FAQ & Troubleshooting

**Q: What file formats are supported?**

A: The supported file formats depend on the underlying processing tools. Please refer to the documentation for the specific tool you are using.

**Q: Where are the output files saved?**

A: The output files are saved in the same directory as the original input files.

**Q: I encountered an error during processing. What should I do?**

A: The error dialog provides details about the issue. Common errors include:
*   `File not found`: Ensure the selected files have not been moved or deleted.
*   `Failed to process file`: This could be due to an issue with the file format or content. Check the detailed error message from the tool.
*   `Failed to execute program`: This might indicate a problem with the CMTools installation or system permissions.

If you cannot resolve the issue, please contact support and provide the error message and the input file that caused the problem.

**Q: Can I process files from different folders at the same time?**

A: Yes, you can select files from multiple directories in the file selection dialog.

# CMTools 用户手册

## 1. 简介

CMTools 是一款专为处理分析数据文件而设计的桌面应用程序。它提供了一个用户友好的界面，让您可以将不同的处理工具应用于您的数据文件，从而简化您的工作流程并提高效率。

**主要功能:**

*   **多种处理工具:** 支持 AneuFiler、Aneu23 和 SHCarrier 等多种工具。
*   **批量处理:** 一次性处理多个文件。
*   **可自定义选项:** 可调整处理参数，如使用峰面积数据和指定标准品样本名称。
*   **跨平台:** 可在 Windows、macOS 和 Linux 上运行。
*   **多语言支持:** 提供英文和中文两种语言界面。
*   **亮色/暗色模式:** 可在不同主题之间切换，以获得舒适的视觉体验。

## 2. 如何运行

CMTools 是一款绿色软件，这意味着它无需安装。只需按照以下步骤操作：

1.  从官方发布页面下载适用于您操作系统的最新版本。
2.  将下载的文件解压缩到您喜欢的任何位置。
3.  双击可执行文件 `cmtools.exe` 直接运行应用程序。

**绿色软件的优势:**

*   **无需安装:** 无需复杂的安装过程即可直接运行。
*   **保持系统纯净:** 它不会向系统注册表写入数据，也不会在您的计算机上创建隐藏文件，从而避免系统变得臃肿。
*   **便携性:** 您可以将其存储在 U 盘或云存储中，并在任何兼容的计算机上运行。
*   **轻松删除:** 要卸载软件，只需删除应用程序文件夹即可，不会在您的系统上留下任何残留物。

## 3. 用户界面概览

![CMTools 界面](https://cdn.jsdelivr.net/gh/NTLx/Pic/PicGo/CMTools-v2.gif)

CMTools 的主窗口分为几个部分：

1.  **标题栏:**
    *   **帮助 (`❓`):** 打开在线帮助文档。
    *   **版本显示:** 显示应用程序的当前版本（例如 `v2.1.0`）。
    *   **语言切换 (`CN`/`EN`):** 在中文和英文之间切换界面语言。
    *   **主题切换 (`☀️`/`🌙`):** 在亮色和暗色模式之间切换。
    *   **Logo 和标题:** 显示应用程序的品牌标识。

2.  **工具选择:**
    *   选择您要使用的处理工具：`AneuFiler`、`Aneu23` 或 `SHCarrier`。

3.  **文件处理:**
    *   **选择文件 (`📁 选择文件`):** 打开一个对话框，用于选择一个或多个要处理的数据文件。
    *   **清除 (`🗑️ 清除`):** 从列表中移除所有选定的文件。
    *   **已选择的文件列表:** 显示您已选择的文件的名称。

4.  **处理选项:**
    *   这些选项在您选择文件后出现，并可能根据所选工具的不同而有所变化。
    *   **使用峰面积数据进行计算:** 如果选中，工具将使用峰面积而不是峰高进行计算。
    *   **标准品样本名称:** (适用于 `Aneu23` 和 `SHCarrier`) 指定标准品样本的名称（例如 “STD”）。
    *   **Windows 系统优化:** (适用于 `SHCarrier`) 针对 Windows 系统优化文件编码。建议在 Windows 上保持启用状态。

5.  **开始处理:**
    *   **开始处理 (`🚀 开始处理`):** 开始数据处理任务。运行时，按钮将显示 `⏳ 处理中...`。

6.  **处理结果:**
    *   处理完成后，显示每个文件的处理结果。
    *   **成功 (`✅`):** 表示文件已成功处理。
    *   **失败 (`❌`):** 表示发生了错误。将出现一个包含详细信息的错误对话框。
    *   点击结果项将在文件浏览器中打开其所在目录并选中该文件。

## 4. 如何使用 CMTools

### 第 1 步: 选择工具

点击工具按钮（`AneuFiler`、`Aneu23`、`SHCarrier`）之一，以选择所需的处理算法。

### 第 2 步: 选择文件

1.  点击 `📁 选择文件` 按钮。
2.  在文件对话框中，导航到您的数据文件，选择一个或多个文件，然后点击 `打开`。
3.  所选文件将出现在“已选择的文件”列表中。

### 第 3 步: 配置处理选项

-   **所有工具:** 通过勾选或取消勾选相应的复选框，决定是否要使用峰面积数据。
-   **对于 `Aneu23` 和 `SHCarrier`:** 如果您的数据集包含标准品，请在 `标准品样本名称` 文本字段中输入其名称。
-   **对于 Windows 上的 `SHCarrier`:** 建议保持 `Windows 系统优化` 选项为勾选状态。

### 第 4 步: 开始处理

1.  点击 `🚀 开始处理` 按钮。
2.  应用程序将按顺序处理每个文件。该按钮将被禁用并显示 `处理中...` 状态。

### 第 5 步: 查看结果

-   处理完成后，“处理结果”部分将显示每个文件的状态。
-   结果文件与相应的输入文件生成在同一目录中。
-   如果发生任何错误，将弹出一个对话框，其中包含详细的错误消息。
-   您可以点击任何结果项以在文件浏览器中快速定位到原始文件。

## 5. 特定工具详情

### AneuFiler

*   **用途:** 通用数据筛选。
*   **输入:** 数据文件。
*   **选项:**
    *   `使用峰面积数据`: 在峰高和峰面积之间切换计算模式。

### Aneu23

*   **用途:** 专业分析，可能与 23 对染色体的非整倍性筛查有关。
*   **输入:** 可能包含标准品样本的数据文件。
*   **选项:**
    *   `使用峰面积数据`: 切换计算模式。
    *   `标准品样本名称`: 对于识别用于归一化或比较的标准品至关重要。

### SHCarrier

*   **用途:** 另一种专业分析，可能用于携带者筛查。
*   **输入:** 数据文件，可能带有标准品。
*   **选项:**
    *   `使用峰面积数据`: 切换计算模式。
    *   `标准品样本名称`: 用于识别标准品样本。
    *   `Windows 系统优化`: 确保在 Windows 上正确处理字符编码。

## 6. 常见问题与故障排除

**问: 支持哪些文件格式？**

答: 支持的文件格式取决于底层的处理工具。请参考您正在使用的特定工具的文档。

**问: 输出文件保存在哪里？**

答: 输出文件保存在与原始输入文件相同的目录中。

**问: 我在处理过程中遇到了错误。我该怎么办？**

答: 错误对话框提供了有关问题的详细信息。常见错误包括：
*   `文件不存在`: 确保所选文件未被移动或删除。
*   `处理文件失败`: 这可能是由于文件格式或内容的问题。请检查工具提供的详细错误消息。
*   `执行程序失败`: 这可能表示 CMTools 安装或系统权限存在问题。

如果您无法解决问题，请联系支持人员并提供导致问题的错误消息和输入文件。

**问: 我可以同时处理来自不同文件夹的文件吗？**

答: 可以，您可以在文件选择对话框中从多个目录中选择文件。