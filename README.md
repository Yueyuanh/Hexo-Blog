
# Hexo 博客部署与更新说明

## 项目简介
此项目使用 [Hexo](https://hexo.io/) 搭建的个人博客，部署在 [Netlify](https://www.netlify.com/) 上，内容存储在 GitHub 仓库中。

## 环境要求
- [Node.js](https://nodejs.org/) >= 16.x
- [npm](https://www.npmjs.com/) >= 7.x

## 初始化 Hexo 博客

### 安装 Hexo
在本地计算机上安装 Hexo：

1. 安装 [Node.js](https://nodejs.org/) 和 [npm](https://www.npmjs.com/)。
2. 全局安装 Hexo CLI：
   ```bash
   npm install -g hexo-cli


### 创建新的 Hexo 项目

如果你还没有现成的 Hexo 项目，可以使用以下命令来初始化一个新的项目：

```bash
hexo init my-blog
cd my-blog
npm install
```

这会生成一个新的 Hexo 项目，并安装相关依赖。

## 项目结构

Hexo 项目的主要文件结构如下：

```
my-blog/
├── source/               # 博客内容（文章、页面）
│   ├── _posts/           # 存储文章文件
│   ├── _data/            # 数据文件（如菜单配置）
│   └── _drafts/          # 草稿
├── themes/               # 主题文件
├── _config.yml           # 站点配置文件
└── package.json          # 项目依赖文件
```

## 编辑博客内容

### 创建新文章

要创建一个新文章，使用以下命令：

```bash
hexo new post "新文章标题"
```

新文章会创建在 `source/_posts/` 文件夹下。你可以打开这个 Markdown 文件并编辑内容。

文章的基本结构如下：

```markdown
---
title: 新文章标题
date: 2025-04-04 12:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类1
---

这是文章的内容。使用 Markdown 格式来书写。
```

### 修改现有文章

如果需要修改现有文章，直接编辑 `source/_posts/` 下的 `.md` 文件即可。

### 修改站点配置

站点配置文件位于 `_config.yml`，可以在这里修改博客的基本信息（如站点名称、描述、作者等）。

```yaml
title: 我的博客
subtitle: 我的Hexo博客
description: 这是我用Hexo搭建的博客
author: 你的名字
language: zh-CN
```

## 调试与本地预览

在本地查看博客更新，可以使用以下命令启动 Hexo 服务器：

```bash
hexo server
```

默认情况下，博客将会在 [http://localhost:4000](http://localhost:4000/) 上运行。

## 构建博客

每次更新完内容后，都需要执行以下命令来生成静态文件：

```bash
hexo generate
```

这将会在 `public/` 目录下生成网站的静态文件。

## 部署到 Netlify

### 配置 GitHub 仓库

1. 在 [GitHub](https://github.com/) 上创建一个新的仓库来存放博客内容。

2. 将 Hexo 项目推送到 GitHub 仓库：

   ```bash
   git init
   git add .
   git commit -m "初始化博客"
   git remote add origin https://github.com/你的GitHub用户名/your-repo-name.git
   git push -u origin master
   ```

### 配置 Netlify 部署

1. 在 [Netlify](https://www.netlify.com/) 上创建一个新的站点，并连接你的 GitHub 仓库。
2. 在 Netlify 的构建设置中，填写以下内容：
   - **Build Command**: `hexo generate` 或 `npm run build`
   - **Publish Directory**: `public`
3. 点击 "Deploy Site"，Netlify 会自动拉取你的 GitHub 仓库，进行构建并部署到 Netlify 上。

### 自动部署

每次你在 GitHub 仓库中提交代码并推送，Netlify 会自动触发构建流程并部署更新。

## 常见问题

### 1. `hexo generate` 失败

如果在生成过程中出现错误，检查是否有依赖包未安装，尝试运行：

```bash
npm install
```

### 2. 更新后博客没有反应

如果修改了文章或配置文件，确保执行了 `hexo generate` 以重新生成静态文件。如果部署到 Netlify，检查是否正确推送了更改到 GitHub 仓库。

### 3. 如何清理缓存

如果你遇到构建问题或希望清理 Hexo 的缓存，可以运行：

```bash
hexo clean
```

## 其他参考资料

- [Hexo 官方文档](https://hexo.io/docs/)
- [Netlify 官方文档](https://docs.netlify.com/)

