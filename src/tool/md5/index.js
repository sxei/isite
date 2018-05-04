require('../com/js/tool.js');

function getMD5(value) {
	value = value || $('#input').val();
	if(!value) return;
	$('#output').val(hex_md5(value));
}


$(function(){
	$('#input').on('input', function(e) {
		getMD5();
	});
	$('#input').on('paste', function(event) {
		var e = event.originalEvent;
		var str = e.clipboardData.getData('text');
		getMD5(str);
	});
	getMD5();
});