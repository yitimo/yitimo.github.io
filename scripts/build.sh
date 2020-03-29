#!/usr/bin/env bash

set -e

RED="\033[0;31m"
YELLOW="\033[1;33m"
GREEN="\033[0;32m"
RESET="\033[0m"

command=$1
if [ "$command" = "" ]; then
    echo "${RED}command is required: sh comment.sh <command>\n"
    exit 1
fi

if [ "$command" = "serve" ]; then
    yarn start
fi

if [ "$command" = "build" ]; then
    rimraf dist-core
    yarn build
    node scripts/core.merge.js
    jekyll build
fi
