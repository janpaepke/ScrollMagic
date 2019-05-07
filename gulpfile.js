#!/usr/bin/env node

"use strict";

/* ########################################## */
/* ########### load dependencies ############ */
/* ########################################## */

var
	// node modules
	fs = 					require('fs'),
	del = 				require('del'),
	semver =			require('semver'),
	yargs = 			require('yargs'),
	karma =				require('karma'),

	// gulp & modules
	gulp =				require('gulp'),
	jshint =			require('gulp-jshint'),
	include =			require('gulp-file-include'),
	rename =			require('gulp-rename'),
	replace =			require('gulp-replace-task'),
	header =			require('gulp-header'),
	uglify =			require('gulp-uglify'),
	jeditor = 		require('gulp-json-editor'),
	beautify =		require('gulp-jsbeautifier'),
	open =				require('open'),

	// custom built
	log = 				require('./dev/build/logger'),
	size = 				require('./dev/build/filesize'),
	jsdoc = 			require('./dev/build/jsdoc-generator'),
	
	// config files
	pluginInfo =	require('./dev/src/plugins.json'),
	config = 			require('./dev/build/config.json'); // config

/* ########################################## */
/* ############# get parameters ############# */
/* ########################################## */

// command line options (use gulp -? to for help)
var args = yargs
	.usage('Usage: gulp [task] [options]')
	.describe('o', 'Specify output folder for dist files ')
		.alias('o', 'out')
		.default('o', './' + config.dirs.defaultOutput)
	.describe('d', 'Generate new docs, optionally supplying output folder [default folder: ./"' + config.dirs.defaultDocsOutput + '"]')
		.alias('d', 'doc')
		.default('d', false)
	.describe('b', 'Bumps ScrollMagic version number.')
		.choices('b', ['patch', 'minor', 'major'])
		.coerce('b', (val) => (val === true) ? "patch" : val) // use 'patch' if only -b is used
		.alias('b', 'bump')
	.describe('debug', 'Enters debug mode: Allows \'debugger\' statements to remain in the code during compilation.')
		.default('debug', false)
	.help('?')
	// examples
	.example("$0 -o=mybuild", 		'build and output to folder "mybuild"')
	.example("$0 -d", 						'build and generate new docs')
	.example("$0 --debug", 				'build while allowing for \'debugger\' statements')
	.example("$0 --doc=newdocs", 	'build and generate new docs into folder "newdocs"')
	.example("$0 --bump=patch", 	'build and update version number from to 2.1.1 to 2.1.2')
	.argv;

/* ########################################## */
/* ################ settings ################ */
/* ########################################## */

var options = {
	version: args.bump ? semver.inc(config.version, args.bump) : config.version,
	dodocs: !!args.doc,
	folderOut: args.out,
	folderDocsOut: args.doc.split ? args.doc : './' + config.dirs.defaultDocsOutput,
	date: args.bump ? new Date() : new Date(config.lastupdate),
	banner: {
		uncompressed: fs.readFileSync(config.banner.uncompressed, 'utf-8'),
		minified: fs.readFileSync(config.banner.minified, 'utf-8')
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
/* ############ validate options ############ */
/* ########################################## */

// output
if (!fs.existsSync(options.folderOut)) {
	log.exit("Supplied output path not found: " + options.folderOut);
}
// docs output
if (options.dodocs && !fs.existsSync(options.folderDocsOut)) {
	log.exit("Supplied output path for docs not found: " + options.folderDocsOut);
}

/* ########################################## */
/* ################ helpers ################# */
/* ########################################## */

function clearFolder (path) {
	return del ([
		path + '/**/*',
		path + '/**/.*' // match also hidden files
	])
};

/* ########################################## */
/* ############# internal tasks ############# */
/* ########################################## */

// summary for default
var summary = function() {
	log.info("Generated new build to", options.folderOut);
	// gulp.src(options.folderOut + "/*.js")
	if (args.bump) {
		log.info("Bumped version number from v" + config.version + " to v" + options.version);
	}
	if (options.dodocs) {
		log.info("Generated new docs to", options.folderDocsOut);
	}

	// TODO: fix to run in series properly - maybe remove gulp here?
	return gulp.src(options.folderOut + "/" + options.subfolder.uncompressed + "/*.js")
						 .pipe(size({showFiles: true, gzip: true, title: "Main Lib uncompressed"}))
	&& gulp.src(options.folderOut + "/" + options.subfolder.uncompressed + "/plugins/*.js")
				 .pipe(size({showFiles: false, gzip: true, title: "Plugins uncompressed"}))
	&& gulp.src(options.folderOut + "/" + options.subfolder.minified + "/*.js")
				 .pipe(size({showFiles: true, gzip: true, title: "Main Lib minified"}))
	&& gulp.src(options.folderOut + "/" + options.subfolder.minified + "/plugins/*.js")
				 .pipe(size({showFiles: false, gzip: true, title: "Plugins minified"}));
}

// syncs the version accross all relevant files
var syncVersion = function(done) {
	var beautifyOptions = {
		"keep_array_indentation": true,
		"end_with_newline": true
	}
	gulp.src(["./package.json", "./bower.json"])
			.pipe(jeditor(config.info, beautifyOptions))
			.pipe(jeditor({version: options.version}, beautifyOptions))
			.pipe(gulp.dest("./"));
	gulp.src("./dev/build/config.json")
			.pipe(jeditor(
				{
					version: options.version,
					lastupdate: options.date.getFullYear() + "-" + ("0"+(options.date.getMonth() + 1)).slice(-2) + "-" + ("0"+options.date.getDate()).slice(-2)
				},
				beautifyOptions
			))
			.pipe(gulp.dest("./dev/build"));
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
	done();
};
syncVersion.displayName = "sync-version";

// clear the uncompressed folder.
var cleanUncompressed = function() {
	return clearFolder(options.folderOut + "/" + options.subfolder.uncompressed);
};
cleanUncompressed.displayName = 'clean:uncompressed';

// clear the minified folder.
var cleanMinified = function() {
	return clearFolder(options.folderOut + "/" + options.subfolder.minified);
};
cleanMinified.displayName = 'clean:minified';

// clear the minified folder.
var cleanDocs = function() {
	return clearFolder(options.folderDocsOut);
};
cleanDocs.displayName = 'clean:docs';

// Check sourcefiles for errors
var sourceErrorcheck = function() {
	return gulp.src(config.dirs.source + "/**.js")
		.pipe(jshint({lookup: false, debug: args.debug}))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
};
sourceErrorcheck.displayName = 'check:source';

// generate uncompressed js output files
var compileUncompressed = function() {
	// prepare plugin warnings
	var pluginWarnings = [];
	for (var classname in pluginInfo.plugins) {
		var warn = pluginInfo.warningTPL.replace(/%CLASSNAME%/g, classname);
		for (var methodname in pluginInfo.plugins[classname]) {
			pluginWarnings.push(warn.replace(/%METHOD%/g, methodname).replace(/%PLUGIN%/g, pluginInfo.plugins[classname][methodname]));
		}
	}
	return gulp.src(config.files, { base: config.dirs.source })
		// .pipe(plumber())
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
		.pipe(header(options.banner.uncompressed))
		.pipe(replace(options.replaceVars))
		.pipe(beautify({
			"indent_with_tabs": true,
			"jslint_happy": true
		}))
		.pipe(gulp.dest(options.folderOut + "/" + options.subfolder.uncompressed));
};
compileUncompressed.displayName = "compile:uncompressed";

// generate minified js output files
var compileMinified = function() {
	// minify files
	return gulp.src(config.files, { base: config.dirs.source })
		// .pipe(plumber())
		.pipe(include("// @")) // do file inclusions
		.pipe(rename({suffix: ".min"}))
		.pipe(replace({
			patterns: [
				{ // replace throw messages in scene option validations
					match: /^\s*throw \[.+\];\s*$/gm,
					replacement: 'throw 0;'
				},
				{ // remove log messages
					match: /((\s*.+\._?)|(\s+))log\s*\([0-3],.+\)\s*;\s*$/gm,
					replacement: ''
				},
				{ // remove unnecessary stuff in minify
					match: /\/\/ \(BUILD\) - REMOVE IN MINIFY - START[^]*?\/\/ \(BUILD\) - REMOVE IN MINIFY - END/gm,
					replacement: ''
				}
			]
		}))
		.pipe(uglify({
			ie8 : false,
			output: {
				ie8 : false
			},
			compress: {
				unsafe: true,
				hoist_vars: false // default is false - true would make code technically more correct, but increases gzip size
			}
		}))
		.pipe(header(options.banner.minified))
		.pipe(replace(options.replaceVars))
		.pipe(gulp.dest(options.folderOut + "/" + options.subfolder.minified));

};
compileMinified.displayName = "compile:minified";

// copy static doc files, kept for compatiblity purposes
var copyStaticDocfiles = function() {
		return gulp.src("dev/docs/static/**/*.*", { base: process.cwd() + "/dev/docs/static" })
      .pipe(gulp.dest(options.folderDocsOut));
};
copyStaticDocfiles.displayName = "copy:static-docfiles";

// use uncompiled source files to generate docs
var compileDocs = function() {
		return gulp.src("dev/src/**/*.js", { base: process.cwd() + "/dev/src" })
      .pipe(jsdoc({
      	conf: './dev/docs/jsdoc.conf.json',
      	destination: options.folderDocsOut,
      	template: './dev/docs/template',
      	readme: './README.md',
      }));
};
compileDocs.displayName = "compile:docs";

var runKarmaTests = function (cb) {
	new karma.Server({
	    configFile: __dirname + config.karma.config,
	    singleRun: true
	  }, cb)
		.on('error', function(err) {
			throw err;
		})
  	.start();
}

var openDemo = function () {
	return open("./index.html");
}

/* ########################################## */
/* ############# exposed tasks ############## */
/* ########################################## */

// define sequences
var buildUncompressed = gulp.series(cleanUncompressed, compileUncompressed);
var buildMinified = gulp.series(cleanMinified, compileMinified);
var buildAll = gulp.parallel(buildUncompressed, buildMinified);
var generateDocs = gulp.series(cleanDocs, copyStaticDocfiles, compileDocs);
var runTests = gulp.series(buildAll, runKarmaTests);

// add doc compilation to default sequence, if -d parameter is present
var defaultSequence = [syncVersion, sourceErrorcheck, buildAll];
if (options.dodocs) defaultSequence.push(generateDocs);

// expose tasks
gulp.task('build:uncompressed', buildUncompressed);

gulp.task('build:minified', buildMinified);

gulp.task('test', runTests);

gulp.task('generate:docs', generateDocs);

gulp.task('open-demo', openDemo);

gulp.task('travis-ci', gulp.series(sourceErrorcheck, buildAll, runKarmaTests));

// Default task for compilation. This is run with `gulp` and no defined task
gulp.task('default', gulp.series(defaultSequence, summary));
