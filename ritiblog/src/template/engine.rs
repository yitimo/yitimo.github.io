use std::collections::HashMap;
use anyhow::Result;
use serde_json::Value;
use std::sync::Arc;

use crate::template::regex_cache::RegexCache;
use crate::template::processors::Processors;

#[derive(Debug, Clone)]
pub struct TemplateEngine {
    includes: HashMap<String, String>,
    // 缓存编译后的正则表达式
    regex_cache: Arc<RegexCache>,
}

impl TemplateEngine {
    pub fn new() -> Result<Self> {
        Ok(Self {
            includes: HashMap::new(),
            regex_cache: Arc::new(RegexCache::new()?),
        })
    }

    pub fn load_includes<P: AsRef<std::path::Path>>(&mut self, includes_dir: P) -> Result<()> {
        let includes_path = includes_dir.as_ref();
        if !includes_path.exists() {
            return Ok(());
        }

        for entry in std::fs::read_dir(includes_path)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("html") {
                let name = path.file_stem()
                    .and_then(|s| s.to_str())
                    .ok_or_else(|| anyhow::anyhow!("Invalid include file name"))?;
                let content = std::fs::read_to_string(&path)?;
                self.includes.insert(name.to_string(), content);
            }
        }
        Ok(())
    }

    pub fn render(&self, template: &str, context: &Value) -> Result<String> {
        let mut result = template.to_string();
        let mut enhanced_context = context.clone();
        
        let processors = Processors::new(&self.includes, &self.regex_cache);
        
        // Process includes first (may need multiple passes for nested includes)
        result = processors.process_includes(&result)?;
        
        // Process style tags
        result = processors.process_style_tags(&result)?;
        
        // Process captures before other logic (they might contain variables/conditionals)
        let (new_result, captured_vars) = processors.process_captures_with_context(&result, &enhanced_context)?;
        result = new_result;
        
        // Add captured variables to context for use in conditionals
        if let Value::Object(ref mut obj) = enhanced_context {
            for (var_name, var_value) in captured_vars {
                obj.insert(var_name, Value::String(var_value));
            }
        }
        
        // Process loops (must be before conditionals to handle nested structures)
        result = processors.process_loops(&result, &enhanced_context, |template, context| {
            self.render(template, context)
        })?;
        
        // Process conditionals
        result = processors.process_conditionals(&result, &enhanced_context)?;
        
        // Process variable substitutions (including filters)
        result = processors.process_variables_with_filters(&result, &enhanced_context)?;
        
        // Final pass for any remaining includes that might have been added by previous processing
        result = processors.process_includes(&result)?;
        
        Ok(result)
    }
}
