use anyhow::Result;

pub fn apply_filter(input: &str, filter: &str) -> Result<String> {
    // Split only on the first colon to preserve colons in format strings
    let colon_pos = filter.find(':');
    let (filter_name, filter_args) = if let Some(pos) = colon_pos {
        let filter_name = filter[..pos].trim();
        let filter_args = Some(filter[pos + 1..].trim());
        (filter_name, filter_args)
    } else {
        (filter.trim(), None)
    };
    
    match filter_name {
        "date" => apply_date_filter(input, filter_args),
        "minus" => apply_minus_filter(input, filter_args),
        "plus" => apply_plus_filter(input, filter_args),
        "size" => Ok(input.len().to_string()),
        "upcase" => Ok(input.to_uppercase()),
        "downcase" => Ok(input.to_lowercase()),
        "strip" => Ok(input.trim().to_string()),
        "escape" => Ok(html_escape::encode_text(input).to_string()),
        "truncate" => apply_truncate_filter(input, filter_args),
        _ => Ok(input.to_string()), // Unknown filter, return input unchanged
    }
}

fn apply_date_filter(input: &str, format_str: Option<&str>) -> Result<String> {
    if let Some(format_str) = format_str {
        let format_str = format_str.trim_matches('"').trim_matches('\'');
        
        if input == "now" {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            let datetime = chrono::DateTime::from_timestamp(now as i64, 0)
                .unwrap_or_default();
            let result = datetime.format(format_str).to_string();
            return Ok(result);
        } else {
            // Try to parse the input as a date
            if let Ok(timestamp) = input.parse::<i64>() {
                let datetime = chrono::DateTime::from_timestamp(timestamp, 0)
                    .unwrap_or_default();
                let result = datetime.format(format_str).to_string();
                return Ok(result);
            } else {
                // Try parsing as various date formats
                // First try with timezone-aware parsing
                let date_formats_with_tz = [
                    "%Y-%m-%dT%H:%M:%S%z",
                    "%Y-%m-%dT%H:%M:%S%:z", 
                    "%Y-%m-%d %H:%M:%S %z",
                ];
                
                for format in &date_formats_with_tz {
                    if let Ok(datetime) = chrono::DateTime::parse_from_str(input, format) {
                        let result = datetime.format(format_str).to_string();
                        return Ok(result);
                    }
                }
                
                // Then try naive datetime parsing
                let date_formats = [
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d",
                ];
                
                for format in &date_formats {
                    if let Ok(datetime) = chrono::NaiveDateTime::parse_from_str(input, format) {
                        let result = datetime.format(format_str).to_string();
                        return Ok(result);
                    }
                }
            }
        }
    }
    Ok(input.to_string())
}

fn apply_minus_filter(input: &str, amount_str: Option<&str>) -> Result<String> {
    if let Some(amount_str) = amount_str {
        if let (Ok(input_num), Ok(minus_num)) = (input.parse::<i64>(), amount_str.parse::<i64>()) {
            return Ok((input_num - minus_num).to_string());
        }
    }
    Ok(input.to_string())
}

fn apply_plus_filter(input: &str, amount_str: Option<&str>) -> Result<String> {
    if let Some(amount_str) = amount_str {
        if let (Ok(input_num), Ok(plus_num)) = (input.parse::<i64>(), amount_str.parse::<i64>()) {
            return Ok((input_num + plus_num).to_string());
        }
    }
    Ok(input.to_string())
}

fn apply_truncate_filter(input: &str, length_str: Option<&str>) -> Result<String> {
    if let Some(length_str) = length_str {
        if let Ok(length) = length_str.parse::<usize>() {
            if input.len() > length {
                return Ok(format!("{}...", &input[..length.saturating_sub(3)]));
            }
        }
    }
    Ok(input.to_string())
}
