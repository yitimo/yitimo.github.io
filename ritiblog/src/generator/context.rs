use anyhow::Result;
use serde_json::{Value, json};

use crate::config::{SiteConfig, Post};

pub struct ContextBuilder;

impl ContextBuilder {
    pub fn build_template_context(
        config: &SiteConfig,
        posts: &[Post],
        content: Option<&str>,
        post: Option<&Post>,
    ) -> Result<Value> {
        let mut context = json!({
            "site": {
                "title": config.title,
                "email": config.email,
                "description": config.description,
                "baseurl": config.baseurl,
                "url": config.url,
                "github_username": config.github_username,
                "posts": posts.iter().map(|p| json!({
                    "title": p.metadata.title,
                    "date": p.metadata.date.to_rfc3339(),
                    "url": p.url,
                    "author": p.metadata.author,
                    "categories": p.metadata.categories.as_ref().map(|cats| cats.join(" ")).unwrap_or_default(),
                    "tags": p.metadata.tags.as_ref().unwrap_or(&vec![]),
                    "description": p.metadata.description,
                })).collect::<Vec<_>>()
            }
        });

        if let Some(content) = content {
            if let Value::Object(ref mut map) = context {
                map.insert("content".to_string(), Value::String(content.to_string()));
            }
        }

        if let Some(post) = post {
            if let Value::Object(ref mut map) = context {
                map.insert("page".to_string(), json!({
                    "title": post.metadata.title,
                    "date": post.metadata.date.to_rfc3339(),
                    "updateDate": post.metadata.update_date.map(|d| d.to_rfc3339()),
                    "author": post.metadata.author,
                    "categories": post.metadata.categories.as_ref().map(|cats| cats.join(" ")).unwrap_or_default(),
                    "tags": post.metadata.tags.as_ref().unwrap_or(&vec![]),
                    "description": post.metadata.description,
                }));
            }
        }

        Ok(context)
    }

    pub fn build_template_context_with_navigation(
        config: &SiteConfig,
        posts: &[Post],
        content: Option<&str>,
        post: Option<&Post>,
    ) -> Result<Value> {
        let mut context = Self::build_template_context(config, posts, content, post)?;
        
        if let Some(current_post) = post {
            if let Value::Object(ref mut map) = context {
                if let Some(page_obj) = map.get_mut("page") {
                    if let Value::Object(ref mut page_map) = page_obj {
                        // Find current post index
                        let current_index = posts.iter().position(|p| p.url == current_post.url);
                        
                        if let Some(index) = current_index {
                            // Add previous post (newer post, lower index)
                            if index > 0 {
                                let prev_post = &posts[index - 1];
                                page_map.insert("previous".to_string(), json!({
                                    "title": prev_post.metadata.title,
                                    "url": prev_post.url,
                                    "date": prev_post.metadata.date.to_rfc3339(),
                                }));
                            }
                            
                            // Add next post (older post, higher index)
                            if index < posts.len() - 1 {
                                let next_post = &posts[index + 1];
                                page_map.insert("next".to_string(), json!({
                                    "title": next_post.metadata.title,
                                    "url": next_post.url,
                                    "date": next_post.metadata.date.to_rfc3339(),
                                }));
                            }
                        }
                    }
                }
            }
        }
        
        Ok(context)
    }
}
