var menu = 
[
	{
		name: '格式化', // 有二级菜单的可以没有value值
		children: 
		[
			{name: 'JSON格式化', value: 'json-format', icon: 'thumbs-up', splitter: false, _blank: false},
			{name: 'CSS格式化', value: '#', splitter: true},
			{name: 'HTML格式化', value: '#'}
		]
	},
	{
		name: '编码/转换',
		children: 
		[
			{name: 'base64编码', value: 'base64'},
			{name: '任意进制转换', value: 'jinzhi'},
			{name: 'URL编码', value: 'url-encode'},
			{name: 'MD5加密', value: 'md5'},
			{name: '汉语拼音', value: 'pinyin'}
		]
	},
	{name: '身份证', value: 'idcard'},
	{name: 'API调用', value: '/post.liuxianan.com', _blank: true},
];
module.exports = menu;