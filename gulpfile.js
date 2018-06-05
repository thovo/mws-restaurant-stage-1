/*jshint esversion: 6 */
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageresize = require('gulp-image-resize');
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const cleanCss = require('gulp-clean-css');
const inlineCss = require('gulp-inline-css');

gulp.task('image', () => {
    gulp.src('img/*')
        .pipe(imageresize({
            width: 300,
            height: 300,
            crop: true,
            upscale: false
        }))
        .pipe(imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.jpegtran({
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            }),
            imagemin.svgo({
                plugins: [{
                        removeViewBox: true
                    },
                    {
                        cleanupIDs: false
                    }
                ]
            })
        ]))
        .pipe(gulp.dest('img/dest/'))
})

gulp.task('js', () => {
    gulp.src(['js/*.js'])
        .pipe(concat('bundle.js'))
        .pipe(minify())
        .pipe(gulp.dest('js/build/'));
});

gulp.task('css', () => {
    gulp.src(['css/normalize.css', 'css/styles.css'])
        .pipe(concat('bundle.css'))
        .pipe(cleanCss())
        .pipe(gulp.dest('css/build/'));
});

gulp.task('inlineCSS', () => {
    gulp.src('html/*.html')
        .pipe(inlineCss({
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: true,
            removeLinkTags: true
        }))
        .pipe(gulp.dest('html/build/'));
});

gulp.task('default', ['js', 'css', 'image']);