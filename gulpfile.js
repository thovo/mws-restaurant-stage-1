/*jshint esversion: 6 */
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageresize = require('gulp-image-resize');

gulp.task('default', () =>
    gulp.src('img/*')
        .pipe(imageresize({
            width: 300,
            height: 300,
            crop: true,
            upscale : false
        }))
		.pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
		.pipe(gulp.dest('img/dest/'))
);
