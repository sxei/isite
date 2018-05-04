var menu = 
[
	{name: '游戏首页', subName: '游戏'},
	{
		name: '经典小游戏', // 有二级菜单的可以没有value值
		children: 
		[
			{name: '2048', value: '2048', icon: 'thumbs-up', splitter: false, _blank: false}
		]
	},
	{
		name: 'Flash小游戏',
		children: 
		[
			{name: '十面埋伏', value: 'maifu'},
		]
	},
	{name: '找省份', value: 'find-province'},
	{name: '看emoji猜成语', value: 'emoji-phrase'}
];
module.exports = menu;