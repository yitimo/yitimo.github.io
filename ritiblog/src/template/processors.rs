use std::collections::HashMap;
use anyhow::Result;
use serde_json::Value;
use crate::template::regex_cache::RegexCache;
use crate::template::include_processor::IncludeProcessor;
use crate::template::style_processor::StyleProcessor;
use crate::template::variable_processor::VariableProcessor;
use crate::template::conditional_processor::ConditionalProcessor;
use crate::template::loop_processor::LoopProcessor;

/// Main processor coordinator that delegates to specialized processors
pub struct Processors<'a> {
    include_processor: IncludeProcessor<'a>,
    style_processor: StyleProcessor,
    variable_processor: VariableProcessor<'a>,
    conditional_processor: ConditionalProcessor,
    loop_processor: LoopProcessor,
}

impl<'a> Processors<'a> {
    pub fn new(includes: &'a HashMap<String, String>, regex_cache: &'a RegexCache) -> Self {
        Self {
            include_processor: IncludeProcessor::new(includes),
            style_processor: StyleProcessor::new(),
            variable_processor: VariableProcessor::new(regex_cache),
            conditional_processor: ConditionalProcessor::new(),
            loop_processor: LoopProcessor::new(),
        }
    }

    pub fn process_includes(&self, template: &str) -> Result<String> {
        self.include_processor.process(template)
    }

    pub fn process_style_tags(&self, template: &str) -> Result<String> {
        self.style_processor.process(template)
    }

    pub fn process_captures_with_context(&self, template: &str, context: &Value) -> Result<(String, HashMap<String, String>)> {
        self.variable_processor.process_captures(template, context)
    }

    pub fn process_variables_with_filters(&self, template: &str, context: &Value) -> Result<String> {
        self.variable_processor.process_variables(template, context)
    }

    pub fn process_conditionals(&self, template: &str, context: &Value) -> Result<String> {
        self.conditional_processor.process(template, context)
    }

    pub fn process_loops(&self, template: &str, context: &Value, render_fn: impl Fn(&str, &Value) -> Result<String>) -> Result<String> {
        self.loop_processor.process(template, context, render_fn)
    }
}


