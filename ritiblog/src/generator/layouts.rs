use std::path::Path;
use std::collections::HashMap;
use anyhow::{Result, anyhow};

pub struct LayoutLoader;

impl LayoutLoader {
    pub fn load_layouts(layouts: &mut HashMap<String, String>, source_dir: &Path) -> Result<()> {
        let layouts_dir = source_dir.join("_layouts");
        if !layouts_dir.exists() {
            return Ok(());
        }

        for entry in std::fs::read_dir(layouts_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("html") {
                let name = path.file_stem()
                    .and_then(|s| s.to_str())
                    .ok_or_else(|| anyhow!("Invalid layout file name"))?;
                let content = std::fs::read_to_string(&path)?;
                layouts.insert(name.to_string(), content);
            }
        }

        Ok(())
    }
}
