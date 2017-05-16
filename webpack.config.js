var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlXeiWebpackPlugin = require('./html-xei-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var fs = require('fs');

var config = {
	//页面入口文件配置
	entry: getEntries(),
	//入口文件输出配置
	output: {
		// 在HTML中引入资源时的前缀
		publicPath: '/',
		// 输出文件夹
		path: getAbsolutePath('./dist'),
		// 输出文件名
		filename: '[name].js'
	},
	module: {
		//加载器配置
		loaders: [
			// 特别注意！不同版本的ExtractTextPlugin语法完全不一样，也是醉了！
			{test: /\.css$/, loader: ExtractTextPlugin.extract({fallback: "style-loader", use: "css-loader"})},
			{test: /\.js$/, loader: 'jsx-loader?harmony'},
			// {test: /\.scss$/, loader: 'style!css!sass?sourceMap'},
			// 小于8kb的图片直接采用base64方式引入
			{test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
			// html采用ejs模板，所以用ejs加载器
			{test: /\.html$/, loader: 'ejs-loader'}
		]
	},
	//其它解决方案配置
	resolve: {
		// root: 'E:/github/flux-example/src', //绝对路径
		// 自动扩展文件后缀名查找优先级，如果我们不写扩展名则按照这个优先级查找文件
		extensions: ['.js', '.json', '.scss'],
		// 别名
		alias: {
			tpl: getAbsolutePath('./src/com/tpl'),
			config: getAbsolutePath('./src/com/config'),
			tool: getAbsolutePath('./src/tool'),
			jquery: getAbsolutePath('./src/res/lib/jquery/2.1.1/jquery.js')
		}
	},
	// 插件项
	plugins: [
		// 公共模块提取插件
		new webpack.optimize.CommonsChunkPlugin('res/js/common'),
		// 静态资源拷贝插件
		new CopyWebpackPlugin([{
			from: getAbsolutePath('./src/res'),
			to: getAbsolutePath('./dist/res'),
			force: true // 覆盖同名文件
		}]),
		new ExtractTextPlugin('[name].css')
		// 全局挂载插件，使用jQuery的地方无需require，直接用$就可以了
		/*new webpack.ProvidePlugin(
		{
			$: 'jquery'
		})*/
	]
};

config.plugins = config.plugins.concat(getHtmlWebpackPlugins());
// 这个是自己随便写的一个插件，目的是为了解决JS引入的相对路径问题
config.plugins.push(new HtmlXeiWebpackPlugin());

module.exports = config;

function getAbsolutePath(tempPath)
{
	return path.resolve(__dirname, tempPath);
}

// 获取所有入口，注意这种方法在`webpack -w`模式下新增文件不会触发，比如手动重新编译一次
function getEntries()
{
	var entry = {};
	// 遍历src下面的所有js，只要文件名是index.js的都认为是入口文件
	scanFolderSync('src', function(filePath)
	{
		if(filePath.startsWith('src/res/')) return;
		if(filePath.endsWith('index.js'))
		{
			filePath = filePath.replace(/\.js$/g, '');
			entry[filePath.replace(/^src\//g, '')] = getAbsolutePath(filePath);
		}
	});
	return entry;
}

function getHtmlWebpackPlugins()
{
	var plugins = [];
	// 遍历src下面的所有html，只要文件名是index.html的都认为是入口页面
	scanFolderSync('src', function(filePath)
	{
		if(filePath.startsWith('src/res/')) return;
		if(filePath.endsWith('index.html'))
		{
			// 查找有没有对应的入口chunk，有的话push进去
			var chunk = filePath.replace(/^src\//g, '').replace(/\.html$/g, '');
			var chunks = [];
			chunks.push('res/js/common');
			if(config.entry[chunk]) chunks.push(chunk);
			
			plugins.push(new HtmlWebpackPlugin(
			{
				title: 'test title',
				template: getAbsolutePath(filePath),　
				filename: getAbsolutePath(filePath.replace(/^src/g, 'dist')),
				inject: true, // JS注入页面
				chunks: chunks
			}));
		}
	});
	return plugins;
}

function scanFolderSync(path, callback, idx)
{
	idx = idx == undefined ? 1 : idx;
	if(!fs.statSync(path).isDirectory()) callback(path, idx);
	else
	{
		fs.readdirSync(path).forEach(function(file)
		{
			var tempPath = path + '/' + file;  
			if(fs.statSync(tempPath).isDirectory()) scanFolderSync(tempPath, callback, idx+1);
			else callback(tempPath, idx);
		});
	}
}