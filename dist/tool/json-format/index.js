webpackJsonp([0],{

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);

function formatJSON(json)
{
	json = typeof json == 'string' ? json : $('#input_content').val();
	if(!json) return;
	var result = xei.formatJSON(json, $('#format_json_indent').val(), !$('#format_json_new_line').prop('checked'));
	$('#output_content').val(result);
}
$('#btn_format_json').on('click', formatJSON);
$('#btn_paste_test').on('click', function()
{
	var testJson = '{"retcode":0,"retmsg":"ok","total_num":45,"total_page":4,"page":1,"result_rows":[{"operator":"test","op_type":"定时配置","op_details":"删除定时配置//操作流水","create_time":"2017-02-02 12:32:34"},{"operator":"test","op_type":"添加产品","op_details":"添加人脸识别","create_time":"2017-02-02 12:32:34"},{"operator":"test","op_type":"流量配置","op_details":"修改流量配置","create_time":"2017-02-02 12:32:34"}]}';
	$('#input_content').val(testJson);
	formatJSON();
});
$('#btn_clear').on('click', function()
{
	$('#input_content').val('');
});
$('#format_json_indent').on('change', formatJSON);
$('#format_json_new_line').on('change', formatJSON);
$('#input_content').on('paste', function(event)
{
	var e = event.originalEvent;
	var json = e.clipboardData.getData('text');
	formatJSON(json);
	// e.preventDefault;
	// return false;
});
/* $('#input_content').on('paste', function(event)
{
	var e = event.originalEvent;
	var json = e.clipboardData.getData('text');
	formatJSON(json);
	e.preventDefault;
	return false;
}); */

/***/ })

},[4]);