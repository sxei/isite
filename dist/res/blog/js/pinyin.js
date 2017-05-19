(function()
{
	var pinyin = {};
	var dict = {}; // 存储所有字典数据
	/**
	 * 解析各种字典文件，所需的字典文件应在本JS之前导入
	 */
	pinyin.parseDict = function()
	{
		if(window.pinyin_dict_full)
		{
			dict.full = {};
			dict.py2hz = pinyin_dict_full;
			for(var i in pinyin_dict_full)
			{
				var temp = pinyin_dict_full[i];
				for(var j=0, len=temp.length; j<len; j++)
				{
					dict.full[temp[j]] = i; // 不考虑多音字
				}
			}
		}
		if(window.pinyin_dict_szm)
		{
			dict.szm = pinyin_dict_szm;
		}
		if(window.pinyin_dict_biaodian)
		{
			dict.biaodian = {};
			var temp = pinyin_dict_biaodian.split(',');
			for(var i=0; i<temp.length; i++)
				dict.biaodian[temp[i].substr(0, 1)] = temp[i].substr(1);
		}
	}
	pinyin.parseDict();

	/**
	 * 根据汉字获取拼音，不支持多音字处理，如果不是汉字直接返回原字符
	 * @param str 要处理的汉字
	 * @param splitter 分割字符，默认空格
	 */
	pinyin.getPinyin = function(str, splitter)
	{
		if(!dict.full)
		{
			console.error('抱歉，未找到拼音数据字典！');
			return str;
		}
		var result = [];
		var lastIsHZ = false;
		for (var i=0, len = str.length; i < len; i++)
		{
			var temp = str.charAt(i);
			var res = dict.full[temp];
			if(lastIsHZ || res) result.push(res || temp);
			else result.push((result.pop()||'')+temp);
			lastIsHZ = !!res;
		}
		return result.join(splitter || ' ');
	};

	/**
	 * 根据汉字获取带标点的拼音，不支持多音字处理，如果不是汉字直接返回原字符
	 * @param str 要处理的汉字
	 * @param splitter 分割字符，默认空格
	 */
	pinyin.getPinyinWithBiaodian = function(str, splitter)
	{
		if(!dict.biaodian)
		{
			console.error('抱歉，未找到拼音数据字典！');
			return str;
		}
		var result = [];
		for (var i=0, len = str.length; i < len; i++)
		{
			var temp = str.charAt(i);
			result.push(dict.biaodian[temp] || temp); 
		}
		return result.join(splitter || ' ');
	};

	/**
	 * 根据拼音获取所有可能的汉字组合
	 */
	pinyin.getHanzi = function(str)
	{
		var result = dict.py2hz[str];
		if(result) return result;
		for(var i in dict.py2hz)
		{
			if(i.indexOf(str) === 0)
				return dict.py2hz[i];
		}
		return result || '';
	};

	/**
	 * 获取汉字的拼音首字母
	 * str 汉字字符串，如果遇到非汉字则原样返回
	 * @param polyphone 是否支持多音字，默认false，如果为true，会返回所有可能的组合数组
	 */
	pinyin.getFirstLetter = function(str, polyphone)
	{
		if(!str) return;
		if(dict.szm)
		{
			var result = [];
			for(var i=0; i<str.length; i++)
			{
				var unicode = str.charCodeAt(i);
				var ch = str.charAt(i);
				if(unicode >= 19968 && unicode <= 40869)
				{
					ch = dict.szm.all.charAt(unicode-19968)
					if(polyphone)
					{
						ch = dict.szm.polyphone[unicode] || ch;
					}
				}
				result.push(ch);
			}
			if(!polyphone) return result.join(''); // 如果不用管多音字，直接将数组拼接成字符串
			else // 处理多音字，此时的result类似于：['D', 'ZC', 'F']
			{
				var temp = [], store = result[0].split('');
				for(var i=1; i<result.length; i++)
				{
					for(var j=0; j<result[i].length; j++)
						for(var k=0; k<store.length; k++)
							temp.push(store[k] + result[i].charAt(j));
					if(temp.length > 0) store = temp;
					temp = [];
				}
				return store;
			}
		}
		else if(dict.full) // 使用这种字典时不支持多音字处理
		{
			var temp = this.getPinyin(str).split(' ');
			var result = '';
			for(var i=0; i<temp.length; i++) result += temp[i].charAt(0).toUpperCase();
			return result;
		}
		else
		{
			console.error('抱歉，未找到拼音数据字典！');
			return str;
		}
	};

	window.pinyin = pinyin;
})();