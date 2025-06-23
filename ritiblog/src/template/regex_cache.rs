use anyhow::Result;
use regex::Regex;

#[derive(Debug)]
#[allow(dead_code)]
pub struct RegexCache {
    pub variable_regex: Regex,
    pub if_regex: Regex,
    pub for_regex: Regex,
    pub capture_regex: Regex,
    pub include_regex: Regex,
    pub style_regex: Regex,
}

impl RegexCache {
    pub fn new() -> Result<Self> {
        Ok(Self {
            variable_regex: Regex::new(r"\{\{\s*([^}]+)\s*\}\}")?,
            if_regex: Regex::new(r"(?s)\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*endif\s*%\}")?,
            for_regex: Regex::new(r"(?s)\{%\s*for\s+(\w+)\s+in\s+([^%]+)\s*%\}(.*?)\{%\s*endfor\s*%\}")?,
            capture_regex: Regex::new(r"(?s)\{%\s*capture\s+(\w+)\s*%\}(.*?)\{%\s*endcapture\s*%\}")?,
            include_regex: Regex::new(r"\{%\s*include\s+([^%]+)\s*%\}")?,
            style_regex: Regex::new(r"\{%\s*style\s+([^%]+)\s*%\}")?,
        })
    }
}
