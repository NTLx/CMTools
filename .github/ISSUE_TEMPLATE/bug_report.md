---
name: Bug 报告
description: 报告一个错误帮助我们改进
title: "[Bug]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        感谢你花时间填写此 Bug 报告！
        在提交之前，请搜索 [现有 issues](https://github.com/lx/CMTools/issues) 以避免重复。

  - type: textarea
    id: description
    attributes:
      label: Bug 描述
      description: 请清晰简洁地描述这个 Bug
      placeholder: 例如：当点击 X 按钮时，程序崩溃了
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: 复现步骤
      description: 请详细列出复现此 Bug 的步骤
      placeholder: |
        1. 打开程序
        2. 点击 '...'
        3. 选择 '...'
        4. 看到错误
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: 预期行为
      description: 你期望发生什么
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: 实际行为
      description: 实际发生了什么
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: CMTools 版本
      description: 你使用的是哪个版本？
      placeholder: 例如：2.8.6
    validations:
      required: true

  - type: dropdown
    id: os
    attributes:
      label: 操作系统
      description: 你使用的是什么操作系统？
      options:
        - Windows 11
        - Windows 10
        - Windows 7
        - macOS (Apple Silicon)
        - macOS (Intel)
        - Linux
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 相关日志/截图
      description: 请复制粘贴任何相关日志输出或添加截图
      render: shell

  - type: textarea
    id: context
    attributes:
      label: 补充信息
      description: 添加有关此问题的任何其他背景信息
