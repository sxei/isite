require('../com/js/tool.js');

var outputType = '0';
function getPinyin(value) {
	value = value || $('#input_content').val();
	if(!value) return;
	var result = '';
	switch(outputType) {
		case '0': result = pinyinUtil.getPinyin(value, ' ', true, false); break;
		case '1': result = pinyinUtil.getPinyin(value, ' ', false, false); break;
		case '2': result = pinyinUtil.getFirstLetter(value, false); break;
		default: break;
	}
	$('#output_content').val(result);
}

function getHanzi(value) {
	value = value || $('#input_pinyin').val();
	if(!value) return;
	$('#output_hanzi').val(pinyinUtil.getHanzi(value) || '未能找到对应的汉字');
}

function getPinyinWithTone(value) {
	value = value || $('#input_notone').val();
	if(!value) return;
	$('#output_withtone').val(pinyinUtil.getTone(value));
}

$(function(){
	$('#input_content').on('input', function(e) {
		getPinyin();
	});
	$('#input_content').on('paste', function(event) {
		var e = event.originalEvent;
		var str = e.clipboardData.getData('text');
		getPinyin(str);
	});
	$('[name="output_type"]').on('change', function(e) {
		outputType = this.value;
		getPinyin();
	});
	getPinyin();

	$('#input_pinyin').on('input', function(e) {
		getHanzi();
	});
	$('#input_pinyin').on('paste', function(event) {
		var e = event.originalEvent;
		var str = e.clipboardData.getData('text');
		getHanzi(str);
	});
	getHanzi();

	$('#input_notone').on('input', function(e) {
		getPinyinWithTone();
	});
	$('#input_notone').on('paste', function(event) {
		var e = event.originalEvent;
		var str = e.clipboardData.getData('text');
		getPinyinWithTone(str);
	});
	getPinyinWithTone();
});