'use strict';

var gulp = require('gulp');
var babelify = require('babelify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var gutil = require('gulp-util');
var transform = require('vinyl-transform');
var exorcist = require('exorcist');
var packageJSON  = require('./package');
var jshintConfig = packageJSON.jshintConfig;
jshintConfig.lookup = false;

gulp.task('jshint', () => {
    /*
    Does static analysis of the source code.
     */
    return gulp.src(['./batavia/src/*.js', './batavia/src/**/*.js']).pipe(
        jshint(jshintConfig)
    ).pipe(
        jshint.reporter(stylish)
    );
});

gulp.task('build', () => {
    /*
    Builds the following files:
        batavia/batavia.js      Raw output of babel and browserify
        batavia/batavia.map     Source map of batavia.js to the real source
        batavia/batavia.min.js  Minified batavia.js

    Note that we specifically do not use gulp-browserify, as that one is
    incredibly slow and recommended not to use.
     */
    return browserify({
        // entries is the "main" script that imports everything else
        entries: './batavia/src/main.js',
        // the "output" (exports) of the "main" script will have this name
        standalone: 'batavia',
        // we tell browserify to first run everything through babel, using
        // the es2015 (aka ES6) preset
        transform: [babelify.configure({
            presets: ['es2015']
        })],
        // this will enable sourcemap generation
        debug: true
    }).bundle().pipe(
        // This (and the buffer() in the next call turns the bundle from
        // browserify into a gulp stream
        source('batavia.js')
    ).pipe(
        buffer()
        // rename the output file to batavia
    ).pipe(rename({
        basename: 'batavia'
    })).pipe(
        // move the inlined sourcemap to a separate file, this makes git diffs
        // a bit nicer.
        transform(() => {return exorcist('./batavia/batavia.map');})
    ).pipe(
        // write the file to disk
        gulp.dest('./batavia/')
    ).pipe(
        // minify the file
        uglify().on('error', gutil.log)
    ).pipe(rename({
        // change it to batavia.min.js
        'extname': '.min.js'
    })).pipe(
        // write the minifed file to disk
        gulp.dest('./batavia/')
    );
});

gulp.task('watch', () => {
    return gulp.watch(['./batavia/src/*.js', './batavia/src/**/*.js'], ['jshint', 'build']);
});

gulp.task('default', ['jshint', 'build', 'watch']);