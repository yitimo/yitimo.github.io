use std::collections::HashMap;
use anyhow::{Result, anyhow};
use regex::Regex;
use serde_json::Value;
use crate::template::filters::apply_filter;
use crate::template::regex_cache::RegexCache;

pub struct Processors<'a> {
    pub includes: &'a HashMap<String, String>,
    pub regex_cache: &'a RegexCache,
}

impl<'a> Processors<'a> {
    pub fn new(includes: &'a HashMap<String, String>, regex_cache: &'a RegexCache) -> Self {
        Self {
            includes,
            regex_cache,
        }
    }

    pub fn process_includes(&self, template: &str) -> Result<String> {
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

    pub fn process_style_tags(&self, template: &str) -> Result<String> {
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

    pub fn process_captures_with_context(&self, template: &str, context: &Value) -> Result<(String, HashMap<String, String>)> {
        let mut result = template.to_string();
        let mut capture_vars = HashMap::new();
        
        // First pass: collect all captures
        for cap in self.regex_cache.capture_regex.captures_iter(template) {
            let full_match = &cap[0];
            let var_name = &cap[1];
            let content = &cap[2];
            
            // Process the content first (may contain variables)
            let processed_content = self.process_variables_with_filters(content, context)?;
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

    pub fn process_variables_with_filters(&self, template: &str, context: &Value) -> Result<String> {
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

    pub fn process_conditionals(&self, template: &str, context: &Value) -> Result<String> {
        // Handle if-else first (more specific pattern)
        let if_else_re = Regex::new(r"(?s)\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*else\s*%\}(.*?)\{%\s*endif\s*%\}")?;
        let mut result = template.to_string();
        
        // Process if-else statements
        while let Some(cap) = if_else_re.captures(&result) {
            let full_match = &cap[0];
            let condition = &cap[1];
            let if_content = &cap[2];
            let else_content = &cap[3];
            
            if evaluate_condition(condition, context)? {
                result = result.replace(full_match, if_content);
            } else {
                result = result.replace(full_match, else_content);
            }
        }
        
        // Then handle simple if statements  
        let if_re = Regex::new(r"(?s)\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*endif\s*%\}")?;
        while let Some(cap) = if_re.captures(&result) {
            let full_match = &cap[0];
            let condition = &cap[1];
            let content = &cap[2];
            
            if evaluate_condition(condition, context)? {
                result = result.replace(full_match, content);
            } else {
                result = result.replace(full_match, "");
            }
        }
        
        Ok(result)
    }

    pub fn process_loops(&self, template: &str, context: &Value, render_fn: impl Fn(&str, &Value) -> Result<String>) -> Result<String> {
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
                if let Some((content, full_match_end)) = find_matching_endfor(&temp_result, full_match_start)? {
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
}

fn find_matching_endfor<'a>(template: &'a str, start_pos: usize) -> Result<Option<(&'a str, usize)>> {
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

pub fn get_nested_value<'a>(context: &'a Value, path: &str) -> Option<&'a Value> {
    let parts: Vec<&str> = path.split('.').collect();
    let mut current = context;
    
    for part in parts {
        match current {
            Value::Object(obj) => {
                current = obj.get(part)?;
            }
            _ => return None,
        }
    }
    
    Some(current)
}

pub fn evaluate_condition(condition: &str, context: &Value) -> Result<bool> {
    let condition = condition.trim();
    
    // Handle simple variable existence check (only if no operators are present)
    if !condition.contains(" ") && !condition.contains(">=") && !condition.contains("<=") && 
       !condition.contains("==") && !condition.contains("!=") && !condition.contains(">") && 
       !condition.contains("<") && !condition.contains("contains") {
        if let Some(value) = get_nested_value(context, condition) {
            let result = match value {
                Value::Bool(b) => *b,
                Value::Null => false,
                Value::String(s) => !s.is_empty(),
                Value::Array(arr) => !arr.is_empty(),
                Value::Object(obj) => !obj.is_empty(),
                Value::Number(n) => n.as_f64().unwrap_or(0.0) != 0.0,
            };
            return Ok(result);
        }
        return Ok(false);
    }
    
    // Handle comparison operations (check for >= first since it contains >)
    if condition.contains(">=") {
        let parts: Vec<&str> = condition.split(">=").collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0].trim(), context)?;
            let right = evaluate_expression(parts[1].trim(), context)?;
            if let (Ok(left_num), Ok(right_num)) = (left.parse::<f64>(), right.parse::<f64>()) {
                return Ok(left_num >= right_num);
            }
            return Ok(left >= right);
        }
    }
    
    if condition.contains("==") {
        let parts: Vec<&str> = condition.split("==").collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0].trim(), context)?;
            let right = evaluate_expression(parts[1].trim(), context)?;
            return Ok(left == right);
        }
    }
    
    if condition.contains("!=") {
        let parts: Vec<&str> = condition.split("!=").collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0].trim(), context)?;
            let right = evaluate_expression(parts[1].trim(), context)?;
            return Ok(left != right);
        }
    }
    
    if condition.contains("<=") {
        let parts: Vec<&str> = condition.split("<=").map(|s| s.trim()).collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0], context)?;
            let right = evaluate_expression(parts[1], context)?;
            if let (Ok(left_num), Ok(right_num)) = (left.parse::<f64>(), right.parse::<f64>()) {
                return Ok(left_num <= right_num);
            }
            return Ok(left <= right);
        }
    }
    
    if condition.contains(">") && !condition.contains(">=") {
        let parts: Vec<&str> = condition.split(">").map(|s| s.trim()).collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0], context)?;
            let right = evaluate_expression(parts[1], context)?;
            if let (Ok(left_num), Ok(right_num)) = (left.parse::<f64>(), right.parse::<f64>()) {
                return Ok(left_num > right_num);
            }
            return Ok(left > right);
        }
    }
    
    if condition.contains("<") && !condition.contains("<=") {
        let parts: Vec<&str> = condition.split("<").map(|s| s.trim()).collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0], context)?;
            let right = evaluate_expression(parts[1], context)?;
            if let (Ok(left_num), Ok(right_num)) = (left.parse::<f64>(), right.parse::<f64>()) {
                return Ok(left_num < right_num);
            }
            return Ok(left < right);
        }
    }
    
    if condition.contains("contains") {
        let parts: Vec<&str> = condition.split("contains").map(|s| s.trim()).collect();
        if parts.len() == 2 {
            let left = evaluate_expression(parts[0], context)?;
            let right = evaluate_expression(parts[1], context)?;
            return Ok(left.contains(&right));
        }
    }
    
    // Default to false for unrecognized conditions
    Ok(false)
}

fn evaluate_expression(expr: &str, context: &Value) -> Result<String> {
    let expr = expr.trim();
    
    // Handle string literals
    if (expr.starts_with('"') && expr.ends_with('"')) || (expr.starts_with('\'') && expr.ends_with('\'')) {
        return Ok(expr[1..expr.len()-1].to_string());
    }
    
    // Handle variables
    if let Some(value) = get_nested_value(context, expr) {
        match value {
            Value::String(s) => Ok(s.clone()),
            Value::Number(n) => Ok(n.to_string()),
            Value::Bool(b) => Ok(b.to_string()),
            _ => Ok(value.to_string().trim_matches('"').to_string()),
        }
    } else {
        Ok(String::new())
    }
}
