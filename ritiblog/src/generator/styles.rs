use std::path::Path;
use anyhow::{Result, anyhow};
use rayon::prelude::*;

pub struct StyleProcessor;

impl StyleProcessor {
    pub async fn process_styles(source_dir: &Path, output_dir: &Path) -> Result<()> {
        let styles_dir = source_dir.join("_styles");
        if !styles_dir.exists() {
            return Ok(());
        }

        let output_styles_dir = output_dir.join("assets").join("styles");
        
        // 清理并重新创建输出目录
        if output_styles_dir.exists() {
            std::fs::remove_dir_all(&output_styles_dir)?;
        }
        std::fs::create_dir_all(&output_styles_dir)?;

        // 查找主要的SCSS入口文件（通常是index.scss）
        let mut main_scss_file = None;
        let mut css_files = Vec::new();
        
        for entry in std::fs::read_dir(&styles_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    match ext {
                        "scss" => {
                            let filename = path.file_stem()
                                .and_then(|s| s.to_str())
                                .unwrap_or("");
                            
                            // 找到主入口文件（index.scss 或 main.scss）
                            if filename == "index" || filename == "main" {
                                let output_path = output_styles_dir.join(format!("{}.css", filename));
                                main_scss_file = Some((path.clone(), output_path));
                                break; // 只处理第一个找到的主文件
                            }
                        }
                        "css" => {
                            let output_path = output_styles_dir.join(path.file_name().unwrap());
                            css_files.push((path.clone(), output_path));
                        }
                        _ => {}
                    }
                }
            }
        }

        // 使用 grass 编译主 SCSS 文件
        if let Some((input_path, output_path)) = main_scss_file {
            // 编译 SCSS 到 CSS，设置样式目录为包含路径
            let css_content = grass::from_path(&input_path, &grass::Options::default().load_paths(&[&styles_dir]))
                .map_err(|e| anyhow!("Failed to compile SCSS: {}", e))?;
            
            // 写入编译后的 CSS
            std::fs::write(output_path, css_content)?;
        }

        // 并行复制独立的CSS文件
        if !css_files.is_empty() {
            let results: Vec<Result<(), anyhow::Error>> = css_files.into_par_iter()
                .map(|(input_path, output_path)| {
                    std::fs::copy(&input_path, &output_path).map(|_| ()).map_err(Into::into)
                })
                .collect();

            // 检查是否有错误
            for result in results {
                result?;
            }
        }

        Ok(())
    }
}
