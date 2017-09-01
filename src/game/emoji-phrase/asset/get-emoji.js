const fs = require('fs');
const jsdom = require("jsdom");
const jquery = require('jquery');
const {JSDOM} = jsdom;
const request = require('request');

var result = {};
getPage(1);

function getPage(i) {
	console.log('开始处理：'+i);
	// 从这个网站抓取emoji数据
	request('https://www.fuhaodq.com/emoji/list_'+i+'.html', (error, response, body) => {
		var dom = new JSDOM(body);
		var $ = jquery(dom.window);
		var title = $('.fh-list .title').text();
		result[title] = [];
		$('.fh-list .list li').each((idx, item) => {
			var src = $(item).find('img').attr('src');
			var url = 'images/' + src.replace('https://www.fuhaodq.com/fhimg/', '').replace('/', '_');
			request(src).pipe(fs.createWriteStream(url));
			result[title].push({text: $(item).text().trim(), img: url, title: $(item).find('span').attr('title')});
		});
		if(i < 12) getPage(i+1);
		else fs.writeFileSync('emoji.json', JSON.stringify(result, null, '    '), 'utf-8');
	});
}