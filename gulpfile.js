var gulp = require('gulp'); // 引入gulp
var concat = require('gulp-concat'); // 合并
var babel = require('gulp-babel'); // 翻译ES6
var uglify = require('gulp-uglify'); // 压缩
var rename = require('gulp-rename'); // 改名

// var js = ['./src/*.js'];

// 压缩comment.js
gulp.task('default', function()
{
	gulp.src(['./src/res/blog/js/comment.js'])
		.pipe(babel())
		.pipe(uglify())
		.pipe(gulp.dest('./dist/res/blog/js/'));
});