const fs = require('fs');
const jsdom = require("jsdom");
const jquery = require('jquery');
const {JSDOM} = jsdom;
const request = require('request');


for(let i=100; i<205; i++) {
	let src = `http://qzonestyle.gtimg.cn/qzone/em/e${i}.gif`;
	request(src).pipe(fs.createWriteStream(`qq/qq_${i}.gif`));
}

