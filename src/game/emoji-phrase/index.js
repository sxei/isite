var emojis = require('./asset/emoji');

var emojiMap = {};
for(var i in emojis) {
    emojis[i].forEach(item => {
        if(item.kw) {
            emojiMap[item.kw.substr(0, 1)] = item;
        }
    });
}
var keys = Object.keys(emojiMap);
$('#gen').click(function(e){
    var result = [];
    for(var i=0; i<4; i++)
    {
        var k = xei.getRandom(keys);
        result.push('asset/'+emojiMap[k].img);
    }
    var html = '';
    result.forEach(item => {
        html += '<img src="'+item+'"/>';
    });
    $('#emoji_wrapper').html(html);
});
console.log(emojiMap);