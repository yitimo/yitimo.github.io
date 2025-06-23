use std::path::PathBuf;
use std::collections::HashMap;
use anyhow::Result;
use std::time::Instant;

use crate::config::{SiteConfig, Post};
use crate::template::TemplateEngine;

mod posts;
mod pages;
mod styles;
mod assets;
mod context;
mod layouts;

pub use posts::PostProcessor;
pub use pages::PageProcessor;
pub use styles::StyleProcessor;
pub use assets::AssetProcessor;
pub use layouts::LayoutLoader;

pub struct SiteGenerator {
    config: SiteConfig,
    source_dir: PathBuf,
    output_dir: PathBuf,
    template_engine: TemplateEngine,
    posts: Vec<Post>,
    layouts: HashMap<String, String>,
}

impl SiteGenerator {
    pub fn new(config: SiteConfig, source_dir: PathBuf, output_dir: PathBuf) -> Result<Self> {
        let mut template_engine = TemplateEngine::new()?;
        template_engine.load_includes(&source_dir.join("_includes"))?;

        Ok(Self {
            config,
            source_dir,
            output_dir,
            template_engine,
            posts: Vec::new(),
            layouts: HashMap::new(),
        })
    }

    pub async fn build(&mut self) -> Result<()> {
        let total_start = Instant::now();
        println!("🔄 Starting build process...");

        // Create output directory
        std::fs::create_dir_all(&self.output_dir)?;

        // Load layouts
        let start = Instant::now();
        LayoutLoader::load_layouts(&mut self.layouts, &self.source_dir)?;
        println!("✅ Layouts loaded in {:?}", start.elapsed());

        // Process posts
        let start = Instant::now();
        PostProcessor::process_posts(&mut self.posts, &self.source_dir).await?;
        println!("✅ Posts processed in {:?}", start.elapsed());

        // Process pages
        let start = Instant::now();
        PageProcessor::process_pages(
            &self.source_dir,
            &self.output_dir,
            &self.template_engine,
            &self.layouts,
            &self.posts,
            &self.config,
        ).await?;
        println!("✅ Pages processed in {:?}", start.elapsed());

        // Process styles
        let start = Instant::now();
        StyleProcessor::process_styles(&self.source_dir, &self.output_dir).await?;
        println!("✅ Styles processed in {:?}", start.elapsed());

        // Copy assets
        let start = Instant::now();
        AssetProcessor::copy_assets(&self.source_dir, &self.output_dir)?;
        println!("✅ Assets copied in {:?}", start.elapsed());

        println!("🎉 Total build time: {:?}", total_start.elapsed());
        Ok(())
    }
}
