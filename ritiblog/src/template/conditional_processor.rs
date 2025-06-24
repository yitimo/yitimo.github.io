use anyhow::Result;
use regex::Regex;
use serde_json::Value;
use crate::template::utils::{get_nested_value, evaluate_expression};

/// Processor for handling conditional statements
pub struct ConditionalProcessor;

impl ConditionalProcessor {
    pub fn new() -> Self {
        Self
    }

    /// Process conditional statements in template
    pub fn process(&self, template: &str, context: &Value) -> Result<String> {
        // Handle if-else first (more specific pattern)
        let if_else_re = Regex::new(r"(?s)\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*else\s*%\}(.*?)\{%\s*endif\s*%\}")?;
        let mut result = template.to_string();
        
        // Process if-else statements
        while let Some(cap) = if_else_re.captures(&result) {
            let full_match = &cap[0];
            let condition = &cap[1];
            let if_content = &cap[2];
            let else_content = &cap[3];
            
            if self.evaluate_condition(condition, context)? {
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
            
            if self.evaluate_condition(condition, context)? {
                result = result.replace(full_match, content);
            } else {
                result = result.replace(full_match, "");
            }
        }
        
        Ok(result)
    }

    /// Evaluate a condition expression
    fn evaluate_condition(&self, condition: &str, context: &Value) -> Result<bool> {
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
}
