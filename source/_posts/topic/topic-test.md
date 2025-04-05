---
title: topic test
date: 2025-04-05 15:34:31
topic: stellar
tags: 测试
cover: /assets/img1.png
banner: /assets/img1.png
poster:    # 海报（可选，全图封面卡片）
  topic:   # 可选
  headline:   # 必选
  caption:  # 可选
  color: black # 可选，默认为跟随主题的动态颜色 # white,red...
index_topic:
  menu_id: topic  # 与 menubar 中 id=topic 的项
---

摘要：
在心率管家默默无闻地上线了一年多之后，现在终于打算来好好聊聊关于手机摄像头测量心率的那些事。本文参考了很多前辈的文章，将在文末列出。

<!-- more -->

# 个人简介
{% banner 刘涵 这是个人简介 avatar:/assets/logo/bg_logo.png bg:/assets/img3.png %}
{% endbanner %}



# Topic

插入标记图片
{% banner 随记 bg:/assets/img2.png %}
{% endbanner %}


# 彩色note:
{% note 一共支持12种颜色，可以满足几乎所有的需求了。 color 可设置 red、orange、amber、yellow、green、cyan、blue、purple、light、dark、warning、error 几种取值。 %}
{% note color:cyan 一共支持12种颜色，可以满足几乎所有的需求了。 color 可设置 red、orange、amber、yellow、green、cyan、blue、purple、light、dark、warning、error 几种取值。 %}


# github:
个人仓库看板
{% ghcard yueyuanh %}

仓库链接：
{% ghcard xaoxuu/hexo-theme-stellar theme:dark %}



# 插入tag
{% hashtag Stellar https://xaoxuu.com/wiki/stellar/ %}
{% hashtag Hexo https://hexo.io/ %}
{% hashtag GitHub https://github.com/xaoxuu/ %}
{% hashtag Gitea https://git.xaox.cc/ color:green %}


# 时间轴
{% timeline %}
<!-- node 2021 年 2 月 16 日 -->
主要部分功能已经开发的差不多了。
{% image /assets/img2.png width:300px %}
<!-- node 2021 年 2 月 11 日 -->
今天除夕，也是生日，一个人在外地过年+过生日，熬夜开发新主题，尽量在假期结束前放出公测版。
{% endtimeline %}

# 图片墙
{% gallery %}
![@tianhao_wang](https://images.unsplash.com/photo-1688142202243-e218ad203952?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDYzfEZ6bzN6dU9ITjZ3fHxlbnwwfHx8fHw%3D)
![@eberhard](https://images.unsplash.com/photo-1700994630045-f7a20df6d92e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8MjN8fHxlbnwwfHx8fHw%3D)
![@eberhard](https://images.unsplash.com/photo-1533274221104-015a584a1005?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE4fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D)
![@eberhard](https://images.unsplash.com/photo-1539604214100-ab860d9082e0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDIxfGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D)
![@eberhard](https://images.unsplash.com/photo-1698843848092-588f9c1bb0bd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8Mzh8fHxlbnwwfHx8fHw%3D)
![@vklemen](https://images.unsplash.com/photo-1516571748831-5d81767b788d?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)
{% endgallery %}


# 文章摘要卡片
{% banner 
博客进阶：自动化部署 本文讲了如何利用脚本和 GitHub Actions 简化博客搭建和部署流程，提高效率。 
bg:/assets/img4.jpg
link:/blog/20221126/ %}
{% endbanner %}