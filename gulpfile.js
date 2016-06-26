var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    del = require('del');

gulp.task('build:styles', function() {
    return gulp.src([   'client/css/common.css',
                        'client/css/landing.css',
                        'client/css/results.css'])
                .pipe(concat('main.css'))
                .pipe(gulp.dest('dist/css'))
                .pipe(notify({ message: 'Built styles.'}));
});

gulp.task('build:styles-vendor', function() {
    return gulp.src(['vendor/bootstrap-3.3.6-dist/css/bootstrap.css'])
                .pipe(concat('main-client-vendor.css'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('dist/css'))
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
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('dist/js'))
                .pipe(notify({ message: 'Built client scripts.' }));
});

gulp.task('build:client-images', function (){
    return gulp.src('client/images/*.*')
            .pipe(gulp.dest('dist/images'))
            .pipe(notify({ message: 'Built client images.' }));
});

gulp.task('build:client-vendor', function() {
    return gulp.src([
                        'vendor/jquery-2.2.4/js/jquery-2.2.4.min.js',
                        'vendor/colorbox-1.6.4/js/jquery.colorbox-min.js',
                        'vendor/bootstrap-3.3.6-dist/js/bootstrap.min.js'
                    ])
                .pipe(concat('main-client-vendor.js'))
                .pipe(gulp.dest('dist/js'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('dist/js'))
                .pipe(notify({ message: 'Built client vendor scripts.' }));
});

gulp.task('lint:games', function() {
    return gulp.src('games/**/*.js')
                .pipe(jshint('client.jshintrc'))
                .pipe(jshint.reporter('default'))
                .pipe(jshint.reporter('fail'));
});

gulp.task('lint:server', function() {
    return gulp.src('server/**/*.js')
                .pipe(jshint('server.jshintrc'))
                .pipe(jshint.reporter('default'))
                .pipe(jshint.reporter('fail'));
});

gulp.task('build:server', function() {
    return notify({ message: 'Built server scripts.' });
});

gulp.task('build:games-images', function () {
    return gulp.src('games/**/preview.png', { base:'games' })
            .pipe(gulp.dest('dist/games'))
            .pipe(notify({ message: 'Built client images.' }));
});

gulp.task('build:games-scripts', function () {
    return gulp.src('games/**/*.js', { base:'games' })
            .pipe(gulp.dest('dist/games'))
            .pipe(notify({ message: 'Built client images.' }));
});

gulp.task('build:games-vendor', function() {
    return gulp.src([
                        'vendor/box2dWeb-2.1.a.3/Box2dWeb-2.1.a.3.min.js',
                        'vendor/flotr2/flotr2.min.js',
                        'vendor/jcanvas-6.0/jcanvas.min.js',
                        'vendor/rng-1.0/rng.js',
                        'vendor/game-framework/game-framework.js'
                    ])
                .pipe(concat('main-games-vendor.js'))
                .pipe(gulp.dest('dist/js'))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest('dist/js'))
                .pipe(notify({ message: 'Built game vendor scripts.' }));
});

gulp.task('clean', function(cb) {
    return del(['dist'], cb);
});

gulp.task('lint', function() {
    return gulp.start('lint:client', 'lint:server', 'lint:games');
});

gulp.task('build-no-lint', ['clean'], function() {
    return gulp.start(  'build:styles',
                        'build:styles-vendor',
                        'build:client',
                        'build:client-images',
                        'build:client-vendor',
                        'build:games-images',
                        'build:games-scripts',
                        'build:games-vendor',
                        'build:server');
});

gulp.task('default', ['clean'], function() {
    return gulp.start(  'lint:client',
                        'lint:server',
                        'lint:games',
                        'build-no-lint');
});
