//require('./emoji_sprite.css');
var emojis = require('./asset/emoji');
var chengyus = require('./chengyus');

function parseDictWithTone() {
    var notone = pinyin_dict_withtone.split(',');
    var py2hz = {}, py, hz;
    for(var i=0, len = notone.length; i<len; i++)
    {
        hz = String.fromCharCode(i + 19968); // 汉字
        py = notone[i].split(' '); // 去掉了声调的拼音数组
        for(var j=0; j<py.length; j++)
        {
            py2hz[py[j]] = (py2hz[py[j]] || '') + hz;
        }
    }
    pinyinUtil.dict.pyt2hz = py2hz;
}
parseDictWithTone();
pinyinUtil.getHanziByTone = function(pinyinWithTone) {
    return pinyinUtil.dict.pyt2hz[pinyinWithTone] || '';
}



// 将所有的关键字映射出来：{kw => []}
var emojiMap = {};
emojis.forEach(emoji => {
    // 第4个参数为 kw
    if(emoji[3]) {
        var temp = emoji[3].split(',');
        temp.forEach(kw => {
            if(!emojiMap[kw]) emojiMap[kw] = [];
            emojiMap[kw].push(emoji);
        });
    }
});
//console.log(Object.keys(emojiMap));

/**
 * 根据汉字查找匹配的emoji图标
 * @param {*} kw 单个汉字
 */
function findEmojiByKw(kw, pinyin) {
    // 首先，精确匹配
    var temp = emojiMap[kw];
    // 如果找到了，随机返回一个
    if(temp) return xei.getRandom(temp);
    var hz = pinyinUtil.getHanziByTone(pinyin);
    for(var i=0; i<hz.length; i++) {
        if(emojiMap[hz[i]]) {
            console.log('找到同音同调字！');
            return xei.getRandom(emojiMap[hz[i]]);
        }
    } 
    hz = pinyinUtil.getHanzi(pinyin);
    for(var i=0; i<hz.length; i++) {
        if(emojiMap[hz[i]]) {
            console.log('找到同音字！');
            return xei.getRandom(emojiMap[hz[i]]);
        }
    } 
    return emojiMap['问'][0];
}

var answer = ''; // 最终答案
var answerPinyin = [];
$('#gen').click(function(e) {
    var temp = xei.getRandom(chengyus);
    answer = temp[0];
    answerPinyin = temp[1].split(',');
    var result = [];
    for(var i=0; i<4; i++) {
        result.push(findEmojiByKw(answer[i], answerPinyin[i]));
    }
    var html = '';
    result.forEach(item => {
        html += `<div class="emoji emoji_${item[0]}" style="margin-right:5px;" title="${item[2]}"></div>`;
        //html += `<img src="asset/images/${item[0]}.png" title="${item[2]}"/>`;
    });
    $('#answer').html('');
    $('#emoji_wrapper').html(html);
});
$('#see').click(function(e){
    $('#answer').html(`答案：${answer?answer:'请点击生成按钮！'}`)
});
$('#guess').click(function(e){
    if(prompt('请输入正确答案：') == answer) {
        alert('恭喜回答正确！你太棒了！');
    } else {
        alert('很遗憾你答错了，再接再厉吧！');
    }
});