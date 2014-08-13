#!/usr/bin/env node

/*
 build file for ScrollMagic
 usage: node build

 options:
 	Update Version number
 		-v=VERSION	| alias: -version			| example: node build -v=1.0.4
 	Define output directory
 		-o=DIR			| alias: -out=DIR			| example: node build -o=tmp
 	Update Docs
 		-d				| alias: -docs					| example: node build -d
 	output docs to custom folder:
 		-d=DIR		| alias: -docs=DIR 			| example: node build -d=docs

*/

/* ########################################## */
/* ########### load requirements ############ */
/* ########################################## */

"use strict";

// vars
var pkg = require('./package.json');

// internals
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

// components
var semver = require('semver');
var hint = require("jshint").JSHINT;
var uglify = require('uglify-js');
var chalk = require('chalk');
var detectIndent = require('detect-indent');


/* ########################################## */
/* ############ utility methods ############# */
/* ########################################## */

var abspath = function (relpath) {
	return path.join(__dirname, relpath);
};

var replaceAll = function (string, find, replace) {
	// escape regex
	find = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	// return
  return string.replace(new RegExp(find, 'g'), replace);
};

// log util
var log = {
	write: function (logList) {
		var now = new Date(),
			time = ("0"+now.getHours()).slice(-2) + ":" + ("0"+now.getMinutes()).slice(-2) + ":" + ("0"+now.getSeconds()).slice(-2) + ":" + ("00"+now.getMilliseconds()).slice(-3),
			func = Function.prototype.bind.call(console.log, console);
		logList.unshift(chalk.grey(time));
		func.apply(console, logList);
	},
	exit : function () {
		this.write(Array.prototype.concat.apply([chalk.red("ERROR:")], arguments));
		process.exit(1);
	},
	warn : function () {
		this.write(Array.prototype.concat.apply([chalk.yellow("WARNING:")], arguments));
	},
	info : function () {
		this.write(Array.prototype.concat.apply([chalk.blue("INFO:")], arguments));
	},
};


/* ########################################## */
/* ######## preparation of settings ######### */
/* ########################################## */

// constants
var DIR = {// foldernames
	source: abspath("src"),
	defaultOutput: "../js",
	defaultDocsOutput: "../docs"
};
var OUTPUT = {
	main: {
		filename: "jquery.scrollmagic.js",
		components: [
			"header.regular.js",
			"core.ScrollMagic.js"
		],
		inserts: [
			"class.ScrollMagic.js",
			"class.ScrollScene.js",
			"utils.js"
		],
		minified: { // also create a minified version
			filename: "jquery.scrollmagic.min.js",
			preamble: "header.min.js"
		}
	},
	debug: {
		filename: "jquery.scrollmagic.debug.js",
		components: [
			"header.regular.js",
			"class.ScrollScene.extend.debug.js"
		]
	}
};

// default options
var options = {
	version: pkg.version,
	updateDocs: false,
	folderOut: abspath(DIR.defaultOutput),
	folderDocsOut: abspath(DIR.defaultDocsOutput)
};


// get and sanitize process arguments
process.argv.splice(2).forEach(function(val) {
	var x=val.split("=");
	switch (x[0].substring(1)) {
		case "v":
		case "version":
			if (semver.valid(x[1])) {
				if (semver.gte(x[1], options.version)) {
					options.version = x[1];
				} else {
					log.exit("Supplied version is older than current (" + options.version + ")");
				}
			} else {
				log.exit("Invalid version number supplied");
			}
			break;
		case "o":
		case "out":
			if (fs.existsSync(x[1])) {
				options.folderOut = x[1];
			} else {
				log.exit("Supplied output path not found.");
			}
			break;
		case "d":
		case "docs":
			options.updateDocs = true;
			if (x.length > 1) {
				if (fs.existsSync(x[1])) {
					options.folderDocsOut = x[1];
				} else {
					log.exit("Supplied output path for docs not found.");
				}
			}
			break;
		default:
			log.warn("Ignoring unkown argument:", x[0]);
			break;
	}
});

var replaces = {
	"%VERSION%": options.version,
	"%YEAR%": new Date().getFullYear()
};

/* ########################################## */
/* ########## Main build function ########### */
/* ########################################## */

// build function
var build = function (release) {
	var
		content = "",
		inserts = {};
	
	// Concatenate files
	content = release.components.map(function (filePath) {
				return fs.readFileSync(DIR.source + "/" + filePath, 'utf-8');
			}).join('\n');

	// get inserts
	if (release.inserts) {
		release.inserts.forEach(function (insert) {
			var
				search = "// INSERT POINT: "+insert.substring(0, insert.lastIndexOf(".")),
				replace = fs.readFileSync(DIR.source + "/" + insert, 'utf-8');
			inserts[search] = replace;
		});
	}
	
	// do inserts
	for (var insert in inserts) {
		content = replaceAll(content, insert, inserts[insert]);
	}

	// do replaces
	for (var needle in replaces) {
		content = replaceAll(content, needle, replaces[needle]);
	}

	// save file
	fs.writeFileSync(options.folderOut + "/" + release.filename, content);

	// JSHint
	if ( !hint(content) ) {
		var lines = content.split('\n');
		hint.errors.forEach(function (err) {
			log.warn(chalk.red('JSHint Error [' + err.code + ']') + ' at ' + chalk.blue(err.line + ':' + err.character) + '\n',
							 '\tInfo: ' + err.reason + '\n',
							 '\tCode: '+ chalk.yellow(lines[err.line-1].replace(/\t/g, ' ')));
		});

		log.exit("JS Errors detected.");
	}

	// make minified version
	if (release.minified) {
		log.info("Minifying '" + release.filename + "' and saving to '" + release.minified.filename + "'");
		var 
			ugly = uglify.minify(content, {fromString: true}),
			preamble = fs.readFileSync(DIR.source + "/" + release.minified.preamble, 'utf-8');

		for (var search in replaces) {
			preamble = replaceAll(preamble, search, replaces[search]);
		}

		fs.writeFileSync(options.folderOut + "/" + release.minified.filename, preamble + "\n" + ugly.code);
	}

};


/* ########################################## */
/* ##### Actual build is starting here ###### */
/* ########################################## */

var startTime = new Date().getTime();
var finished = function () {
	var execTime = new Date().getTime() - startTime;
	log.info(chalk.green("All done!"), "(" + (execTime / 1000).toFixed(3) + " secs)");
};

log.info("Building ScrollMagic version", options.version, options.version === pkg.version ? "(current)" : "(new)");

// init building
for (var release in OUTPUT) {
	log.info("Creating", release + " file: '" + OUTPUT[release].filename + "'");
	build(OUTPUT[release]);
}

// update json file version numbers?
if (options.version !== pkg.version) {
	log.info("Updating version numbers to", options.version);
	var jsonFiles = ["package.json", "../bower.json", "../ScrollMagic.jquery.json"];
	jsonFiles.forEach(function (file) {
		var
			fullpath = abspath(file),
			content = fs.readFileSync(fullpath, 'utf-8'),
			indent = detectIndent(content) || "\t",
			json = JSON.parse(content);

		json.version = options.version;
		fs.writeFileSync(fullpath, JSON.stringify(json, null, indent));
	});
}

// do docs?
if (options.updateDocs) {
	log.info("Generating new docs");
	var
		bin = '"' + abspath('node_modules/.bin/jsdoc') + '"',
		docIn = '"' + abspath('../README.md') + '"',
		docOut = '-d "' + options.folderDocsOut + '"',
		conf = '-c "' + abspath('docs/jsdoc.conf.json') + '"',
		template = '-t "' + abspath('docs/template') + '"';
	for (var release in OUTPUT) {
		docIn += ' "' + options.folderOut + "/" + OUTPUT[release].filename + '"';
	}
	var cmd = [bin, docIn, conf, template, docOut].join(" ");
	var child = exec(cmd,
  function (error, stdout, stderr) {
	    // log.info('stdout: ' + stdout);
	    // log.info('stderr: ' + stderr);
	    if (error !== null) {
	      log.exit('exec error: ' + error);
	    }
	});
	child.on("close", finished);
} else {
	finished();
}

