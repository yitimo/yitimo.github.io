use std::collections::HashMap;
use anyhow::Result;
use regex::Regex;

/// Processor for handling include directives
pub struct IncludeProcessor<'a> {
    pub includes: &'a HashMap<String, String>,
}

impl<'a> IncludeProcessor<'a> {
    pub fn new(includes: &'a HashMap<String, String>) -> Self {
        Self { includes }
    }

    /// Process include directives in template
    pub fn process(&self, template: &str) -> Result<String> {
        let include_re = Regex::new(r"\{%\s*include\s+([^%\s]+)\s*%\}")?;
        let mut result = template.to_string();
        let mut iteration = 0;
        const MAX_ITERATIONS: usize = 10; // Prevent infinite loops
        
        while include_re.is_match(&result) && iteration < MAX_ITERATIONS {
            let temp_result = result.clone();
            for cap in include_re.captures_iter(&temp_result) {
                let full_match = &cap[0];
                let include_name = &cap[1];
                
                // Try to find the include with or without .html extension
                let key = if include_name.ends_with(".html") {
                    include_name.strip_suffix(".html").unwrap()
                } else {
                    include_name
                };
                
                if let Some(include_content) = self.includes.get(key) {
                    result = result.replace(full_match, include_content);
                } else {
                    // If include not found, replace with empty string or warning comment
                    result = result.replace(full_match, &format!("<!-- Include not found: {} -->", include_name));
                }
            }
            iteration += 1;
        }
        
        Ok(result)
    }
}
