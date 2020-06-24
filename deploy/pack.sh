echo "打包 yitimo.github.io"
echo "当前环境: $RICHES_ENV"
rm -rf release
cp -r _site release
cp Dockerfile release/