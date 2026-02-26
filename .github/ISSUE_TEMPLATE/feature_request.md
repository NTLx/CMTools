---
name: 功能建议
description: 为这个项目提出一个想法
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        感谢你提出功能建议！
        在提交之前，请搜索 [现有 issues](https://github.com/lx/CMTools/issues) 以确保此建议未被提出。

  - type: textarea
    id: description
    attributes:
      label: 功能描述
      description: 请清晰简洁地描述你想要的功能
    validations:
      required: true

  - type: textarea
    id: use-case
    attributes:
      label: 使用场景
      description: 这个功能会解决什么问题？请描述你的使用场景
      placeholder: 例如：我经常需要处理大量数据文件，如果能有批量处理功能会大大提高效率
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: 期望的解决方案
      description: 你希望这个功能如何工作？
      placeholder: 例如：希望能有一个批量处理按钮，可以选择多个文件并一次性处理

  - type: textarea
    id: alternatives
    attributes:
      label: 替代方案（如有）
      description: 你考虑过哪些替代解决方案？

  - type: textarea
    id: context
    attributes:
      label: 补充信息
      description: 添加有关此功能请求的任何其他背景信息或截图
