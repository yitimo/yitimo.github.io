use anyhow::Result;
use regex::Regex;

/// Processor for handling style tags
pub struct StyleProcessor;

impl StyleProcessor {
    pub fn new() -> Self {
        Self
    }

    /// Process style tags in template
    pub fn process(&self, template: &str) -> Result<String> {
        let style_re = Regex::new(r"\{%\s*style\s+([^%\s]+)\s*%\}")?;
        let mut result = template.to_string();
        
        for cap in style_re.captures_iter(template) {
            let full_match = &cap[0];
            let style_file = &cap[1];
            
            // Convert .scss to .css
            let css_file = if style_file.ends_with(".scss") {
                style_file.replace(".scss", ".css")
            } else {
                style_file.to_string()
            };
            
            let link_tag = format!("<link rel=\"stylesheet\" href=\"/assets/styles/{}\">", css_file);
            result = result.replace(full_match, &link_tag);
        }
        
        Ok(result)
    }
}
