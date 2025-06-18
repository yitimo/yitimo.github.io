# yitiblog

使用 vite + vue3 实现静态博客站点应用

- _drafts 目录为博客草稿, 不参与编译
- _includes 目录为 html 片段, 可以在 _layouts 里通过 ``{{include xxx.html}}`` 使用
- _layouts 目录为布局文件, 可以在 _pages 里通过开头的 ---\nlayout: xxx\n--- 使用
  - 可以通过 ``{{content}}`` 渲染 _pages 里的实际内容
  - 可以使用 _includes 里的片段
- _pages 目录为实际页面, 可以套用 _layouts 和 _includes
