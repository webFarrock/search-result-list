var webpack = require("webpack");
var gulp = require('gulp');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var ftp = require('gulp-ftp');
var privateFtp = require('./private/ftp');

gulp.task('watch', function () {
    gulp.watch('bundle/**', ['ftp']);
});

gulp.task('ftp', function () {

    var ftpParams = Object.assign({}, privateFtp);
    ftpParams.remotePath += 'bundle/';

    return gulp.src('bundle/**')
        .pipe(ftp(ftpParams))
        // you need to have some kind of stream after gulp-ftp to make sure it's flushed
        // this can be a gulp plugin, gulp.dest, or any kind of stream
        // here we use a passthrough stream
        //.pipe(gutil.noop());
        .pipe(gutil.noop());
});


gulp.task('deploy', function () {
   // console.log('privateFtp: ', privateFtp);

    return gulp.src(['**', '!fakedata/**', '!node_modules/**', '!private/**', '!static/**', '!*.log', '!index.html', '.gitignore', '.babelrc'])
        .pipe(ftp(privateFtp))
        // you need to have some kind of stream after gulp-ftp to make sure it's flushed
        // this can be a gulp plugin, gulp.dest, or any kind of stream
        // here we use a passthrough stream
        //.pipe(gutil.noop());
        .pipe(gutil.noop());
});



