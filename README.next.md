# yitiblog

使用 vite 实现静态博客站点应用

实现vite插件将_posts下的md文档基于以下规则编译为静态html输出到docs目录下:
- _drafts 目录为博客草稿, 不参与编译
- _includes 目录为 html 片段, 可以在 _layouts 里通过 ``{{include xxx.html}}`` 使用
- _layouts 目录为布局文件, 可以在 _pages 里通过开头的 ---\nlayout: xxx\n--- 使用
  - 可以通过 ``{{content}}`` 渲染 _pages 里的实际内容
  - 可以使用 _includes 里的片段
- _pages 目录为实际页面, 可以套用 _layouts 和 _includes
  - 默认包含post.html套用_layouts下的post.html布局, 承载_posts下的md文档, post.html里的content即为markdown转换成的html片段
- 使用 markdown-it 和 yaml 库处理 md 文件, 可能出现在头部的 yaml 语法使用 yaml 转为 json 使用, 剩余部分使用 markdown-it 转为 html 使用
