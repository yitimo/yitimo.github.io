use serde_json::Value;
use anyhow::Result;

/// Get nested value from JSON context using dot notation
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

/// Evaluate a simple expression (variable or string literal)
pub fn evaluate_expression(expr: &str, context: &Value) -> Result<String> {
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
