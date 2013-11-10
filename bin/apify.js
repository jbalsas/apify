#!/usr/bin/env node
    
"use strict";

var defaults    = require("../lib/defaults.json"),
    documenter  = require("../lib/Documenter"),
    fs          = require("fs"),
    merge       = require("fmerge"),
    path        = require("path"),
    program     = require("commander"),
    config;

function parseExcludes(list) {
    return list.split(",");
}

// Resolve absolute path for default templates and assets
var templates = Object.keys(defaults.templates);
templates.forEach(function (templateName) {
    defaults.templates[templateName] = __dirname + defaults.templates[templateName];
});

defaults.assets = __dirname + defaults.assets;

program
    .version("0.0.1")
    .option("-s, --source <s> [value]", "Source folder")
    .option("-o, --output <s> [value]", "Output folder")
    .option("-t, --title <s> [value]", "Title")
    .option("-c, --config <s> [value]", "Config file")
    .option("--excludes <excludes>", "Excludes", parseExcludes)
    .parse(process.argv);

if (program.config) {
    config = JSON.parse(fs.readFileSync(program.config, "UTF-8"));
}
    
documenter.init(merge(defaults, program, config));