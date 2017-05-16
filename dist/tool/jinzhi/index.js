webpackJsonp([1],[
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);

function notice(info)
{
	alert(info);
}

(function()
{
	// CNZZ 统计代码
	document.write(unescape("%3Cspan class=\"cnzz-wrapper\" id='cnzz_stat_icon_1257135263'%3E%3C/span%3E%3Cscript src='//s11.cnzz.com/z_stat.php%3Fid%3D1257135263' type='text/javascript'%3E%3C/script%3E"));

})();

/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);


/**
 * JS任意进制转换，输入一个数字，返回的是字符串形式的结果，如果输入不合法，会警告并返回NaN
 * @param num 输入的数字
 * @param input 输入的进制，如10
 * @param out 输出的进制， 如16
 */
function jinzhiConvert(num, input, output)
{
	if(num == '' || !input || !output) return '';
	if(input < 2 || input > 36)
	{
		alert('输入进制只能介于2-36之间！');
		return NaN;
	}
	if(output < 2 || output > 36)
	{
		alert('输出进制只能介于2-36之间！');
		return NaN;
	}
	try
	{
		return parseInt(num, input).toString(output);
	}
	catch(e)
	{
		return NaN;
	}
}
function refresh()
{
	var res = jinzhiConvert($('#number').val(), parseInt($('#input_radix').val()), parseInt($('#output_radix').val()));
	$('#result').html(res);
}
$('#input_radix,#output_radix,#number').on('input', refresh);
refresh();

/***/ })
],[4]);