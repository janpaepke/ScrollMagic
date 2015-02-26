#!/usr/bin/env node
// gulp access to jsdoc cli

"use strict";

var 

	fs = require("fs"),
	exec =				require('child_process').exec,
	gutil = require('gulp-util'),
	through = require('through2'),
	logger = require('./logger');

// const
// these are the possible options for the gulp plugin and how they convert to command line params
var 
	PARAMS_MAP = {
		conf: "-c",
		template: "-t",
		destination: "-d",
		readme: "-R",
		package: "-P",
	};

// get path of node module (undefined, if not found)
var modulePath = function(moduleName) {
    var path; // return value, boolean
    var dirSeparator = require("path").sep;

    // scan each module.paths. If there exists
    // node_modules/moduleName then
    // return true. Otherwise return false.
    module.paths.forEach(function(nodeModulesPath)  {
    		var thisPath = nodeModulesPath + dirSeparator + moduleName;
        if(fs.existsSync(thisPath) === true) {
            path = thisPath;
            return false; // break forEach
        }
    });

    return path;
};

// wrap path in quotes to support spaces
var wrap = function (path) {
	return '"' + path + '"';
};

var
	jsdocCli = modulePath("jsdoc"),
	CLI = ["node", wrap(jsdocCli + "/jsdoc")];

if (!jsdocCli) {
	throw new gutil.PluginError('jsdoc-generator', 'jsdoc module not installed');
}

module.exports = function (options) {
	var
		files = [],
		params = [];
	// translate options to params
	for (var option in PARAMS_MAP) {
		if (options[option]) {
			params.push(PARAMS_MAP[option] + " " + options[option]);
		}
	}
	// add files to processing array
	var processFile = function (file, enc, cb) {
		if (file.isStream()) {
			cb(new gutil.PluginError('jsdoc-generator', 'Streaming not supported'));
			return;
		}
		files.push(wrap(file.path));
		cb(null, file);
	};
	// run cli
	var endStream = function (cb) {
		var cmd = CLI.concat(files, params).join(" ");
		// console.log(cmd);
		exec(cmd, function (error, stdout, stderr) {
				if (stdout) {
		  		logger.warn("There were problems generating the Docs:\n" + stdout);
				}
		    // logger.info('stderr: ' + stderr);
		    if (error) {
		      cb(error);
		    } else {
		    	cb();
		    }
			}
		);
	};
	return through.obj(processFile, endStream);
};