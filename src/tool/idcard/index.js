require('../com/js/tool.js');

var cityMap = cityUtil.getCityMap(all_city_codes);
var allCunty = cityUtil.getAllCuntys(all_city_codes);
var years = [];
var months = [];
var dates = [];
var cuntys = [];

(function()
{
	for(var i=1950; i<2020; i++)
	{
		years.push(i);
	}
	for(var i=1; i<13; i++)
	{
		months.push(xei.fixNumber(i, 2));
	}
	for(var i=1; i<32; i++)
	{
		dates.push(xei.fixNumber(i, 2));
	}
	for(var i in allCunty) cuntys.push(i);
	initSelect('year_list', years);
	initSelect('month_list', months);
	initSelect('date_list', dates);
})();

function initSelect(id, obj, extraOption)
{
	var html = extraOption || $.trim($('#'+id).html());
	obj = obj || {};
	if(obj instanceof Array)
	{
		for(var i=0; i<obj.length; i++)
		{
			html += '<option value="'+obj[i]+'">'+obj[i]+'</option>';
		}
	}
	else
	{
		for(var i in obj)
		{
			html += '<option value="'+i+'">'+obj[i].value+'</option>';
		}
	}
	$('#'+id).html(html);
}

// 初始化城市联动
function initCityLiandong()
{
	initSelect('province_list', cityMap, '<option value="">--省(随机)--</option>');
	$('#province_list').on('change', function()
	{
		initSelect('city_list', (cityMap[this.value] || {}).children, '<option value="">--市(随机)--</option>');
	});
	$('#city_list').on('change', function()
	{
		var code = this.value;
		var obj = {};
		if(code)
		{
			obj = cityMap[code.substring(0, 2)+'0000'].children[code].children;
		}
		initSelect('county_list', obj, '<option value="">--县(随机)--</option>');
	});
}
initCityLiandong();
function makeIdCardRandom(province, city, cunty, year, month, date, gender)
{
	var result = '';
	if(!province && !city && !cunty)
	{
		result = xei.getRandom(cuntys);
	}
	year = year || xei.getRandom(years);
	month = month || xei.getRandom(months);
	date = date || xei.getRandom(dates);
	if(gender == 'man') gender = xei.getRandom([1, 3, 5, 7, 9]);
	else if(gender == 'woman') gender = xei.getRandom([2, 4, 6, 8, 0]);
	else gender = xei.getRandom(10);
	result += year + '' + month + '' + date + '' + xei.fixNumber(xei.getRandom(100), 2) + '' + gender;
	result += xei.getIdCardLastChar(result);
	return result;
}
function batchMakeIdCardRandom()
{
	var count = parseInt($('#make_idcard_count').val()) || 100;
	var html = '', temp;
	for(var i=0; i<count; i++)
	{
		temp = makeIdCardRandom();
		html += temp + '：' + getIdCardInfo(temp) + '\n';
	}
	$('#idcard_list').html(html);
}

function getIdCardInfo(idcard)
{
	var result = '';
	if(idcard.length != 18)
	{
		result = '身份证长度必须是18位！';
	}
	else
	{
		var lastChar = xei.getIdCardLastChar(idcard);
		if(lastChar != idcard[17]) result = '身份证不合法，校验码错误，正确校验码为：'+lastChar;
		else
		{
			var gender = idcard.substring(16, 17) % 2 == 0 ? '女' : '男';
			result = '籍贯：' + allCunty[idcard.substring(0, 6)] + '，出身日期：' + idcard.substring(6, 10) + '年' + parseInt(idcard.substring(10, 12)) + '月' + parseInt(idcard.substring(12, 14)) + '日，性别：' + gender;
		}
	}
	return result;
}
$('#btn_validate').on('click', function()
{
	var idcard = $('#input_idcard').val();
	$('#validate_result').html(getIdCardInfo(idcard));
});
$('#btn_random_idcard').on('click', function()
{
	$('#input_idcard').val(makeIdCardRandom());
});
$('#btn_batch_make_idcard').on('click', batchMakeIdCardRandom);
batchMakeIdCardRandom();