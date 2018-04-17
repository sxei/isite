

/**
 * 全局的提示样式
 */
$.extend(
{
	tip: function(info, color, time)
	{
		$.fn.jBox('Notice', 
		{
			content: info,//要显示的内容
			autoClose: (time || 2) * 1000,//自动消失时间
			fade: 100,//显示和淡化动画时间
			animation: 'slide',//动画方式，可选：zoomIn, zoomOut, pulse, move, slide, flip, tada
			//audio: '${jBox}audio/beep1',//播放的音频，暂时貌似有bug，只能播放一次，注意不需要.mp3的后缀
			theme1: 'NoticeBorder', //主题
			color: color || 'red' // 颜色，可选：black, red, green, blue, yellow
		});
	}
});

$.fn.extend(
{
	/**
	 * 初始化某个select下拉框的默认option
	 * @param val 要选中的option的value值，不传则读取“data-select-value”的属性
	 */
	initSelect: function(val)
	{
		this.each(function()
		{
			// 注意这里不能用children，因为还可能存在optgroup
			$(this).find('option[value="'+(val || this.dataset.selectValue)+'"]').prop('selected', true);
		});
	}
});
$(function()
{
	$('select[data-select-value]').initSelect();
});




;(function($)
{

	$.fn.extend(
	{
		/**
		 * 简单的markdown生成TOC工具，这个只是生成toc代码，具体页面展示自己去实现
		 * 会自动修正一些不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
		 * @start 2016-07-10
		 * @last 2016-07-18
		 * @author lxa
	 	 */
		getMarkdownTOC: function()
		{
			// list存放[[标题层级，标题ID，标题名称]]
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');
			if(elements.length == 0) return '';
			for(var i=0; i<elements.size(); i++)
			{
				var obj = elements[i];
				var level = parseInt(obj.nodeName.substr(1)); // 提取h1~h6中的数字
				// 这一步是为了修正一些可能不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
				for(var j = (list[list.length-1] || [0])[0] + 1; j<level; j++) list.push([j, '', '']);
				list.push([level, obj.id, $(obj).text()]);
			}
			var target = $('<div></div>').appendTo($(document.createDocumentFragment()));
			var level, lastOl, html, parent;
			for(var i=0; i<list.length; i++)
			{
				level = list[i][0];
				html = '<li><a href="#'+list[i][1]+'">'+list[i][2]+'</a></li>';
				parent = level <= 1 ? target : target.find('ol[data-level="'+(level-1)+'"]:last > li:last');
				lastOl = parent.children('ol[data-level="'+level+'"]:last');
				if(lastOl.length == 0) lastOl = $('<ol data-level="'+(level)+'"></ol>').appendTo(parent);
				lastOl.append(html);
			}
			return '<div class="markdown-toc">' + target.html() + '</div>';
		},
		/**
		 * 给H1-H6添加数字导航，如1.3.6
		 * 注意，必须在getMarkdownTOC()方法之后调用本方法，否则获取到的内容会有多余的类似“1.2.1”这样的东西
		 */
		addNumberBeforeHeaderline: function(ignoreH1)
		{
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');			
			for(var i=0; i<elements.size(); i++)
			{
				var level = parseInt(elements[i].nodeName.substr(1)); // 提取h1~h6中的数字
				// 这一步是为了修正一些可能不正确的写法，比如H1后面紧跟H3，那么我们将在中间自动补上H2
				for(var j = (list[list.length-1] || [0])[0] + 1; j<level; j++) list.push([j, -1]);
				list.push([level, i]);
			}
			var h = []; // 记录每一个层级最高的索引
			for(var i=0; i<list.length; i++)
			{
				var level = list[i][0];
				var result = '';
				h[level] = (h[level] || 0) + 1; // 从0开始自增
				for(var j=level+1; j<=6; j++) h[j] = 0; // 例如，h2自增后，h2后面的h3-h6都要归零
				for(var j=1; j<=level; j++) result += h[j] + '.';
				if(ignoreH1 && level == 1) continue;
				$(elements[list[i][1]]).prepend(result + ' ');
			}
		},
		/**
		 * 初始化当前内容滚动监听
		 */
		initScroll: function()
		{
			var list = [], elements = this.find('h1,h2,h3,h4,h5,h6');
			if(elements.length == 0) return;
			for(var i=0; i<elements.size(); i++)
			{
				var obj = elements[i];
				list.push([obj.id, getAbsolutePosition(obj).top]);
			}
			list.sort(function(a, b)
			{
				if(a[1] < b[1]) return -1;
				if(a[1] > b[1]) return 1;
				return 0;
			});
			var _target = undefined;
			$(window).on('scroll', function(e)
			{
				refresh();
			});
			function refresh()
			{
				var top = document.body.scrollTop;
				var target = undefined;
				for(var i=0; i< list.length; i++)
				{
					if(list[i][1] >= (top + 20))
					{
						target = list[i][1] == top ? list[i][0] : (i > 0 ? list[i-1][0] : list[i][0]);
						break;
					}
				}
				if(!target) target = list[list.length-1][0];
				if(target == _target) return;
				_target = target;
				$('.markdown-nav-content a.active').removeClass('active');
				var obj = $('.markdown-nav-content [href="#'+target+'"]');
				obj.addClass('active');
				var markdownNav = $('.markdown-nav-content')[0]; // 滚动目标
				var top = getPositionUntil(obj[0], markdownNav).top;
				var height = $('.markdown-nav-content').height();
				var scrollTop = top - (height/2);
				markdownNav.scrollTop = scrollTop < 0 ? 0 : scrollTop;
			}
			refresh();
			function getAbsolutePosition(elem)
			{
			    if(elem == null) return {left: 0, top: 0, width: 0, height: 0};
			    var left = elem.offsetLeft,
			        top = elem.offsetTop,
			        width = elem.offsetWidth,
			        height = elem.offsetHeight;
			    while(elem = elem.offsetParent)
			    {
			        left += elem.offsetLeft;
			        top += elem.offsetTop;
			    }
			    return {left: left, top: top, width: width, height: height};
			}
			
			function getPositionUntil(elem, until)
			{
			    if(elem == null) return {left: 0, top: 0, width: 0, height: 0};
			    var left = elem.offsetLeft,
			        top = elem.offsetTop,
			        width = elem.offsetWidth,
			        height = elem.offsetHeight;
			    while(true)
			    {
			    	elem = elem.offsetParent;
			    	if(!elem || elem == until) break;
			        left += elem.offsetLeft;
			        top += elem.offsetTop;
			    }
			    return {left: left, top: top, width: width, height: height};
			}
			
		},
		initMarkdownTOC: function(context)
		{
			context = context || $('body');
			var toc = context.getMarkdownTOC();
			var storageId = 'is_show_markdown_toc';
			if(!toc) return;
			var html = '<div class="markdown-nav-wrapper hide">'+
							'<div class="markdown-nav-sidebar"></div>'+
							'<div class="markdown-nav-content">'+
								'<div class="title">文章目录：</div>'+
								toc+
							'</div>'+
							'<div class="markdown-nav-btn"><i class="fa fa-list-ul" title="显示或隐藏文章目录"></i></div>'+
						'</div>';
			this.append(html);
			$('.markdown-nav-btn > .fa').on('click', function()
			{
				var obj = $(this).parents('.markdown-nav-wrapper');
				obj.toggleClass('hide');
				localStorage[storageId] = (!obj.hasClass('hide')) + '';
			});
			$(window).on('load', function()
			{
				context.initScroll();
			});
			function refreshScroll()
			{
				// 这里注意，比较新的浏览器 document.body.scrollTop 一直都返回0
				var top = document.documentElement.scrollTop;
				if(top <= 100) $('.markdown-nav-wrapper').addClass('hide');
				else if(localStorage[storageId]!='false') $('.markdown-nav-wrapper').removeClass('hide');
			}
			refreshScroll();
			$(window).on('scroll', function(e)
			{
				refreshScroll();
			});
		}
	});
})(jQuery);


/**
 * 滚到顶部小插件，依赖jQuery和font-aswome
 * @start 2016-08-18
 * @author lxa
 */
;(function($)
{
	$.initGotoTop = function()
	{
		var obj = $('<i class="click-to-top fa fa-arrow-up" style="display:none;"></i>');
		obj.appendTo($('body'));
		obj.on('click', function(){ document.body.scrollTop = 0; });
		$(window).on('scroll', function(e)
		{
			obj.css('display', document.body.scrollTop > 100 ? 'block' : 'none');
		});
	};
	$(function(){ $.initGotoTop(); });
})(jQuery);




/**
 * 图片懒加载插件，与绝大多数同类插件不同的是，本插件同时支持img的src和div的背景图懒加载
 * 将图片以背景图的方式展示到div的好处是可以轻松实现图片不变形，所以背景图懒加载的需求还是比较常见的
 * 使用方法：将页面中展示图片的div或者img的图片地址以data-lazy-src="xxx"形式指定
 * 然后引入本JS即可，无需任何其他代码，支持动态生成内容的懒加载，但是每次动态增加内容之后需主动调用一句：
 * $(window).scroll();
 * @start 2016-08-18
 * @last 2016-09-08
 * @author lxa
 */
;(function($)
{
	$(window).on('scroll resize load', function(e)
	{
		var notFoundCount = 0, maxNotFound = 2, screenHeight = $(window).height();
		$('[data-lazy-src]').each(function()
		{
			var pos = this.getBoundingClientRect();
			if(pos.bottom <= 0) return true; // 如果当前图片在视野上方，继续往下查找
			if(pos.top >= screenHeight) return (notFoundCount++) < maxNotFound; // 如果连续超过 maxNotFound 张图片都在视野下方，停止查找，注意只有从上到下的图片布局才能这样判断
			var src = this.dataset.lazySrc;
			if(!src) return;
			if(this.nodeName === 'IMG') this.src = src;
			else this.style.backgroundImage = 'url(' + src + ')';
			this.removeAttribute('data-lazy-src');
		});
	});
})(jQuery);



// 双击Ctrl搜索
$(function()
{
	// 顶部搜索
	$('#top_search').on('keydown', function(e)
	{
		if(e.keyCode == 13) // 13 为回车键
		{
			var kw = this.value;
			if(kw) location.href = 'search?kw='+kw;
		}
	});
	var lastCtrlTime = 0;
	$(window).on('keyup', function(e)
	{
		if(e.keyCode == 17) // 17为ctrl键
		{
			if(lastCtrlTime == 0) lastCtrlTime = Date.now();
			else
			{
				if((Date.now() - lastCtrlTime) < 300 && !$('#ctrl_search_mask').hasClass('show')) 
				{
					$('#ctrl_search_mask').css('display', 'block');
					$('#ctrl_search_mask input').val('').focus(); //清空上一次搜索结果
					$('#ctrl_search_mask').addClass('show');
				}
				lastCtrlTime = 0;
			}
		}
	});
	$('#ctrl_search_mask').click(function(e)
	{
		var target = e.target;
		// 点击黑色遮罩隐藏搜索
		if(target.id == 'ctrl_search_mask')
		{
			$('#ctrl_search_mask').removeClass('show');
			setTimeout(function()
			{
				$('#ctrl_search_mask').css('display', 'none');
			}, 400);
		}
	});
	$('#ctrl_search_mask input').on('keydown', function(e)
	{
		if(e.keyCode == 27) // 27为esc
		{
			$('#ctrl_search_mask').removeClass('show');
			setTimeout(function()
			{
				$('#ctrl_search_mask').css('display', 'none');
			}, 400);
		}
		else if(e.keyCode == 13)
		{
			var kw = this.value;
			if(kw) location.href = 'search?kw='+kw;
		}
	})
});


//登录
function login()
{
	var uid = $('#login_uid').val();
	var password = $('#login_password').val();
	var savePwd = $('#login_save_pwd').prop('checked');
	if(!uid) {notice('账号不能为空！'); return;}
	if(!password) {notice('密码不能为空！'); return;}
	$.post('login',{uid: uid, password: password, savePwd: savePwd}, function(data)
	{
		if(!data.success) $.tip(data.text);
		else location.reload();
	});
}

//退出
function exit()
{
	$.post('exit', function(data)
	{
		if(!data.success) $.tip(data.text);
		else location.reload();
	});
}

$(function()
{
	$('#jbox_modal_login').jBox('Modal',
	{
		width: 360,
		height: 180,
		title: '登录',
		//overlay: false,//是否显示半黑色背景，默认为true
		content: $('#jbox_modal_login_content'),
		draggable: 'title'
	});
	$('#jbox_modal_update_password').jBox('Modal',
	{
		width: 400,
		height: 220,
		title: '修改密码',
		//overlay: false,//是否显示半黑色背景，默认为true
		content: $('#jbox_modal_update_password_content'),
		draggable: 'title'
	});
});
function delBlog(id)
{
	if(confirm('确定要删除吗？'))
	{
		$.post('del_blog?id='+id, function(data)
		{
			if(!data || !data.success) alert('删除失败！');
			else location.reload();
		});
	}
}
//后门，双击 您的位置 显示登录按钮
$('.your_position').on('click', function()
{
	$('#jbox_modal_login').css('display', 'block');
});

function updatePassword()
{
	var oldPwd = $('#update_password_old').val();
	var newPwd = $('#update_password_new').val();
	var newPwd2 = $('#update_password_new2').val();
	if(!oldPwd || !newPwd || !newPwd2)
	{
		notice('不能留空！');
		return;
	}
	if(newPwd !== newPwd2)
	{
		notice('两次密码不一致！');
		return;
	}
	if(newPwd.length <6)
	{
		notice('新密码长度至少是6位！');
		return;
	}
	$.post('update_password',{oldPassword: oldPwd, newPassword: newPwd}, function(data)
	{
		if(!data.success) notice(data.text);
		else
		{
			notice('修改密码成功！请重新登录！');
			setTimeout(exit, 1500);
		}
	});
}



;(function()
{
	   if(/from=xa/g.test(location.href))
    {
        var dom = document.createElement('div');
        dom.className = 'jump-tip';
        dom.innerHTML = '<p>温馨提示：</p>为了便于记忆，即日起本站开始启用全新域名：http://haoji.me (好记么)，旧域名会自动跳转至新域名！<a href="javascript:;">×</a>';
        dom.querySelector('a').addEventListener('click', function(e)
        {
            dom.style.transform = 'translateY(-110%)';
        });
        setTimeout(function()
        {
            dom.style.transform = 'translateY(-110%)';
        }, 10*1000);
        document.body.appendChild(dom);
        setTimeout(function()
        {
            dom.style.transform = 'translateY(0%)';
        }, 200);
    }
})();

