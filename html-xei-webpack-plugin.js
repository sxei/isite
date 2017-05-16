'use strict';

function HtmlXeiWebpackPlugin(options)
{
	
}

HtmlXeiWebpackPlugin.prototype.apply = function(compiler)
{
	compiler.plugin('compilation', function(compilation)
	{
		// 监听html处理之后的事件
		compilation.plugin('html-webpack-plugin-after-html-processing', function(htmlPluginData, callback)
		{
			var entry = compiler.options.entry;
			// 将 <script type="text/javascript" src="/tool/index.js"></script> 转换成
			// <script type="text/javascript" src="/index.js"></script>
			for(var i in entry)
			{
				htmlPluginData.html = htmlPluginData.html.replace(new RegExp('(src="/)('+i+')(\.js"></script>)', 'gim'), function(m, $1, $2, $3)
				{
					return $1 + $2.replace(/^.+?\//, '') + $3;
				});
				htmlPluginData.html = htmlPluginData.html.replace(new RegExp('(<link href="/)('+i+')(\.css")', 'gim'), function(m, $1, $2, $3)
				{
					return $1 + $2.replace(/^.+?\//, '') + $3;
				});
			}
			htmlPluginData.html = htmlPluginData.html.replace(/src="\/res\/js\/common\.js">/g, 'src="//res.liuxianan.com/js/common.js">');
			htmlPluginData.html = htmlPluginData.html.replace(/link href="\/res\/js\/common\.css"/g, 'link href="//res.liuxianan.com/js/common.css"');
			callback();
		});
	});
};

module.exports = HtmlXeiWebpackPlugin;