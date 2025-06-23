# yitiblog

使用 rust 实现静态博客站点生成器, 从yitiblog.json配置生成规则:
- rs 源码实现到 ritiblog 目录, 构建脚本为 /build.sh, 并支持 --watch 参数监听变化
- nodejs 源码实现到 scripts 目录, 使用项目根目录的 package.json 管理, 供 rs 调用
- html 文件内使用了类 liquid 模板语法, 手动用 rs 实现解析器支持现有语法
- 将 _posts 下的 md 文档编译为静态 html 输出到 temps 目录下
- _drafts 目录下为博客草稿, 不参与编译
- _includes 目录下为 html 片段, 可以通过模板语法 ``include xxx.html`` 引用插入
- _layouts 目录为布局文件
  - 可以在 _pages 里通过开头的 ---\nlayout: xxx\n--- 语法套用布局
  - 可以使用 ``{{content}}`` 语法渲染套用了布局的 html 文件本身的内容
- _pages 目录为实际要生成的 html 页面
  - 隐式包含 post.html 套用 _layouts 下的 post.html 作为布局, 套用 _posts 下的 md 文档生成的 html 作为 content
- _posts 目录为 md 博客内容, 通过年/月目录归档, 最终编译为 html
  - 使用 nodejs markdown-it 库处理 md 语法
  - 使用 nodejs yaml 库处理可能出现在头部的 yaml 语法, 用来配置页面
- _styles 目录为样式文件
  - 支持 scss 和 css
  - 使用 nodejs sass 库编译 scss 文件为 css
  - 支持在 html 里通过 ``style xxx.scss`` 模板语法引用, 产物编译为外联 css 文件
