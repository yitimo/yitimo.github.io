use std::path::Path;
use walkdir::WalkDir;
use anyhow::{Result, anyhow};
use rayon::prelude::*;

use crate::config::{Post, PostMetadata};

pub struct PostProcessor;

impl PostProcessor {
    pub async fn process_posts(posts: &mut Vec<Post>, source_dir: &Path) -> Result<()> {
        let posts_dir = source_dir.join("_posts");
        if !posts_dir.exists() {
            return Ok(());
        }

        // 收集所有 markdown 文件路径
        let mut post_paths = Vec::new();
        for entry in WalkDir::new(posts_dir).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                post_paths.push(path.to_path_buf());
            }
        }

        // 批量读取和解析文件元数据
        let post_data: Result<Vec<_>, _> = post_paths.par_iter()
            .map(|path| {
                let content = std::fs::read_to_string(path)?;
                let (metadata_str, content_body) = Self::parse_frontmatter(&content)?;
                
                if metadata_str.is_empty() {
                    return Err(anyhow!("No frontmatter found in post: {}", path.display()));
                }
                
                let metadata: PostMetadata = serde_yaml::from_str(&metadata_str)
                    .map_err(|e| anyhow!("Failed to parse metadata in {}: {}", path.display(), e))?;
                
                let url = Self::generate_post_url(path, source_dir)?;
                
                Ok((path.clone(), metadata, content_body, metadata_str, url))
            })
            .collect();

        let post_data = post_data?;

        // 并行处理 markdown 内容，使用 Rust 原生 markdown 库
        let processed_contents: Vec<String> = if !post_data.is_empty() {
            post_data.par_iter()
                .map(|(_, _, content_body, _, _)| {
                    // 使用 markdown 库将 markdown 转换为 HTML
                    markdown::to_html(content_body)
                })
                .collect()
        } else {
            Vec::new()
        };

        // 构建最终的 Post 对象
        for (i, (_path, metadata, _, _, url)) in post_data.into_iter().enumerate() {
            let html_content = processed_contents.get(i)
                .cloned()
                .unwrap_or_else(String::new);
            
            posts.push(Post {
                metadata,
                content: html_content,
                url,
            });
        }

        // Sort posts by date (newest first)
        posts.sort_by(|a, b| b.metadata.date.cmp(&a.metadata.date));

        Ok(())
    }

    fn parse_frontmatter(content: &str) -> Result<(String, String)> {
        // Normalize line endings first
        let normalized_content = content.replace("\r\n", "\n");
        
        if normalized_content.starts_with("---\n") {
            if let Some(end_pos) = normalized_content[4..].find("\n---\n") {
                let metadata = normalized_content[4..4 + end_pos].to_string();
                let content_body = normalized_content[4 + end_pos + 5..].to_string();
                Ok((metadata, content_body))
            } else {
                Err(anyhow!("Invalid frontmatter format: missing closing ---"))
            }
        } else {
            Ok((String::new(), normalized_content))
        }
    }

    fn generate_post_url(path: &Path, source_dir: &Path) -> Result<String> {
        let relative_path = path.strip_prefix(&source_dir.join("_posts"))?;
        let path_str = relative_path.to_string_lossy();
        
        // Convert from YYYY/MM/YYYY-MM-DD-title.md to /YYYY/MM/DD/title.html
        let parts: Vec<&str> = path_str.split('/').collect();
        if parts.len() >= 3 {
            let year = parts[0];
            let month = parts[1];
            let filename = parts[2];
            
            if let Some(captures) = regex::Regex::new(r"(\d{4})-(\d{2})-(\d{2})-(.+)\.md")?
                .captures(filename) {
                let day = &captures[3];
                let title = &captures[4];
                return Ok(format!("/{}/{}/{}/{}.html", year, month, day, title));
            }
        }
        
        Err(anyhow!("Invalid post path format"))
    }
}
