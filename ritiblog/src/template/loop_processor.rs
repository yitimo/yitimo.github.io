use anyhow::{Result, anyhow};
use regex::Regex;
use serde_json::Value;
use crate::template::utils::get_nested_value;

/// Processor for handling loop statements
pub struct LoopProcessor;

impl LoopProcessor {
    pub fn new() -> Self {
        Self
    }

    /// Process loop statements in template
    pub fn process(&self, template: &str, context: &Value, render_fn: impl Fn(&str, &Value) -> Result<String>) -> Result<String> {
        let for_re = Regex::new(r"\{%\s*for\s+(\w+)\s+in\s+([^%]+)\s*%\}")?;
        let mut result = template.to_string();
        let mut iteration = 0;
        const MAX_ITERATIONS: usize = 100; // Prevent infinite loops
        
        while for_re.is_match(&result) && iteration < MAX_ITERATIONS {
            let temp_result = result.clone();
            
            if let Some(cap) = for_re.captures(&temp_result) {
                let full_match_start = cap.get(0).unwrap().start();
                let var_name = &cap[1];
                let collection_path = &cap[2].trim();
                
                // Find the matching endfor
                if let Some((content, full_match_end)) = self.find_matching_endfor(&temp_result, full_match_start)? {
                    let full_match = &temp_result[full_match_start..full_match_end];
                    
                    // Get the collection from context
                    if let Some(collection) = get_nested_value(context, collection_path) {
                        let mut loop_output = String::new();
                        
                        if let Value::Array(items) = collection {
                            for (index, item) in items.iter().enumerate() {
                                // Create loop context
                                let mut loop_context = context.clone();
                                if let Value::Object(ref mut obj) = loop_context {
                                    obj.insert(var_name.to_string(), item.clone());
                                    
                                    // Add forloop variables
                                    let mut forloop = serde_json::Map::new();
                                    forloop.insert("index".to_string(), Value::Number(serde_json::Number::from(index + 1)));
                                    forloop.insert("index0".to_string(), Value::Number(serde_json::Number::from(index)));
                                    forloop.insert("first".to_string(), Value::Bool(index == 0));
                                    forloop.insert("last".to_string(), Value::Bool(index == items.len() - 1));
                                    forloop.insert("length".to_string(), Value::Number(serde_json::Number::from(items.len())));
                                    obj.insert("forloop".to_string(), Value::Object(forloop));
                                }
                                
                                // Process the loop content with the new context
                                let processed_content = render_fn(content, &loop_context)?;
                                loop_output.push_str(&processed_content);
                            }
                        }
                        
                        result = result.replace(full_match, &loop_output);
                    } else {
                        result = result.replace(full_match, "");
                    }
                }
            }
            
            iteration += 1;
        }
        
        Ok(result)
    }

    /// Find the matching endfor tag for a for loop
    fn find_matching_endfor<'a>(&self, template: &'a str, start_pos: usize) -> Result<Option<(&'a str, usize)>> {
        let for_re = Regex::new(r"\{%\s*for\s+")?;
        let endfor_re = Regex::new(r"\{%\s*endfor\s*%\}")?;
        
        let text = &template[start_pos..];
        let mut depth = 0;
        let mut pos = 0;
        
        // Skip the opening for tag
        if let Some(mat) = for_re.find(text) {
            pos = mat.end();
            depth = 1;
        }
        
        while depth > 0 {
            let remaining = &text[pos..];
            
            let next_for = for_re.find(remaining);
            let next_endfor = endfor_re.find(remaining);
            
            match (next_for, next_endfor) {
                (Some(for_match), Some(endfor_match)) => {
                    if for_match.start() < endfor_match.start() {
                        // Found nested for
                        depth += 1;
                        pos += for_match.end();
                    } else {
                        // Found endfor
                        depth -= 1;
                        if depth == 0 {
                            let content_start = template[start_pos..].find("%}").unwrap() + 2;
                            let content_end = pos + endfor_match.start();
                            let content = &text[content_start..content_end];
                            let full_end = start_pos + pos + endfor_match.end();
                            return Ok(Some((content, full_end)));
                        }
                        pos += endfor_match.end();
                    }
                }
                (None, Some(endfor_match)) => {
                    // Only endfor found
                    depth -= 1;
                    if depth == 0 {
                        let content_start = template[start_pos..].find("%}").unwrap() + 2;
                        let content_end = pos + endfor_match.start();
                        let content = &text[content_start..content_end];
                        let full_end = start_pos + pos + endfor_match.end();
                        return Ok(Some((content, full_end)));
                    }
                    pos += endfor_match.end();
                }
                (Some(_for_match), None) => {
                    // Only for found, but no matching endfor - error
                    return Err(anyhow!("Unmatched for loop"));
                }
                (None, None) => {
                    // Neither found - error
                    return Err(anyhow!("Unmatched for loop"));
                }
            }
        }
        
        Ok(None)
    }
}
