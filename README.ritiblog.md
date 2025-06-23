# Ritiblog - Rust 静态博客生成器

一个基于 Rust 的静态博客站点生成器，支持类 Liquid 模板语法，完全使用 Rust 原生库处理 Markdown 和 SCSS。

## 特性

- ✅ 基于 `yitiblog.json` 配置文件  
- ✅ 支持类 Liquid 模板语法
- ✅ Markdown 文档编译为 HTML (使用 Rust markdown 库)
- ✅ SCSS/CSS 样式处理 (使用 Rust grass 库)
- ✅ YAML 前置元数据解析 (使用 serde_yaml)
- ✅ Include 模板片段支持
- ✅ 布局系统支持
- ✅ 自动资源文件复制
- ✅ 草稿文件过滤 (_drafts 目录不参与编译)
- ✅ 极致性能优化 (~400ms 总构建时间)
- ✅ 完全移除 Node.js 依赖

## 项目结构

```
├── ritiblog/                 # Rust 源码目录
│   ├── src/
│   │   ├── main.rs          # 主程序入口
│   │   ├── config.rs        # 配置和数据结构
│   │   ├── generator.rs     # 站点生成器核心逻辑 (含 SCSS/Markdown 处理)
│   │   └── template.rs      # 模板引擎 (类 Liquid 语法)
│   ├── build.sh             # 二进制构建脚本
│   └── Cargo.toml           # Rust 依赖配置
├── _posts/                   # Markdown 博客文章 (按年/月归档)
├── _drafts/                  # 草稿文件 (不参与编译)
├── _includes/                # HTML 模板片段
├── _layouts/                 # 布局文件
├── _pages/                   # 静态页面
├── _styles/                  # 样式文件 (.scss/.css)
├── assets/                   # 静态资源文件
├── temps/                    # 生成的输出目录
├── yitiblog.json            # 站点配置文件
├── build.sh                 # 主构建脚本 (支持参数化操作)
└── ritiblog                 # 编译后的二进制文件
```

## 使用方法

### 1. 安装依赖

确保已安装 Rust，然后构建项目：

```bash
# 构建 ritiblog 二进制文件
./build.sh -m

# 或直接进入 ritiblog 目录构建
cd ritiblog && ./build.sh
```

### 2. 构建博客

```bash
# 构建博客
./build.sh -b

# 构建博客并启用监听模式
./build.sh -w

# 显示帮助信息
./build.sh -h
```

### 3. 构建选项

- `-m, --make`: 仅构建 ritiblog 二进制文件
- `-b, --build`: 构建博客内容（默认操作）
- `-w, --watch`: 启用监听模式，文件变更时自动重建
- `-h, --help`: 显示帮助信息

### 4. 监听模式

监听模式会自动监控以下目录的文件变更：
- `_posts/` - 博客文章
- `_pages/` - 静态页面 
- `_layouts/` - 布局文件
- `_includes/` - 模板片段
- `_styles/` - 样式文件
- `yitiblog.json` - 配置文件

当检测到文件变更时，会自动重新构建博客。

## 模板语法支持

### 变量插值
```html
{{ site.title }}
{{ page.title }}
{{ post.date | date:'%Y-%m-%d' }}
```

### 条件语句
```html
{% if page.updateDate %}
    修改于: {{ page.updateDate | date: '%Y-%m-%d %H:%M' }}
{% else %}
    发布于: {{ page.date | date: '%Y-%m-%d %H:%M' }}
{% endif %}
```

### 循环语句
```html
{% for post in site.posts %}
    <a href="{{ post.url }}">{{ post.title }}</a>
{% endfor %}
```

### Include 片段
```html
{% include header.html %}
{% include posts.html %}
```

### 样式引用
```html
{% style index.scss %}
```

## 文件格式

### 博客文章 (_posts/*.md)
```markdown
---
layout: post
title: 文章标题
date: 2024-01-01 10:00:00 +0800
author: 作者名
categories: frontend
tags: ["tag1", "tag2"]
description: 文章描述
---

文章内容...
```

### 页面文件 (_pages/*.html)
```html
---
layout: home
---

页面内容...
```

### 站点配置 (yitiblog.json)
```json
{
  "title": "站点标题",
  "email": "admin@example.com", 
  "description": "站点描述",
  "baseurl": "",
  "url": "https://example.com",
  "github_username": "username",
  "dist": "temps"
}
```

## 命令行选项

```bash
# 构建站点到默认输出目录
./ritiblog build

# 指定源目录和输出目录  
./ritiblog build --source /path/to/source --output /path/to/output

# 查看帮助
./ritiblog --help
```

## 依赖说明

### Rust 依赖
- `serde` - JSON/YAML 序列化/反序列化
- `tokio` - 异步运行时 
- `walkdir` - 目录遍历
- `regex` - 正则表达式
- `chrono` - 日期时间处理
- `clap` - 命令行参数解析
- `grass` - SCSS 编译 (Rust 原生)
- `markdown` - Markdown 解析 (Rust 原生)
- `rayon` - 并行处理
- `futures` - 异步编程

## 性能特性

- **极致性能**: 总构建时间约 400ms
- **并行处理**: 使用 rayon 并行处理文件
- **批量操作**: 减少 I/O 操作次数
- **模板缓存**: 避免重复解析模板
- **纯 Rust 实现**: 完全移除 Node.js 依赖

## 开发说明

- 模板引擎手动实现，支持主要的 Liquid 语法
- 完全使用 Rust 原生库处理 Markdown 和 SCSS
- 支持 Windows/Unix 风格换行符
- 自动处理文件扩展名 (如 `.html` 后缀)
- 错误处理包含详细的文件路径和错误信息
