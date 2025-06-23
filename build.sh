#!/bin/bash

# Static blog generator build script
# Supports different build modes for ritiblog

set -e

# Default values
MODE=""
WATCH_MODE=false

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --make       Build ritiblog binary only"
    echo "  -b, --build      Build blog using existing binary"
    echo "  -w, --watch      Build blog and watch for changes (requires -b)"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -m            # Build ritiblog binary"
    echo "  $0 -b            # Build blog"
    echo "  $0 -b -w         # Build blog and watch for changes"
    echo "  $0 -w            # Same as -b -w"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--make)
            MODE="make"
            shift
            ;;
        -b|--build)
            MODE="build"
            shift
            ;;
        -w|--watch)
            WATCH_MODE=true
            if [ -z "$MODE" ]; then
                MODE="build"
            fi
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# If no mode specified, default to build
if [ -z "$MODE" ]; then
    MODE="build"
fi

# Function to build ritiblog binary
build_binary() {
    echo "� Building ritiblog binary..."
    ./ritiblog/build.sh
}

# Function to check if binary exists
check_binary() {
    if [ ! -f "./ritiblog" ] && [ ! -f "./ritiblog/target/release/ritiblog" ]; then
        echo "❌ ritiblog binary not found!"
        echo "💡 Run '$0 -m' to build the binary first"
        exit 1
    fi
    
    # Use local binary if available, otherwise use the one in target
    if [ -f "./ritiblog" ]; then
        RITIBLOG_BIN="./ritiblog"
    else
        RITIBLOG_BIN="./ritiblog/target/release/ritiblog"
    fi
}

# Function to build the blog
build_blog() {
    check_binary
    
    echo "🔄 Generating static site..."
    $RITIBLOG_BIN build
    
    if [ $? -eq 0 ]; then
        echo "✅ Static site generated successfully in temps/ directory"
        echo "📊 Generated files:"
        find temps -type f -name "*.html" | wc -l | xargs echo "   HTML files:"
        find temps -type f -name "*.css" | wc -l | xargs echo "   CSS files:"
        find temps -type f \( -name "*.js" -o -name "*.json" -o -name "*.txt" \) | wc -l | xargs echo "   Other files:"
        echo "🕐 $(date)"
        return 0
    else
        echo "❌ Failed to generate static site"
        return 1
    fi
}

# Main execution logic
case $MODE in
    "make")
        echo "🔧 Building ritiblog binary only..."
        build_binary
        ;;
    "build")
        if [ "$WATCH_MODE" = true ]; then
            echo "🔄 Building blog with watch mode..."
        else
            echo "🔄 Building blog..."
        fi
        
        # Initial build
        build_blog
        
        if [ "$WATCH_MODE" = true ]; then
            echo ""
            echo "👁️  Watch mode enabled. Monitoring for changes..."
            echo "   Watching: _posts/, _pages/, _layouts/, _includes/, _styles/, yitiblog.json"
            echo "   Press Ctrl+C to stop"
            echo ""
            
            # Check if fswatch is available
            if ! command -v fswatch &> /dev/null; then
                echo "📦 fswatch not found. Installing via Homebrew..."
                if command -v brew &> /dev/null; then
                    brew install fswatch
                else
                    echo "❌ Homebrew not found. Please install fswatch manually:"
                    echo "   brew install fswatch"
                    exit 1
                fi
            fi
            
            # Watch for changes and rebuild
            fswatch -o \
                _posts/ \
                _pages/ \
                _layouts/ \
                _includes/ \
                _styles/ \
                yitiblog.json 2>/dev/null | while read change; do
                echo ""
                echo "🔄 File change detected, rebuilding..."
                build_blog
                echo ""
                echo "👁️  Watching for changes... (Press Ctrl+C to stop)"
            done
        else
            echo ""
            echo "💡 Tip: Use -w or --watch to automatically rebuild when files change"
            echo "   $0 -b -w"
        fi
        ;;
    *)
        echo "❌ Invalid mode: $MODE"
        show_help
        exit 1
        ;;
esac
