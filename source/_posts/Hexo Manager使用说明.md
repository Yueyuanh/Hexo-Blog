---
title: Obsidian Hexo Manager 使用说明
date: 2026-10-30 23:20:00
tags:
  - Hexo
  - Obsidian
categories:
  - 工具
---

Hexo Manager 是本博客仓库中的 Obsidian 社区插件，用来在 Obsidian 里完成文章创建、本地预览、网站构建和 Git 发布。

## 使用前准备

本插件只支持 Obsidian 桌面版。打开本仓库作为 Obsidian 库：

```text
E:\桌面\Projects\Website.io\Hexo\my-blog
```

在 Obsidian 的“设置 → 社区插件”中关闭受限模式，并确认 `Hexo Manager` 已启用。第一次修改插件文件后，需要完全退出并重新打开 Obsidian，插件才会重新加载。

博客目录必须已经安装依赖。如果构建提示找不到 Hexo，请在博客目录执行：

```powershell
npm install
```

## 常用命令

按 `Ctrl+P` 打开命令面板，可以使用以下命令：

| 命令 | 作用 |
| --- | --- |
| `Hexo: 新建文章` | 输入标题，在 `source/_posts` 创建带 Hexo front matter 的文章 |
| `Hexo: 构建网站` | 执行 Hexo generate，检查文章和资源是否能正常生成 |
| `Hexo: 启动本地预览` | 启动本地服务器并打开 `http://localhost:4000` |
| `Hexo: 打开本地网站` | 打开已经运行的本地预览 |
| `Hexo: 停止本地预览` | 停止本地服务器 |
| `Hexo: 发布到 Git 远程仓库` | 构建网站、提交变更并推送到远程仓库 |

右侧火箭图标也可以直接启动本地预览。

## 图片和附件

Obsidian 附件目录已设置为 `source/assets`。例如文件位于：

```text
source/assets/RM/RMroad.jpg
```

文章中可以使用：

```markdown
![RMroad](/assets/RM/RMroad.jpg)
```

插件会在 Obsidian 预览中把 `/assets/...` 映射到本地文件；Hexo 构建时仍使用网站的 `/assets/...` 路径。

## 发布流程

发布命令会按以下顺序执行：

1. 构建网站。
2. 显示 Git 变更列表。
3. 输入提交说明并确认。
4. 执行 `git add -A`、`git commit` 和 `git push`。

确认窗口中的变更列表是实际会提交的内容。若列表里包含暂时不想发布的文件，请先取消，在 Git 中整理变更后再发布。远程仓库推送成功后，Netlify 会根据仓库中的 `netlify.toml` 自动执行 `npm run build` 并发布 `public` 目录。

## 常见问题

### 新建文章失败

确认博客目录存在 `node_modules/hexo`。不存在时先执行 `npm install`，然后重启 Obsidian。

### 本地预览打不开

确认 `http://localhost:4000` 没有被其他程序占用。若之前启动过预览，先执行“Hexo: 停止本地预览”，再重新启动。

### 网站仍显示旧内容或 404

本地构建成功不等于远程网站已经更新。需要通过发布命令推送到 GitHub，并等待 Netlify 部署完成。新文章的 URL 以 Hexo 生成结果为准，可以先在本地预览中打开确认。
