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
            PARAM_OPTIONAL_REGEXP   = new RegExp("^(.*)=$");

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
            params      = [],
            returns     = null;
        
        if (comment.ctx) {
            
            comment.isPrivate = comment.isPrivate ||
                                comment.description.full.indexOf("@private") !== -1 ||
                                comment.ctx.name[0] === "_";

            comment.isConstructor = comment.isConstructor || comment.description.full.indexOf("@constructor") !== -1;
            
            comment.description.full = comment.description.full.replace(/@private\s*(<br\s*\/?>)?/, "");
            comment.description.full = comment.description.full.replace(/@constructor\s*(<br\s*\/?>)?/, "");
        
            comment.tags = comment.tags.map(function (tag) {
                if (tag.type === 'type') {
                    return {
                        key: "Type",
                        value: tag.types.join(", ")
                    };
                } else if (tag.type === "see") {
                    return {
                        key: 'See',
                        value: "<a href='#'>" + tag.local + "</a>"
                    };
                } else if (tag.type === "param") {
                    tag.modifiers = [];
                    tag = instance._parseTypeExpression(tag);
                    params.push(tag);
                    return false;
                } else if (tag.type === "return") {
                    returns = tag;
                    return false;
                } else if (tag.type === "private") {
                    comment.isPrivate = true;
                    return false;
                } else if (tag.type === "constructor") {
                    comment.isConstructor = true;
                    return false;
                }
        
                return false;
            });
        
            comment.params  = params;
            comment.returns = returns;
        
            if (comment.isPrivate) {
                comment.tags.push({key: 'Private'});
            }
            
        }
        
        return comment;
    };
    
    module.exports = GoogleClosureProcessor;
    
}());