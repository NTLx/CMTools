# Windows 优化开关的参数形式由前端配置字符串决定

为了同时支持不同分析工具各自的 GBK 编码开关写法（`-e GBK` / `-GBK` / `--GBK` / `--gbk`），`ToolConfig` 引入 `windowsOptimizationFlag: string | null` 字段，后端不再为各工具硬编码 match 分支，而是直接拼接前端传入的字符串。后端保留 `supportsWindowsOptimization()` 判定，仅用于在工具不支持该选项时跳过；具体的参数拼装形式完全由前端配置驱动。

## Status

Accepted

## Considered Options

- **枚举模型**：`windowsOptimizationStyle: 'arg-and-value' | 'flag-only'`。后端按枚举分支硬编码。优点：后端可控、可校验；缺点：每种新写法都要改一次 match 分支，违背配置驱动初衷，且未来若工具参数形式继续分化，枚举会膨胀。
- **字符串字段**：选用字符串字段，因为工具参数形式是各工具的私有约定，后端不应知道。

## Consequences

- 后端 `process_files_internal` 中原有的 `match tool { Tool::SMNFilerV1 => ... Tool::UpdfilerV1 => ... _ => "-GBK" }` 分支被替换为单行拼接：传入 `windowsOptimizationFlag` 字符串，按空格分隔成参数（保留多词写法如 `-e GBK`）。
- 所有现存工具的 `supports_windows_optimization()` 返回值保持不变（仍按现有 `matches!` 列表判定），但「该工具的 GBK 写法」信息从后端迁移到前端的 `tools` 数组配置。
- 前端 `tools` 配置是新的「权威来源」：今后任何工具的 GBK 参数调整都改前端一处。
- 一次性迁移负担：现有 6 个工具（SMNFilerV1/V2、SHCarrier、UpdfilerV1/V2、StrMatcher）的 GBK 写法要从前端 `tools` 数组中表达出来。
- 字符串字段不做运行时校验：写错（如漏空格、多空格）会让命令行拼接错误。建议在 `ToolConfig` 类型注释中明示「多词形式必须用单空格分隔」。