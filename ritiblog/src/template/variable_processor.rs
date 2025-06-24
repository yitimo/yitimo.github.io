use std::collections::HashMap;
use anyhow::Result;
use serde_json::Value;
use crate::template::filters::apply_filter;
use crate::template::regex_cache::RegexCache;
use crate::template::utils::get_nested_value;

/// Processor for handling variables and filters
pub struct VariableProcessor<'a> {
    pub regex_cache: &'a RegexCache,
}

impl<'a> VariableProcessor<'a> {
    pub fn new(regex_cache: &'a RegexCache) -> Self {
        Self { regex_cache }
    }

    /// Process capture directives and return captured variables
    pub fn process_captures(&self, template: &str, context: &Value) -> Result<(String, HashMap<String, String>)> {
        let mut result = template.to_string();
        let mut capture_vars = HashMap::new();
        
        // First pass: collect all captures
        for cap in self.regex_cache.capture_regex.captures_iter(template) {
            let full_match = &cap[0];
            let var_name = &cap[1];
            let content = &cap[2];
            
            // Process the content first (may contain variables)
            let processed_content = self.process_variables(content, context)?;
            capture_vars.insert(var_name.to_string(), processed_content);
            
            // Remove the capture block from result
            result = result.replace(full_match, "");
        }
        
        // Second pass: replace captured variables in the template
        for (var_name, var_value) in &capture_vars {
            let var_pattern = format!("{{{{{}}}}}", var_name);
            result = result.replace(&var_pattern, var_value);
        }
        
        Ok((result, capture_vars))
    }

    /// Process variables and filters in template
    pub fn process_variables(&self, template: &str, context: &Value) -> Result<String> {
        let mut result = template.to_string();
        
        for cap in self.regex_cache.variable_regex.captures_iter(template) {
            let full_match = &cap[0];
            let expression = &cap[1].trim();
            
            let replacement = if expression.contains('|') {
                // Handle filters
                let parts: Vec<&str> = expression.split('|').collect();
                let var_path = parts[0].trim();
                
                let mut result_value = if var_path == "'now'" || var_path == "\"now\"" {
                    "now".to_string()
                } else if let Some(value) = get_nested_value(context, var_path) {
                    match value {
                        Value::String(s) => s.clone(),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        _ => value.to_string().trim_matches('"').to_string(),
                    }
                } else {
                    String::new()
                };
                
                // Apply filters in sequence
                for filter in &parts[1..] {
                    let filter_str = filter.trim();
                    result_value = apply_filter(&result_value, filter_str)?;
                }
                
                result_value
            } else {
                // Handle simple variables
                if let Some(value) = get_nested_value(context, expression) {
                    match value {
                        Value::String(s) => s.clone(),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        _ => value.to_string().trim_matches('"').to_string(),
                    }
                } else {
                    String::new()
                }
            };
            
            result = result.replace(full_match, &replacement);
        }
        
        Ok(result)
    }
}
