use std::path::Path;
use std::collections::HashMap;
use anyhow::{Result, anyhow};
use serde_json::Value;
use rayon::prelude::*;

use crate::config::{SiteConfig, Post};
use crate::template::TemplateEngine;
use super::context::ContextBuilder;

pub struct PageProcessor;

impl PageProcessor {
    pub async fn process_pages(
        source_dir: &Path,
        output_dir: &Path,
        template_engine: &TemplateEngine,
        layouts: &HashMap<String, String>,
        posts: &[Post],
        config: &SiteConfig,
    ) -> Result<()> {
        let pages_dir = source_dir.join("_pages");
        if !pages_dir.exists() {
            return Ok(());
        }

        for entry in std::fs::read_dir(pages_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("html") {
                Self::process_single_page(&path, output_dir, template_engine, layouts, posts, config).await?;
            }
        }

        // Generate post pages in parallel using rayon for better performance
        let results: Vec<Result<(), anyhow::Error>> = posts.par_iter()
            .map(|post| Self::generate_post_page_sync(post, output_dir, template_engine, layouts, posts, config))
            .collect();

        // Check for errors
        for result in results {
            result?;
        }

        Ok(())
    }

    async fn process_single_page(
        path: &Path,
        output_dir: &Path,
        template_engine: &TemplateEngine,
        layouts: &HashMap<String, String>,
        posts: &[Post],
        config: &SiteConfig,
    ) -> Result<()> {
        let content = std::fs::read_to_string(path)?;
        let (metadata_str, page_content) = Self::parse_frontmatter(&content)?;
        
        let layout = if !metadata_str.is_empty() {
            let metadata: Value = serde_yaml::from_str(&metadata_str)?;
            metadata.get("layout")
                .and_then(|v| v.as_str())
                .unwrap_or("default")
                .to_string()
        } else {
            "default".to_string()
        };

        let context = ContextBuilder::build_template_context(config, posts, Some(&page_content), None)?;
        let rendered_content = template_engine.render(&page_content, &context)?;
        
        let final_content = if let Some(layout_template) = layouts.get(&layout) {
            let mut layout_context = context.clone();
            if let Value::Object(ref mut map) = layout_context {
                map.insert("content".to_string(), Value::String(rendered_content));
            }
            template_engine.render(layout_template, &layout_context)?
        } else {
            rendered_content
        };

        let output_path = output_dir.join(path.file_name().unwrap());
        std::fs::write(output_path, final_content)?;

        Ok(())
    }

    fn generate_post_page_sync(
        post: &Post,
        output_dir: &Path,
        template_engine: &TemplateEngine,
        layouts: &HashMap<String, String>,
        posts: &[Post],
        config: &SiteConfig,
    ) -> Result<()> {
        let layout_template = layouts.get("post")
            .ok_or_else(|| anyhow!("Post layout not found"))?;

        let context = ContextBuilder::build_template_context_with_navigation(config, posts, Some(&post.content), Some(post))?;
        let final_content = template_engine.render(layout_template, &context)?;

        // Create output directory structure
        let url_path = post.url.trim_start_matches('/');
        let output_path = output_dir.join(url_path);
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(output_path, final_content)?;

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
}
