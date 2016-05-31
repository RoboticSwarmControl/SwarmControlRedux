var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    del = require('del');

gulp.task('build:styles', function() {
    return gulp.src('styles/**/*.css')
                .pipe(concat('main.css'))
                .pipe(gulp.dest('static/css'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('static/css'))
                .pipe(notify({ message: 'Built styles.'}));
});

gulp.task('lint:client', function() {
    return gulp.src('client/**/*.js')
                .pipe(jshint('client.jshintrc'))
                .pipe(jshint.reporter('default'))
                .pipe(jshint.reporter('fail'));
});

gulp.task('build:client', function() {
    return gulp.src('client/**/*.js')
                .pipe(concat('main-client.js'))
                .pipe(gulp.dest('static/js'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('static/js'))
                .pipe(notify({ message: 'Built client scripts.' }));
});

gulp.task('lint:server', function() {
    return gulp.src('server/**/*.js')
                .pipe(jshint('server.jshintrc'))
                .pipe(jshint.reporter('default'))
                .pipe(jshint.reporter('fail'));
});

gulp.task('build:server', function() {
    return gulp.src('server/**/*.js')                                     
                .pipe(concat('main-server.js'))
                .pipe(gulp.dest('static/js'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('static/js'))
                .pipe(notify({ message: 'Built server scripts.' }));
});

gulp.task('clean', function(cb) {
    return del(['static/css', 'static/js'], cb);
});

gulp.task('lint', function() {
    return gulp.start('lint:client', 'lint:server');
});

gulp.task('default', ['clean'], function() {
    return gulp.start('build:styles', 'lint:client', 'lint:server', 'build:client', 'build:server');
});
