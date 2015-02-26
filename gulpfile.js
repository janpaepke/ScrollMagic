#!/usr/bin/env node

"use strict";

/* ########################################## */
/* ########### load requirements ############ */
/* ########################################## */

var
// node modules
	fs = 					require('fs'),
	del = 				require('del'),
	semver =			require('semver'),
	exec =				require('child_process').exec,
// gulp & plugins
	gulp =				require('gulp'),
	open =				require("gulp-open"),
	plumber =			require('gulp-plumber'),
	jshint =			require('gulp-jshint'),
	include =			require('gulp-file-include'),
	rename =			require('gulp-rename'),
	replace =			require('gulp-replace-task'),
	concat =			require('gulp-concat-util'),
	uglify =			require('gulp-uglify'),
	gulpFilter =	require('gulp-filter'),
	gutil = 			require('gulp-util'),
	jeditor = 		require('gulp-json-editor'),
	beautify =		require('gulp-beautify'),
	karma =				require('gulp-karma'),
// custom
	log = 				require('./dev/build/logger'),
	size = 				require('./dev/build/filesize'),
	jsdoc = 			require('./dev/build/jsdoc-generator'),
// json
	pluginInfo =	require('./dev/src/plugins.json'),
	config = require('./dev/build/config.json'); // config

// command line options (use gulp -h to for details)
var args = require('yargs')
						.usage('Build new ScrollMagic dist files from source.')
						.describe('o', 'Specify output folder for dist files ')
							.alias("o", "out")
							.default('o', './' + config.dirs.defaultOutput)
						.describe('d', 'Generate new docs, optionally supplying output folder [default folder: ./"' + config.dirs.defaultDocsOutput + '"]')
							.alias("d", "doc")
							.default('d', false)
						.describe('ver', 'Set the version number for output')
							.default('ver', config.version)
						.help('h')
							.alias("h", "?")
						// examples
						.example("$0 -o=mybuild", 		'build and output to folder "mybuild"')
						.example("$0 -d", 						'build and generate new docs')
						.example("$0 --doc=newdocs", 	'build and generate new docs into folder "newdocs"')
						.example("$0 --ver=2.1.0", 		'build and update version number to 2.1.0')
						.argv;

/* ########################################## */
/* ################ settings ################ */
/* ########################################## */

var options = {
	version: args.ver,
	dodocs: !!args.doc || args._[0] === 'generate:docs',
	folderOut: args.out,
	folderDocsOut: args.doc.split ? args.doc : './' + config.dirs.defaultDocsOutput,
	date: config.version === args.ver ? new Date(config.lastupdate) : new Date(),
	banner: {
		uncompressed: fs.readFileSync(config.banner.uncompressed, 'utf-8') + "\n",
		minified: fs.readFileSync(config.banner.minified, 'utf-8') + "\n"
	},
	subfolder: {
		uncompressed: "uncompressed",
		minified: "minified"
	}
};
options.replaceVars = {
	variables: {
		"%VERSION%": options.version,
		"%YEAR%": options.date.getFullYear(),
		"%MONTH%": ("0"+(options.date.getMonth() + 1)).slice(-2),
		"%DAY%": ("0"+options.date.getDate()).slice(-2),
		"%DESCRIPTION%": config.info.description,
	},
	patterns: [
		{
			// remove unecessary comment close/open
			match: /\s?\*\/\s*\/\*!?\s?\n( \*)?/gm,
			replacement: '$1\n$1'
		}
	],
	usePrefix: false
};

/* ########################################## */
/* ########### validate parameters ########## */
/* ########################################## */

// version
if (!semver.valid(options.version)) {
	log.exit("Invalid version number supplied");
} else if (semver.lt(options.version, config.version)) {
	log.exit("Supplied version (" + options.version + ") is older than current (" + config.version + "), defined in dev/build/config.json");
}
// output
if (!fs.existsSync(options.folderOut)) {
	log.exit("Supplied output path not found.");
}
// docs output
if (options.dodocs && !fs.existsSync(options.folderDocsOut)) {
	log.exit("Supplied output path for docs not found.");
}


/* ########################################## */
/* ############### MAIN TASKS ############### */
/* ########################################## */

// default build all
var defaultDeps = ['sync:json-files', 'sync:readme', 'build:uncompressed', 'build:minified'];
if (options.dodocs) {
	defaultDeps.push('generate:docs');
}
gulp.task('default', defaultDeps, function () {
	log.info("Generated new build to", options.folderOut);
	// gulp.src(options.folderOut + "/*.js")
	gulp.src(options.folderOut + "/uncompressed/*.js")
			.pipe(size({showFiles: true, gzip: true, title: "Main Lib uncompressed"}));
	gulp.src(options.folderOut + "/uncompressed/plugins/*.js")
			.pipe(size({showFiles: false, gzip: true, title: "Plugins uncompressed"}));
	gulp.src(options.folderOut + "/minified/*.js")
			.pipe(size({showFiles: true, gzip: true, title: "Main Lib minified"}));
	gulp.src(options.folderOut + "/minified/plugins/*.js")
			.pipe(size({showFiles: false, gzip: true, title: "Plugins minified"}));
	if (options.version != config.version) {
		log.info("Updated to version", options.version);
	}
	if (options.dodocs) {
		log.info("Generated new docs to", options.folderDocsOut);
	}
});

gulp.task('open-demo', function() { // just open the index file
  gulp.src("./index.html")
  		.pipe(open("<%file.path%>"));
});

gulp.task('clean:uncompressed', ['lint:source'], function(callback) {
	del(options.folderOut + "/"+ options.subfolder.uncompressed +"/*", callback);
});
gulp.task('clean:minified', ['lint:source'], function(callback) {
	del(options.folderOut + "/"+ options.subfolder.minified +"/*", callback);
});
gulp.task('clean:docs', ['lint:source'], function(callback) {
	if (options.dodocs) {
		del(options.folderDocsOut + "/*", callback);
	} else {
		callback();
	}
});

gulp.task('lint:source', function() {
	var dev = args._[0] === 'development';
	return gulp.src(config.dirs.source + "/**/*.js")
		.pipe(jshint({lookup: false, debug: dev}))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('build:uncompressed', ['lint:source', 'clean:uncompressed'], function() {
	// prepare plugin warnings
	var pluginWarnings = [];
	for (var classname in pluginInfo.plugins) {
		var warn = pluginInfo.warningTPL.replace(/%CLASSNAME%/g, classname);
		for (var methodname in pluginInfo.plugins[classname]) {
			pluginWarnings.push(warn.replace(/%METHOD%/g, methodname).replace(/%PLUGIN%/g, pluginInfo.plugins[classname][methodname]));
		}
	}
	return gulp.src(config.files, { base: config.dirs.source })
		.pipe(plumber())
		.pipe(include("// @")) // do file inclusions
			.pipe(replace({
			patterns: [
				{ // add plugin warnings
					match: /\/\/ \@generate PlugInWarnings/gm,
					replacement: pluginWarnings.join("\n")
				},
				{ // remove build notes
					match: /[\t ]*\/\/ \(BUILD\).*$\r?\n?/gm,
					replacement: ''
				}
			]
		}))
		.pipe(concat.header(options.banner.uncompressed))
		.pipe(replace(options.replaceVars))
		.pipe(beautify({
			indentSize: 1,
			indentChar: '\t'
		}))
		.pipe(gulp.dest(options.folderOut + "/" + options.subfolder.uncompressed));
});

gulp.task('build:minified', ['lint:source', 'clean:minified'], function() {
	// minified files
	return gulp.src(config.files, { base: config.dirs.source })
		.pipe(plumber())
		.pipe(include("// @")) // do file inclusions
		.pipe(rename({suffix: ".min"}))
		.pipe(replace({
			patterns: [
				{ // replace throw messages in scene option validations
					match: /^\s*throw \[.+\];\s*$/gm,
					replacement: 'throw 0;'
				},
				{ // remove log messages
					match: /((\s*.+\._?)|(\s+))log\([0-3],.+\)\s*;\s*$/gm,
					replacement: ''
				},
				{ // remove unnecessary stuff in minify
					match: /\/\/ \(BUILD\) - REMOVE IN MINIFY - START[^]*?\/\/ \(BUILD\) - REMOVE IN MINIFY - END/gm,
					replacement: ''
				}
			]
		}))
		.pipe(uglify({
			output: {
				screw_ie8 : true
			},
			compress: {
				unsafe: true,
				screw_ie8 : true,
				hoist_vars: false // default is false - true would make code technically more correct, but increases gzip size
			},
			mangle: {
				screw_ie8 : true
			},
		}))
		.pipe(concat.header(options.banner.minified))
		.pipe(replace(options.replaceVars))
		.pipe(gulp.dest(options.folderOut + "/" + options.subfolder.minified));
});

gulp.task('generate:docs', ['clean:docs'], function(callback) {
		// use uncompiled source files for now
		return gulp.src("dev/src/**/*.js", { base: process.cwd() + "/dev/src" })
      .pipe(jsdoc({
      	conf: './dev/docs/jsdoc.conf.json',
      	destination: options.folderDocsOut,
      	template: './dev/docs/template',
      	readme: './README.md',
      }));
});

gulp.task('sync:json-files', function() {
	gulp.src(["./package.json", "./bower.json", "./ScrollMagic.jquery.json"])
			.pipe(jeditor(config.info, {keep_array_indentation: true}))
			.pipe(jeditor({version: options.version}, {keep_array_indentation: true}))
			.pipe(gulp.dest("./"));
	gulp.src("./dev/build/config.json")
			.pipe(jeditor(
				{
					version: options.version,
					lastupdate: options.date.getFullYear() + "-" + ("0"+(options.date.getMonth() + 1)).slice(-2) + "-" + ("0"+options.date.getDate()).slice(-2)
				},
				{
					keep_array_indentation: true
				}
			))
			.pipe(gulp.dest("./dev/build"));
});

gulp.task('sync:readme', function() {
	gulp.src("./README.md")
			.pipe(replace({
				patterns: [
					{
						// link to changelog
						match: /(<a .*class='version'.*>v)\d+\.\d+\.\d+(\-\w+)?(<\/a>)/gi,
						replacement: "$1" + options.version + "$3"
					},
					{
						// cdnjs url
						match: /(cdnjs.cloudflare.com\/ajax\/libs\/ScrollMagic\/)\d+\.\d+\.\d+(\-\w+)?(\/)/gi,
						replacement: "$1" + options.version + "$3"
					}
				]
			}))
			.pipe(gulp.dest("./"));
});

gulp.task('test', ['build:uncompressed', 'build:minified'], function () {
	return gulp.src([]) // file list supplied in karma conf file
		.pipe(karma({
			configFile: "./" + config.karma.config,
			action: 'run'
		}))
		.on('error', function(err) {
			throw err;
		});
});

gulp.task('travis-ci', ['build:uncompressed', 'build:minified', 'test']);

gulp.task('development', ['build:uncompressed']);