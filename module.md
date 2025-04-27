---
title: {{ title }}       # 文章标题（必填，默认使用文件名）
date: {{ date }}         # 发布时间（必填，格式：YYYY-MM-DD HH:mm:ss）
tags: []                 # 文章标签（数组格式，如 [Java, 算法]）
categories: []           # 文章分类（数组格式，支持层级：如 [技术/前端]）
description:             # 文章摘要（显示在列表页，优先级高于 excerpt）

# 封面
cover:                   # 文章封面图（URL 或本地路径，显示在列表页）
banner:                  # 文章横幅图（URL，显示在正文顶部，可选）

poster:                  # 海报样式（全图封面卡片，可选）
  topic: 上方小字        # 海报副标题（可选）
  headline: 主标题       # 海报主标题（必填，覆盖 title）
  caption: 下方描述      # 海报底部描述（可选）
  color: 文字颜色        # 标题颜色（CSS 颜色值，如 #fff）

# 插件
sticky: 1                # 置顶优先级（数字越大越靠前，0 或 false 取消置顶）
mermaid: true            # 启用 Mermaid 流程图（需主题支持）
katex: true              # 启用 KaTeX 数学公式
mathjax: true            # 启用 MathJax 数学公式（与 KaTeX 二选一）

# 高级选项
topic: 专栏ID            # 关联专栏（需提前在主题配置中定义）
author: 作者名           # 覆盖全局作者（可选）
references:              # 参考文献（数组格式，用于脚注）
comments: false          # 关闭评论（默认 true）
indexing: false          # 禁止搜索引擎收录（默认 true）
breadcrumb: false        # 隐藏页面路径导航（默认 true）
leftbar: false           # 隐藏左侧边栏（默认主题控制）
rightbar: false          # 隐藏右侧边栏（默认主题控制）
h1: ''                   # 隐藏文章标题（设为空字符串）
type: tech               # 文章类型（tech/story，影响样式）
---
