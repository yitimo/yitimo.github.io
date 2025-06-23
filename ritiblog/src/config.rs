use serde::{Deserialize, Serialize};
use std::path::Path;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteConfig {
    pub title: String,
    pub email: String,
    pub description: String,
    pub baseurl: String,
    pub url: String,
    pub github_username: String,
    pub dist: String,
}

impl SiteConfig {
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: SiteConfig = serde_json::from_str(&content)?;
        Ok(config)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostMetadata {
    pub layout: Option<String>,
    pub title: String,
    pub date: chrono::DateTime<chrono::Utc>,
    #[serde(rename = "updateDate")]
    pub update_date: Option<chrono::DateTime<chrono::Utc>>,
    pub author: Option<String>,
    #[serde(deserialize_with = "deserialize_categories")]
    pub categories: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub keywords: Option<Vec<String>>,
    pub description: Option<String>,
}

fn deserialize_categories<'de, D>(deserializer: D) -> Result<Option<Vec<String>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Deserialize;
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrArray {
        String(String),
        Array(Vec<String>),
    }

    let result = Option::<StringOrArray>::deserialize(deserializer)?;
    Ok(result.map(|v| match v {
        StringOrArray::String(s) => vec![s],
        StringOrArray::Array(a) => a,
    }))
}

#[derive(Debug, Clone)]
pub struct Post {
    pub metadata: PostMetadata,
    pub content: String,
    pub url: String,
}
