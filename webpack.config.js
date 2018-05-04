var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
// 自己随便写的一个定制化的复制插件
var HtmlXeiWebpackPlugin = require('./html-xei-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var fs = require('fs');

var copyFolders = ['res', 'test', 'www']; // 需要被直接复制的文件夹
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
		filename: '[name].js?v=[chunkhash:8]'
	},
	module: {
		//加载器配置
		loaders: [
			// 特别注意！不同版本的ExtractTextPlugin语法完全不一样，也是醉了！
			{test: /\.css$/, loader: ExtractTextPlugin.extract({fallback: "style-loader", use: "css-loader"})},
			{test: /\.js$/, loader: 'jsx-loader?harmony'},
			// {test: /\.js$/, loader: 'babel-loader'},
			// {test: /\.scss$/, loader: 'style!css!sass?sourceMap'},
			// 小于8kb的图片直接采用base64方式引入
			{test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
			// html采用ejs模板，所以用ejs加载器
			{test: /\.(html|ejs)$/, loader: 'ejs-loader'}
		]
	},
	//其它解决方案配置
	resolve: {
		// root: 'E:/github/flux-example/src', //绝对路径
		// 自动扩展文件后缀名查找优先级，如果我们不写扩展名则按照这个优先级查找文件
		extensions: ['.js', '.json', '.scss'],
		// 别名
		alias: {
			com: getAbsolutePath('./src/com'),
			tpl: getAbsolutePath('./src/com/tpl'),
			config: getAbsolutePath('./src/com/config'),
			tool: getAbsolutePath('./src/tool'),
			jquery: getAbsolutePath('./src/res/lib/jquery/2.1.1/jquery.js')
		}
	},
	// 插件项
	plugins: [
		// 公共模块提取插件
		new webpack.optimize.CommonsChunkPlugin({
			name:'res/bundle/common',
			// 至少要被多少个页面引用才算作是公共模块
			minChunks: 4
		}),
		// 压缩js文件
		new webpack.optimize.UglifyJsPlugin({
			compress: {warnings: false}
		}),
		// 在所有JS开头添加banner
		// 由于不改内容每次构建内容都会变，所以还是注释算了
		// new webpack.BannerPlugin("The file is creted by lxa --"+ new Date()),
		// 静态资源拷贝插件
		new CopyWebpackPlugin(getCopyWebpackPlugins()),
		// 输出CSS
		new ExtractTextPlugin('[name].css?v=[contenthash:8]')
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



// 获取某个路径的绝对路径
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
		if(checkIsCopyFolder(filePath)) return;
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
		if(checkIsCopyFolder(filePath)) return;
		if(/index\.(html|ejs)$/g.test(filePath))
		{
			// 查找有没有对应的入口chunk，有的话push进去
			var chunk = filePath.replace(/^src\//g, '').replace(/\.(html|ejs)$/g, '');
			var chunks = [];
			
			if(config.entry[chunk])
			{
				chunks.push('res/bundle/common');
				chunks.push(chunk);
			}
			
			plugins.push(new HtmlWebpackPlugin(
			{
				title: 'test title',
				template: getAbsolutePath(filePath),　
				filename: getAbsolutePath(filePath.replace(/^src/g, 'dist').replace(/\.ejs$/g, '\.html')),
				inject: true, // JS注入页面
				chunks: chunks
			}));
		}
	});
	return plugins;
}

function getCopyWebpackPlugins()
{
	var plugins = [];
	copyFolders.forEach(folder =>
	{
		plugins.push(
		{
			from: getAbsolutePath('./src/'+folder),
			to: getAbsolutePath('./dist/'+folder),
			force: true // 覆盖同名文件
		});
	});
	scanFolderSync('src', function(filePath, fileName, isFolder)
	{
		// 只要文件夹名是asset的也直接复制
		if(fileName == 'asset' && isFolder)
		{
			var folder = filePath.replace('src/', '');
			plugins.push(
			{
				from: getAbsolutePath('./src/'+folder),
				to: getAbsolutePath('./dist/'+folder),
				force: true // 覆盖同名文件
			});
		}
	});
	return plugins;
}

/**
 * 检查是否是需要直接复制的文件夹
 * @param {*} filePath 
 */
function checkIsCopyFolder(filePath)
{
	for(var i=0; i<copyFolders.length; i++)
	{
		if(filePath.startsWith('src/'+copyFolders[i]+'/'))
		{
			return true;
		}
	}
	return false;
}

/**
 * 同步遍历某个文件夹，注意需要定义 var path = require('path');
 * @param {*} filePath 需要遍历的文件夹 
 * @param {*} callback 回调函数，接收3个参数(filePath, fileName, isFolder, deep)
 */
function scanFolderSync(filePath, callback)
{
	var deep = arguments[2] || 1;
	var isFolder = fs.statSync(filePath).isDirectory();
	callback(filePath, path.basename(filePath), isFolder, deep);
	if(isFolder) 
	{
		fs.readdirSync(filePath).forEach(function(file)
		{
			scanFolderSync(filePath + '/' + file, callback, deep + 1);
		});
	}
}