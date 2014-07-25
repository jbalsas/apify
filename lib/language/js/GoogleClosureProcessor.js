/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, module */

/**
 * A custom comment post-processor to add support for annotations style defined by the Google Closure Compiler for:
 *
 * - [Tags](https://developers.google.com/closure/compiler/docs/js-for-compiler#tags)
 * - [Types](https://developers.google.com/closure/compiler/docs/js-for-compiler#types)
 */
(function () {

    "use strict";

    var _           = require("underscore")._,
        marked      = require("marked");

    marked.setOptions(
        {
            renderer: new marked.Renderer(),
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false
        }
    );
    
    /**
     * A custom comment post-processor for Closure Compiler support
     * @param {Object} data Raw data of the module being processed
     * @constructor
     */
    var GoogleClosureProcessor = function (data) {
        this.rawData = data;
    };

    /**
     * Parses a type expression
     * @returns The parsed expression
     */
    GoogleClosureProcessor.prototype._parseTypeExpression = function (tag) {
        var PARAM_OBJECT_REGEXP         = new RegExp("^{(.*)}$"),
            PARAM_FUNCTION_REGEXP       = new RegExp("^function\\((.*)\\)$"),
            PARAM_NULLABLE_REGEXP       = new RegExp("^\\?(.*)$"),
            PARAM_NON_NULLABLE_REGEXP   = new RegExp("^!(.*)$"),
            PARAM_OPTIONAL_REGEXP       = new RegExp("^(.*)=$");

        var types = tag.types.join(', '),
            match;

        match = PARAM_NULLABLE_REGEXP.exec(types);
        if (match) {
            tag.modifiers.push('nullable');
            tag.types = match[1];
        }

        match = PARAM_NON_NULLABLE_REGEXP.exec(types);
        if (match) {
            tag.modifiers.push('non-nullable');
            tag.types = match[1];
        }

        match = PARAM_OPTIONAL_REGEXP.exec(types);
        if (match) {
            tag.modifiers.push('optional');
            tag.types = match[1];
        }

        return tag;
    };

    /**
     * Parses special comment tags defined by the Closure Compiler
     * @param {Object} comment Dox parsed data for a comment in the module
     * @return {Object} Augmented comment with Closure Compiler support
     */
    GoogleClosureProcessor.prototype.processComment = function (comment) {
        var instance    = this,
            data        = instance.rawData,
            examples    = [],
            params      = [],
            modifiers   = [],
            returns     = null,
            unsupported = [];
        
        if (comment.ctx) {
            
            comment.isPrivate = comment.isPrivate ||
                                comment.description.full.indexOf("@private") !== -1 ||
                                comment.ctx.name[0] === "_";

            comment.isConstructor = comment.isConstructor || comment.description.full.indexOf("@constructor") !== -1;
            
            comment.description.full = comment.description.full.replace(/@private\s*(<br\s*\/?>)?/, "");
            comment.description.full = comment.description.full.replace(/@constructor\s*(<br\s*\/?>)?/, "");
        
            comment.description.full = marked(comment.description.full);
            
            comment.tags = comment.tags.map(function (tag) {
                var returnTag = false;
                
                switch (tag.type) {
                    case "const":
                        modifiers.push("Constant");
                        
                        var type = tag.string.replace(/[{}]/g, "");
                        
                        if (type !== "") {
                            returnTag = {
                                key: "Type",
                                value: type
                            };
                        }
                        break;

                    case "constructor":
                        comment.isConstructor = true;
                        break;

                    case "deprecated":
                        comment.isDeprecated = true;
                        break;

                    case "enum": 
                        modifiers.push("Enumeration");
                        
                        var type = tag.string.replace(/[{}]/g, "");
                        
                        if (type !== "") {
                            returnTag = {
                                key: "Type",
                                value: type
                            };
                        }
                        break;
                    
                    case "example":
                        examples.push({
                            code: tag.string
                        });
                        
                        break;
                        
                    case "extends":
                        comment.extends = tag.string.replace(/[{}]/g, "");
                        break;

                    case "override":
                        modifiers.push("Overrides parent implementation");
                        break;
                        
                    case "param":
                        tag.modifiers = [];
                        params.push(instance._parseTypeExpression(tag));
                        break;

                    case "private":
                        comment.isPrivate = true;
                        break;

                    case "return":
                        returns = tag;
                        break;

                    case "see":
                        returnTag = {
                            key: "See",
                            value: "<a href='#'>" + tag.local + "</a>"
                        };
                        break;

                    case "type":
                        returnTag = {
                            key: "Type",
                            value: _.escape(tag.types.join(", "))
                        };
                        break;

                    default:
                        console.log("Unsupported @" + tag.type + " found with value " + tag.string);
                        unsupported.push({key: tag.type, value: tag.string });
                        break;
                }
        
                return returnTag;
            });
        
            comment.examples = examples;
            comment.modifiers = modifiers;
            comment.params  = params;
            comment.returns = returns;
            comment.unsupported = unsupported;
        
            if (comment.isPrivate) {
                comment.tags.push({key: 'Private'});
            }
            
        }
        
        return comment;
    };
    
    module.exports = GoogleClosureProcessor;
    
}());
