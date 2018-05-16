var gulp = require('gulp'); // 引入gulp
var concat = require('gulp-concat'); // 合并
var babel = require('gulp-babel'); // 翻译ES6
var uglify = require('gulp-uglify'); // 压缩JS
var rename = require('gulp-rename'); // 改名
var cleanCSS = require('gulp-clean-css'); // 压缩CSS

// var js = ['./src/*.js'];


// 合并压缩CSS
gulp.task('css', function()
{
	let css = [
		'./src/res/blog/css/normalize_v3.0.3.css',
		'./src/res/blog/css/font-awesome/css/font-awesome.min.css',
		'./src/res/blog/plugin/jBox/0.3.2/jBox.css',
		'./src/res/blog/css/github-markdown.css',
		'./src/res/blog/css/blog.css',
		'./src/res/blog/css/comment.css',
	];
	gulp.src(css)
		.pipe(concat('main.css')) // 合并
		.pipe(cleanCSS()) // 压缩
		.pipe(gulp.dest('./dist/res/blog/css'))
});

// 合并压缩JS
gulp.task('js', function()
{
	let js = [
		'./src/res/blog/plugin/jquery/2.1.1/jquery.min.js',
		'./src/res/blog/plugin/jBox/0.3.2/jBox.js',
		'./src/res/blog/plugin/clipboard/1.5.12/clipboard.js',
		'./src/res/lib/xei/xei.js',
		'./src/res/blog/js/blog.js',
		//'./src/res/blog/js/comment.js',
	];
	gulp.src(js)
		.pipe(concat('main.js')) // 合并
		//.pipe(babel()) // 翻译ES6
		.pipe(uglify()) // 压缩JS
		.pipe(gulp.dest('./dist/res/blog/js/'));
});

// 压缩comment.js
gulp.task('comment', function()
{
	gulp.src(['./src/res/blog/js/comment.js'])
		.pipe(babel()) // 翻译ES6
		.pipe(uglify()) // 压缩JS
		.pipe(rename('comment.min.js')) // 重命名
		.pipe(gulp.dest('./dist/res/blog/js/'));
});


// 默认任务
gulp.task('default', function()
{
	gulp.run('css', 'js', 'comment');
	// 监听文件变化
	gulp.watch('./src/res/blog', function() {
		gulp.run('css', 'js', 'comment');
	});
});