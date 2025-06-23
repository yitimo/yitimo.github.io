use std::path::Path;
use walkdir::WalkDir;
use anyhow::Result;
use rayon::prelude::*;

pub struct AssetProcessor;

impl AssetProcessor {
    pub fn copy_assets(source_dir: &Path, output_dir: &Path) -> Result<()> {
        let assets_dir = source_dir.join("assets");
        if !assets_dir.exists() {
            return Ok(());
        }

        let output_assets_dir = output_dir.join("assets");

        // 收集所有需要复制的文件
        let mut copy_tasks = Vec::new();
        for entry in WalkDir::new(&assets_dir).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                let relative_path = path.strip_prefix(&assets_dir)?;
                let output_path = output_assets_dir.join(relative_path);
                copy_tasks.push((path.to_path_buf(), output_path));
            }
        }

        // 并行复制文件
        let results: Vec<Result<(), anyhow::Error>> = copy_tasks.into_par_iter()
            .map(|(src_path, dest_path)| {
                if let Some(parent) = dest_path.parent() {
                    std::fs::create_dir_all(parent)?;
                }
                std::fs::copy(&src_path, &dest_path).map(|_| ()).map_err(Into::into)
            })
            .collect();

        // 检查是否有错误
        for result in results {
            result?;
        }

        Ok(())
    }
}
