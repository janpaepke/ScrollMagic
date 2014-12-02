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
	// jsdoc = 			require('gulp-jsdoc'),
	addsrc = 			require('gulp-add-src'),
// custom
	log = 				require('./dev/build/logger'),
// json
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
	dodocs: !!args.doc,
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
			// remove unecessary comment open/closes
			match: /\s?\*\/\s*\/\*!?\s?\n( \*)?/gm,
			replacement: '$1\n$1'
		}
	],
	usePrefix: false
};

/* ########################################## */
/* ############### MAIN TASKS ############### */
/* ########################################## */

// default build all
gulp.task('default', ['validate:parameters', 'sync:json-files', 'sync:readme', 'build:uncompressed', 'build:minified', 'generate:docs'], function () {
	if (options.version != config.version) {
		log.info("Updated to version", options.version);
	}
});

gulp.task('open-demo', function() { // just open the index file
  gulp.src("./index.html")
  		.pipe(open("<%file.path%>"));
});

gulp.task('validate:parameters', function() {
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
});

gulp.task('clean:uncompressed', ['validate:parameters', 'lint:source'], function(callback) {
	del(options.folderOut + "/"+ options.subfolder.uncompressed +"/*", callback);
});
gulp.task('clean:minified', ['validate:parameters', 'lint:source'], function(callback) {
	del(options.folderOut + "/"+ options.subfolder.minified +"/*", callback);
});
gulp.task('clean:docs', ['validate:parameters', 'lint:source'], function(callback) {
	if (options.dodocs) {
		del(options.folderDocsOut + "/*", callback);
	} else {
		callback();
	}
});

gulp.task('lint:source', function() {
  return gulp.src(config.dirs.source + "/**/*.js")
    .pipe(jshint({lookup: false}))
  	.pipe(jshint.reporter('jshint-stylish'))
  	.pipe(jshint.reporter('fail'));
});

gulp.task('build:uncompressed', ['validate:parameters', 'lint:source', 'clean:uncompressed'], function() {
	return gulp.src(config.files, { base: config.dirs.source })
		.pipe(plumber())
		.pipe(include("// @")) // do file inclusions
			.pipe(replace({
			patterns: [
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

gulp.task('build:minified', ['validate:parameters', 'lint:source', 'clean:minified'], function() {
	// minified files
	return gulp.src(config.files, { base: config.dirs.source })
		.pipe(plumber())
		.pipe(include("// @")) // do file inclusions
		.pipe(rename({suffix: ".min"}))
		.pipe(replace({
			patterns: [
				{ // remove log messages
					match: /\s*log\([0-3],.+;.*$/gm,
					replacement: ''
				},
				{ // remove unnecessary stuff in minify
					match: /\/\/ \(BUILD\) - REMOVE IN MINIFY - START[^]*?\/\/ \(BUILD\) - REMOVE IN MINIFY - END/gm,
					replacement: ''
				}
			]
		}))
		.pipe(uglify())
		.pipe(concat.header(options.banner.minified))
		.pipe(replace(options.replaceVars))
		.pipe(gulp.dest(options.folderOut + "/" + options.subfolder.minified));

});

gulp.task('generate:docs', ['validate:parameters', 'lint:source', 'clean:docs'], function(callback) {
	if (options.dodocs) {
  	log.info("New docs are generated to " + options.folderDocsOut);

		var
			bin = '"' + 'node_modules/.bin/jsdoc' + '"',
			docIn = '"' + 'README.md' + '"',
			docOut = '-d "' + options.folderDocsOut + '"',
			conf = '-c "' + './dev/docs/jsdoc.conf.json' + '"',
			template = '-t "' + './dev/docs/template' + '"';

		// use uncompiled source files for now
		gulp.src("dev/src/**/*.js", { base: process.cwd() + "/dev/src" })
      .pipe(gutil.buffer(function(err, files){
      	files.forEach(function (file) {
      		docIn += ' "' + file.path + '"';
      	});
  		}));
		setTimeout(function(){ // etwas dirty mit timeout, aber wenigstens funktionierts...
  		// console.log(docIn);
			var cmd = [bin, docIn, conf, template, docOut].join(" ");
			// console.log(cmd);
			exec(cmd,
			  function (error, stdout, stderr) {
			    // log.info('stdout: ' + stdout);
			    // log.info('stderr: ' + stderr);
			    if (error !== null) {
			      log.exit('exec error: ' + error);
			    }
				}
			)
			.on("close", callback);
		}, 500);
	} else {
  	log.info("Docs are not being generated. (lacking parameter)");
		callback();
	}

	/*
  	// gulp-jsdoc only works with jsdoc-alpha5 which sucks.
  	// so do it manually for now

 		var jsdocconf = require('./dev/docs/jsdoc.conf.json');
 		jsdocconf.templates.path = 'dev/docs/template';
 		uncompressed
    	.pipe(addsrc('./README.md'))
    	.pipe(jsdoc(
    		options.folderDocsOut,
    		jsdocconf.templates,
    			{
    				plugins: jsdocconf.plugins
    			}
    		));
	*/
});

gulp.task('sync:json-files', ['validate:parameters'], function() {
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

gulp.task('sync:readme', ['validate:parameters'], function() {
	gulp.src("./README.md")
			.pipe(replace({
				patterns: [
					{
						match: /(<a .*class='version'.*>v)\d+\.\d+\.\d+(<\/a>)/gi,
						replacement: "$1" + options.version + "$2"
					}
				]
			}))
			.pipe(gulp.dest("./"));
});

gulp.task('run:tests', ['lint:source', 'build:uncompressed', 'build:minified'], function () {
	// TODO: run tests
});

gulp.task('generate:sourcemaps', ['lint:source', 'build:uncompressed', 'build:minified'], function () {
	// TODO: generate sourcemaps
});

gulp.task('travis-ci', ['lint:source', 'build:uncompressed', 'build:minified', 'run:tests']);

gulp.task('development', ['lint:source', 'build:uncompressed', 'generate:sourcemaps']);