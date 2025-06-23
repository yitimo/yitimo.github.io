use std::path::PathBuf;
use clap::{Parser, Subcommand};
use anyhow::Result;

mod config;
mod generator;
mod template;
// mod nodejs; // No longer needed - using Rust native libraries

use config::SiteConfig;
use generator::SiteGenerator;

#[derive(Parser)]
#[command(name = "ritiblog")]
#[command(about = "A static blog generator built with Rust")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Build the static site
    Build {
        /// Path to the source directory
        #[arg(short, long, default_value = ".")]
        source: PathBuf,
        /// Path to the output directory
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Serve the site locally
    Serve {
        /// Port to serve on
        #[arg(short, long, default_value = "3000")]
        port: u16,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Build { source, output } => {
            let config = SiteConfig::load(&source.join("yitiblog.json"))?;
            let output_dir = output.unwrap_or_else(|| source.join(&config.dist));
            
            let mut generator = SiteGenerator::new(config, source, output_dir)?;
            generator.build().await?;
            
            println!("Site built successfully!");
        }
        Commands::Serve { port } => {
            println!("Serving on port {}", port);
            // TODO: Implement serve functionality
        }
    }

    Ok(())
}
