# CMTools

CMTools 是一个通过调用嵌入的外部命令行分析工具来处理色谱数据的 Tauri 桌面应用。前端描述工具能力，后端只负责按描述执行命令，不为每个工具硬编码 match 分支。

## Language

**ToolConfig**:
前端 `src/App.vue` 中描述单个分析工具能力的配置对象。每个工具的 GBK 编码开关写法、是否支持标准品等元数据都集中在此对象中表达。
_Avoid_: 工具描述、工具元数据

**Windows 优化（GBK 编码）**:
同一 UI 选项（`supportsWindowsOptimization: true` 时显示的复选框）背后可以为不同工具生成不同的命令行参数形式（`-e GBK` / `-GBK` / `--GBK` / `--gbk`）。参数形式由 `ToolConfig.windowsOptimizationFlag` 字符串字段描述，后端不做分支决策。
_Avoid_: GBK 选项、编码开关

**配置驱动架构**:
CMTools 添加或修改工具能力时，只改前端 `tools` 数组与后端通用逻辑（`_ =>` 默认分支、字符串拼接），不为各工具新增 match 分支。例外：当能力与工具行为强耦合（如 STR-Matcher 的 Tolerance、UPDFiler_v2 的 `-dev`）时，仍保留 match 分支。
_Avoid_: 工具适配层、adapter 模式