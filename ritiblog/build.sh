#!/bin/bash

# ritiblog 二进制构建脚本
# 用于构建 Rust 静态博客生成器

set -e

echo "🔄 Building ritiblog binary..."

# 进入 ritiblog 目录
cd "$(dirname "$0")"

# 创建 bin 目录
mkdir -p bin

# 构建 release 版本
cargo build --release

if [ $? -eq 0 ]; then
    echo "✅ ritiblog binary built successfully at target/release/ritiblog"
    
    # 显示二进制文件信息
    ls -lh target/release/ritiblog
    
    # 复制到 bin 目录
    if [ -f "bin/ritiblog" ]; then
        rm "bin/ritiblog"
    fi
    cp target/release/ritiblog bin/ritiblog
    chmod +x bin/ritiblog
    echo "📦 Binary copied to ritiblog/bin/ directory"
    
    # 显示最终文件信息
    ls -lh bin/ritiblog
else
    echo "❌ Failed to build ritiblog binary"
    exit 1
fi
