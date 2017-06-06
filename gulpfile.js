var gulp = require('gulp');

var rollup = require('rollup');
var babel = require("rollup-plugin-babel");
var resolve = require('rollup-plugin-node-resolve');
var multiEntry = require('rollup-plugin-multi-entry');
var uglify = require('rollup-plugin-uglify');

var ejs = require('gulp-ejs');

var stylus = require('gulp-stylus');

gulp.task('bundle', function () {
    return rollup.rollup({
        entry: './src/js/index.js',
        plugins: [
            multiEntry(),
            resolve(),
            babel({
                presets: [
                    [
                        "es2015", {"modules": false}
                    ]
                ],
                babelrc: false,
                exclude: 'node_modules/**'
            }),
            uglify()
        ]
    })
    .then(function (bundle) {
        bundle.write({
            format: "iife",
            moduleName: 'polarity',
            dest: './public/js/bundle.js',
            sourceMap: true
        });
    });
});

gulp.task('ejs', function() {
    return gulp.src('./src/html/*.ejs')
        .pipe(ejs({}, {}, {ext: '.html'}))
        .pipe(gulp.dest('./public'))
});

gulp.task('stylus', function () {
    return gulp.src('./src/css/main.styl')
        .pipe(stylus({
            compress: true
        }))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function () {
    gulp.watch('./src/js/**/*.js', ['bundle']);
    gulp.watch('./src/html/**/*.ejs', ['ejs']);
    gulp.watch('./src/css/**/*.styl', ['stylus']);
});

gulp.task('build', ['ejs', 'stylus', 'bundle']);

gulp.task('dev', ['build', 'watch']);

gulp.task('default', ['build']);