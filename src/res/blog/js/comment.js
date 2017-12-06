;(function()
{
	// 本评论库依赖jQuery、jBox、xei 3个外部库
	//TODO 邮箱提醒

	if(!window.jQuery || !window.xei || !window.jBox)
	{
		alert('本插件依赖jQuery、xei、jBox这3个插件');
		return;
	}

	var protocol = 'http';
	var domain = 'haoji.me'; // 这个将来要处理一下
	var imagePrefix = `//res.${domain}/blog/images/`;
	var ajaxPrefix = `//blog.${domain}`;
	var defaultAvatar = `${imagePrefix}default_avatar.gif`; // 默认头像
	var weiboAppId = '593718136'; // 微博appId
	var weiboAuthPath= `${protocol}://blog.${domain}/auth_weibo`; // 微博鉴权回调地址
	var qqAppId = '101439209'; // QQ appId
	var qqAuthPath = `${protocol}://blog.${domain}/auth_qq`; // QQ 回调地址

	var target = $('#xei-cmt-wrapper');
	if(target.length == 0)
	{
		console.error('请先在页面准备一个 <div id="xei-cmt-wrapper"></div> ！');
		return;
	}

	var commentType = target[0].dataset.commentType;
	var commentKey = target[0].dataset.commentKey;
	var commentDesc = target[0].dataset.commentDesc || '评论';
	var cookieSortType = 'sort_type';
	var sortType = xei.getCookie(cookieSortType, 'newly'); // 排序方式
	var commentCount = 0; // 评论总条数
	var isSuperAdmin = xei.getCookie('BSESSIONID', '') !== '';
	var loginModal = null;
	var currentReplyId = null;
	var maxCommentDeep = 5; // 评论最多展示的深度，超过的采用回复的方式显示
	// 默认当前用户信息，通过 userInfo.id 是否为空来判断用户是否登录
	var userInfo = 
	{
		avatar: '',
		nickname: '游客',
		website: '/'
	};

	// 初始化评论结构
	function initCommentBody()
	{
		var html = 
			`
			<div class="xei-cmt-toolbar" style="visibility:hidden;display:${isSuperAdmin?'none':'block'}">
				<div>
					<span class="xei-cmt-top-name">${userInfo.nickname}</span>
					<span class="xei-cmt-settings">
						<span>
							<span class="xei-cmt-icon xei-cmt-icon-settings"></span>
							<span>设置</span>
						</span>
						<ul>
							<li><a href="javascript:;" id="xei-cmt-logout">退出登录</a></li>
						</ul>
					</span>
				</div>
			</div>
			`+
			getReplyBoxHtml() +
			`<div class="xei-cmt-top">
				<a href="javascript:;" class="xei-cmt-count">
					<span>0</span>条${commentDesc}
				</a>
				<div class="xei-cmt-sort">
					<a href="javascript:;" data-sort-type="early" class="${sortType=='early'?'current':''}">最早</a>
					<a href="javascript:;" data-sort-type="newly" class="${sortType=='newly'?'current':''}">最新</a>
					<a href="javascript:;" data-sort-type="hot" class="${sortType=='hot'?'current':''}">最热</a>
				</div>
			</div>
			<div class="xei-cmt-comments">
				<p class="comment-tip">正在加载${commentDesc}</p>
			</div>`;
		var target = $('#xei-cmt-wrapper');
		target.html(html);
	}

	function initEvent()
	{
		// 发表评论
		$('#xei-cmt-wrapper').on('click', '.xei-cmt-post-button', function()
		{
			postComment($(this).parent().prev()[0]);
		});

		// 删除评论
		$('#xei-cmt-wrapper').on('click', '[data-del-id]', function()
		{
			if(!confirm('确定要删除该条评论吗？该评论下的所有子评论也都将被删除哦！')) return;
			var id = this.dataset.delId;
			ajax('/del_comment', {id: id}, function(resp)
			{
				if(resp.code == 0)
				{
					updateCommentCount(parseInt(resp.text)); // text放最新的评论条数
					$('#xei-cmt-wrapper [data-cmt-id="'+id+'"]').hide('normal', function()
					{
						$(this).remove();
					});
				}
				else
				{
					error(resp.text);
				}
			});
		});

		// 显示动态评论回复框
		$('#xei-cmt-wrapper').on('click', '[data-reply-id]', function()
		{
			var $parent = $(this).parent();
			var box = $parent.next('.xei-cmt-replybox');
			var parentId = this.dataset.replyId;
			if(currentReplyId != null)
			{
				$('[data-reply-id="'+currentReplyId+'"]').parent().next('.xei-cmt-replybox').remove();
				if(currentReplyId == parentId)
				{
					currentReplyId = null;
					return;
				}
			}
			// 根评论ID
			var rootId = $(this).parents('.xei-cmt-comment:last')[0].dataset.cmtId;
			$parent.after(getReplyBoxHtml(parentId, rootId));
			currentReplyId = parentId;
			$parent.next('.xei-cmt-replybox').find('textarea')[0].focus();
		});

		// 点赞
		$('#xei-cmt-wrapper').on('click', '[data-zan-id]', function(e)
		{
			var obj = this;
			var id = obj.dataset.zanId;
			var hasZan = obj.classList.contains('liked');
			ajax(hasZan ? '/cancel_zan_comment' : '/add_zan_comment', {targetType: 'comment', targetKey: id, type: 'zan'}, function(resp)
			{
				if(resp.code == 0)
				{
					if(hasZan) obj.classList.remove('liked');
					else obj.classList.add('liked');
					obj.querySelector('.zan-count').innerHTML = resp.count;
				}
				else
				{
					if(resp.code == 1) // 已经点过赞
					{
						obj.classList.add('liked');
					}
					error(resp.text);
				}
			}, true);
		});

		// 切换排序方式
		$('#xei-cmt-wrapper [data-sort-type]').click(function(e)
		{
			$('#xei-cmt-wrapper [data-sort-type="'+sortType+'"]').removeClass('current');
			sortType = this.dataset.sortType;
			$(this).addClass('current');
			queryComment();
			xei.setCookie(cookieSortType, sortType);
		});

		// placeholder处理
		$('#xei-cmt-wrapper [placeholder]').click(function(e)
		{
			var placeholder = $(this).attr('placeholder');
			if(placeholder)
			{
				this.dataset.placeholder = placeholder;
				$(this).attr('placeholder', '');
			}
		});
		$('#xei-cmt-wrapper [placeholder]').on('blur', function(e)
		{
			var placeholder = this.dataset.placeholder;
			if(placeholder)
			{
				this.dataset.placeholder = '';
				$(this).attr('placeholder', placeholder);
			}
		});

		// 文本框的回车监听
		$('#xei-cmt-wrapper').on('keyup', 'textarea', function(e)
		{
			if(e.ctrlKey && e.keyCode == 13)
			{
				postComment(this);
			}
		});

		// 退出登录
		$('#xei-cmt-logout').click(function(e)
		{
			// 为了兼容跨域，前端无法删除跨域的cookie，只能交由服务端来删除
			//xei.delCookie('open_token');
			ajax('/open_user_logout', {}, function()
			{
				userInfo = 
				{
					avatar: '',
					nickname: '游客',
					website: '/'
				};
				updateReplyBoxUserInfo();
				queryComment(); //这里重新查询评论主要是为了刷新删除按钮
			});
		});

		// QQ登录
		$('#xei-cmt-wrapper').on('click', '.xei-cmt-icon-qq', function(e)
		{
			qqLogin();
		});

		// 微博登录
		$('#xei-cmt-wrapper').on('click', '.xei-cmt-icon-weibo', function(e)
		{
			weiboLogin();
		});
		
		$('#xei-cmt-wrapper').on('click', '.xei-cmt-page > [data-page]', function(e)
		{
			var page = parseInt(this.dataset.page);
			queryComment(page);
		})

		// 解决跨域消息传递问题
		window.addEventListener('message', function(e)
		{
			console.log(e);
			if(weiboAuthPath.indexOf(e.origin) == 0)
			{
				loginCallback(e.data);
			}
		});

		initQQFaceEvent();
	}

	function qqLogin()
	{
		openWindow(`https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=${qqAppId}&redirect_uri=${encodeURIComponent(qqAuthPath)}&state=ssss`);
	}

	function weiboLogin()
	{
		openWindow(`https://api.weibo.com/oauth2/authorize?client_id=${weiboAppId}&response_type=code&redirect_uri=${encodeURIComponent(weiboAuthPath)}`);
	}

	function queryComment(current, pageSize)
	{
		current = current || 1;
		pageSize = pageSize || 100;
		$.get(ajaxPrefix+'/query_comment_list', {type: commentType, targetKey: commentKey, current: current, pageSize: pageSize, sortType: sortType}, function(resp)
		{
			console.log(resp);
			var target = $('#xei-cmt-wrapper .xei-cmt-comments');
			if(resp.code != 0)
			{
				target.html('评论加载失败！');
				return;
			}
			// 总条数
			updateCommentCount(resp.commentCount);
			// 处理二级以上评论
			var list = parseComments(resp.pb.dataList);
			if(list.length == 0)
			{
				target.html('<p class="comment-tip">暂无评论！</p>');
				return;
			}
			var html = renderComment(list);
			html += renderPage(resp.pb.current, resp.pb.pageCount);
			target.html(html);
		});

		// 渲染所有评论，deep和parent是可选参数
		function renderComment(list, deep, parent)
		{
			deep = deep == undefined ? 1 : deep;
			if(!list || !list.length) return '';
			let deepFlag = deep <= maxCommentDeep;
			var html = deepFlag ? `<ul ${deep==1?'':'class="xei-cmt-children-wrapper"'}>` : '';
			for(var i=0; i<list.length; i++)
			{
				var item = list[i];
				html += getCommentHtml(item, deepFlag, deepFlag ? null : parent);
				html += renderComment(item.children, deep + 1, item);
				html += deepFlag ? '</li>' : '';
			}
			html += deepFlag ? '</ul>' : '';
			return html;
		}

		function renderPage(current, pageCount)
		{
			if(pageCount <= 1) return '';
			var temp = '';
			for(var i=0; i<pageCount; i++) {
				if(i+1 == current) temp += `<span>${current}</span>`;
				else temp += `<a href="javascript:;" data-page="${i+1}">${i+1}</a>`;
			}
			return html = `
				<div class="xei-cmt-page">
					<a href="javascript:;" data-page="1">首页</a>
					${temp}
					<a href="javascript:;" data-page="${pageCount}">尾页</a>
				</div>`;
		}
	}

	// 将普通的评论列表解析成无限循环的父子格式
	function parseComments(comments)
	{
		var result = [], commentMap = {};
		for(var i=0; i<comments.length; i++)
		{
			comments[i].children = [];
			commentMap[comments[i].id] = comments[i];
		}
		for(var i=0; i<comments.length; i++)
		{
			var comment = comments[i];
			if(comment.parentId == null) result.push(comment);
			else 
			{
				var parent = commentMap[comment.parentId];
				parent && parent.children.push(comment);
			}
		}
		return result;
	}

	// 获取某条评论的所有子ID
	function getCommentAllChildId(comment, ids)
	{
		ids = ids || [];
		for(var i=0; i<comment.children.length; i++)
		{
			ids.push(comment.children[i].id);
			getCommentAllChildId(comment.children[i], ids);
		}
		return ids.join(',');
	}

	function postComment(textarea, visitor)
	{
		if(!visitor && !userInfo.id)
		{
			showLogin(textarea);
			return;
		}

		var content = $(textarea).val();
		if(!content)
		{
			error('评论内容不能为空！');
			return;
		}
		
		var parentId = textarea.dataset.parentId;
		var rootId = textarea.dataset.rootId;
		var params = 
		{
			type: commentType,
			targetKey: commentKey,
			content: content,
			parentId: parentId,
			rootId: rootId
		};
		if(visitor) // 如果是访客模式
		{
			params.visitorName = visitor.visitorName || null;
			params.visitorEmail = visitor.visitorEmail || null;
			params.visitorWebsite = visitor.visitorWebsite || null;
		}
		loginModal.textarea = null; // 重置
		ajax('/add_comment', params, function(resp)
		{
			textarea.blur();
			if(parentId) // 如果是二级评论
			{
				var li = $(textarea).parents('li.xei-cmt-comment:first');
				var target = li.children('ul');
				if(!target.length)
				{
					target = $('<ul class="xei-cmt-children-wrapper"></ul>');
					target.appendTo(li);
				}
				addCommentToDom(target, resp.comment);
				$(textarea).parent().parent().remove();
			}
			else
			{
				$(textarea).val('');
				var target = $('#xei-cmt-wrapper .xei-cmt-comments > ul');
				if(!target.length)
				{
					$('#xei-cmt-wrapper .xei-cmt-comments').html('<ul></ul>');
					target = $('#xei-cmt-wrapper .xei-cmt-comments > ul');
				}
				addCommentToDom(target, resp.comment);
			}
			updateCommentCount(++commentCount);
		});
	}

	function updateCommentCount(count)
	{
		commentCount = count;
		$('#xei-cmt-wrapper .xei-cmt-count span').html(commentCount);
	}

	// noEnd表示是否不需要</li> 结尾，只有deep比较大的时候parent才会有值
	function getCommentHtml(item, noEnd, parent)
	{
		return `
			<li class="xei-cmt-comment" data-cmt-id="${item.id}">
				<div class="xei-cmt-item">
					<div class="xei-cmt-avatar">
						<a href="${item.userWebsite || 'javascript:;'}" title="${item.userName}" target="_blank">
							<img src="${fixAvatar(item.userAvatar)}"/>
						</a>
					</div>
					<div class="xei-cmt-comment-body">
						<div class="xei-cmt-comment-header">
							<a href="${item.userWebsite || 'javascript:;'}" target="_blank">${item.userName || ''}</a>
						</div>
						<p>${parent?('<span class="xei-cmt-content-reply">回复 <a href="'+(parent.userWebsite||'javascript:;')+'" target="_blank">'+parent.userName+'</a>：</span>'):''} ${replaceCommentFace(item.content)}</p>
						<div class="xei-cmt-comment-footer">
							<span class="xei-cmt-time" title="${xei.formatDate(item.commentTime)}">${xei.formatDateToFriendly(item.commentTime)}</span>
							<a href="javascript:;" data-reply-id="${item.id}">
								<span class="xei-cmt-icon xei-cmt-icon-reply"></span>回复
							</a>
							<a href="javascript:;" data-zan-id="${item.id}">
								<span class="xei-cmt-icon xei-cmt-icon-like"></span>顶(<span class="zan-count">${item.zan}</span>)
							</a>
							<a href="javascript:;" class="xei-cmt-delete-btn" data-del-id="${item.id}" style="display:${((item.user && item.user.id == userInfo.id) || isSuperAdmin)?'inline':'none'}">
								<span class="xei-cmt-icon xei-cmt-icon-delete"></span>删除
							</a>
						</div>
					</div>
				</div>
			${noEnd?'':'</li>'}`;
	}

	function getReplyBoxHtml(parentId, rootId)
	{
		rootId = rootId || '';
		parentId = parentId || '';
		return `
			<div class="xei-cmt-replybox">
				<div class="xei-cmt-avatar">
					<a href="${userInfo.website || 'javascript:;'}" title="${userInfo.nickname}" target="_blank">
						<img src="${fixAvatar(userInfo.avatar)}"/>
					</a>
					<div class="xei-cmt-nickname">${userInfo.nickname}</div>
				</div>
				<div class="xei-cmt-post-wrapper">
					<textarea placeholder="各位程序猿大大和程序媛妹妹，来都来了，那就说点什么吧~~" data-parent-id="${parentId}" data-root-id="${rootId}"></textarea>
					<div class="xei-cmt-post-toolbar">
						<a href="javascript:;" title="插入表情" class="xei-cmt-icon xei-cmt-icon-emoji"></a>
						<div class="xei-cmt-login-wrapper" style="display:${userInfo.id?'none':'inline-block'}">
							<span class="xei-cmt-login-tip">使用社交账号登录</span>
							<a href="javascript:;" title="使用QQ账号登录" class="xei-cmt-icon-qq"></a>
							<a href="javascript:;" title="使用微博账号登录" class="xei-cmt-icon-weibo"></a>
						</div>
						<a href="javascript:;" class="xei-cmt-post-button">发表</a>
						<span class="xei-cmt-post-tip" style="display:${userInfo.id?'none':'block'}">发表评论前请先登录</span>
					</div>
				</div>
				${getQQFaceHtml()}
			</div>`;
	}

	function initVisitorPost()
	{
		var html = `
			<div id="jbox_modal_visitor_post" style="display:none;">
				<div class="xei-cmt-login-type-select">
					<div><a href="javascript:;" class="btn-qq-login">用QQ账号登录</a></div>
					<div><a href="javascript:;" class="btn-weibo-login"></a></div>
					<div><a href="javascript:;" class="btn-visitor-login">以游客身份评论</a></div>
				</div>
				<form class="xei-cmt-visitor-post-form">
					<p class="top-post-tip">友情提示：以游客身份发表的评论无法删除哦！ <a href="javascript:;" class="back-to-select-login-type">返回继续登录</a></p>
					<div class="xei-cmt-form-group">
						<label for="visitorName">昵称</label>
						<input type="text" id="visitorName" name="visitorName" placeholder="填写一个你喜欢的昵称" value="${xei.getCookie('visitor_name', '')}"/>
						<span class="required-tip">*</span>
					</div>
					<div class="xei-cmt-form-group">
						<label for="visitorEmail">邮箱</label>
						<input type="text" id="visitorEmail" name="visitorEmail" placeholder="不会被公开，仅为了评论收到回复时邮件提醒" value="${xei.getCookie('visitor_email', '')}"/>
					</div>
					<div class="xei-cmt-form-group">
						<label for="visitorWebsite">个人主页</label>
						<input type="text" id="visitorWebsite" name="visitorWebsite" placeholder="填写个人网站或博客地址，仅为了互相学习交流" value="${xei.getCookie('visitor_website', '')}"/>
					</div>
					<div class="xei-cmt-form-group">
						<input type="button" id="visitor_post_comment_btn" value="发表评论"/>
						<span class="visitor-form-post-tip">标 * 为必填项</span>
					</div>
				</form>
			</div>`;
		$(html).appendTo($('body'));
		loginModal = new jBox('Modal',
		{
			attach: $('#xei-cmt-wrapper .xei-cmt-visitor-post'),
			width: 580,
			height: 300,
			title: '请登录',
			overlay: true,//是否显示半黑色背景，默认为true
			content: $('#jbox_modal_visitor_post'),
			draggable: 'title',
			closeButton: 'title'
		});
		$('.xei-cmt-login-type-select .btn-visitor-login').click(function()
		{
			toggleVisitorFormShow(true);
		});
		$('.back-to-select-login-type').click(function()
		{
			toggleVisitorFormShow(false);
		});
		$('.xei-cmt-login-type-select .btn-qq-login').click(function()
		{
			loginModal.close();
			qqLogin();
		});
		$('.xei-cmt-login-type-select .btn-weibo-login').click(function()
		{
			loginModal.close();
			weiboLogin();
		});
		$('#visitor_post_comment_btn').click(function()
		{
			var params =
			{
				visitorName: $('.xei-cmt-visitor-post-form #visitorName').val(),
				visitorEmail: $('.xei-cmt-visitor-post-form #visitorEmail').val(),
				visitorWebsite: $('.xei-cmt-visitor-post-form #visitorWebsite').val(),
			};
			if(params.visitorName && !checkName(params.visitorName))
			{
				error('昵称只能是字母数字或汉字，长度不超过20个哦！');
				return;
			}
			if(params.visitorEmail && !checkEmail(params.visitorEmail))
			{
				error('邮箱格式不合法！');
				return;
			}
			if(params.visitorWebsite && !checkUrl(params.visitorWebsite))
			{
				error('主页地址不合法！');
				return;
			}
			xei.setCookie('visitor_name', params.visitorName || '');
			xei.setCookie('visitor_email', params.visitorEmail || '');
			xei.setCookie('visitor_website', params.visitorWebsite || '');
			postComment(loginModal.textarea, params);
			loginModal.close();
		});
	}

	function toggleVisitorFormShow(flag)
	{
		$('.xei-cmt-visitor-post-form')[flag?'show':'hide']();
		$('.xei-cmt-login-type-select')[!flag?'show':'hide']();
	}

	function showLogin(textarea)
	{
		loginModal.textarea = textarea;
		// toggleVisitorFormShow(false); // 先隐藏游客form
		loginModal.open();
	}

	function checkName(name)
	{
		return /^[a-zA-Z0-9\u2E80-\u9FFF]{1,20}$/.test(name);
	}
	function checkEmail(email)
	{
		return /^[a-zA-Z\d][\w-\.]*@([\da-zA-Z](-[\da-zA-Z])?)+(\.[a-zA-Z]+)+$/g.test(email);
	}
	function checkUrl(url)
	{
		return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
	}
	function getQQFaceHtml()
	{
		var html = '';
		for(var i=0; i<105; i++) {
			html += `<li><a href="javascript:;" data-idx="${i}"></a></li>`;
		}
		return `
			<div class="xei-qq-face-wrapper">
				<div class="face-preview">
					<img />
					<span>微笑</span>
				</div>
				<ul>
					${html}
				</ul>
			</div>`;
	}

	function initQQFaceEvent()
	{
		var currentIdx = -1;
		var emText = ['微笑','撇嘴','色','发呆','得意','流泪','害羞','闭嘴','睡','大哭','尴尬','发怒','调皮','呲牙','惊讶','难过','酷','冷汗','抓狂','吐','偷笑','可爱','白眼','傲慢','饥饿','困','惊恐','流汗','憨笑','大兵','奋斗','咒骂','疑问','嘘','晕','折磨','衰','骷髅','敲打','再见','擦汗','抠鼻','鼓掌','糗大了','坏笑','左哼哼','右哼哼','哈欠','鄙视','委屈','快哭了','阴险','亲亲','吓','可怜','菜刀','西瓜','啤酒','篮球','乒乓','咖啡','饭','猪头','玫瑰','凋谢','示爱','爱心','心碎','蛋糕','闪电','炸弹','刀','足球','瓢虫','便便','月亮','太阳','礼物','拥抱','强','弱','握手','胜利','抱拳','勾引','拳头','差劲','爱你','NO','OK','爱情','飞吻','跳跳','发抖','怄火','转圈','磕头','回头','跳绳','挥手','激动','街舞','献吻','左太极','右太极'];

		$('#xei-cmt-wrapper').on('mousemove', '.xei-qq-face-wrapper a', function(e)
		{
			var idx = parseInt(this.dataset.idx);
			if(idx == currentIdx) return;
			var obj = $('.xei-qq-face-wrapper > .face-preview');
			obj.children('img').attr('src', `${imagePrefix}face/qq/qq_${idx+100}.gif`);
			obj.children('span').html(emText[idx]);
			// 这几个是特殊位置，预览表情需要放到右边去
			if([0, 1, 2, 15, 16, 17, 30, 31, 32].indexOf(idx) >= 0) obj.addClass('right');
			else obj.removeClass('right');
			if(currentIdx < 0) obj.show();
			currentIdx = idx;
		});
		$('#xei-cmt-wrapper').on('mouseleave', '.xei-qq-face-wrapper', function(e)
		{
			var obj = $('.xei-qq-face-wrapper > .face-preview').hide();
			currentIdx = -1;
		});
		$('#xei-cmt-wrapper').on('click', '.xei-cmt-icon-emoji', function(e)
		{
			toggleFaceShow(true, this);
		});

		$('#xei-cmt-wrapper').on('click', '.xei-qq-face-wrapper a', function(e)
		{
			var idx = parseInt(this.dataset.idx);
			var textarea = $(this).parents('.xei-cmt-replybox').find('textarea')[0];
			insertContentAtCursor(textarea, '[qq_'+(idx+100)+']');
			toggleFaceShow(false);
		});

		// 切换表情的显示和隐藏
		function toggleFaceShow(show, target)
		{
			if(target == undefined) target = $('.xei-qq-face-wrapper');
			else target = $(target).parents('.xei-cmt-replybox').children('.xei-qq-face-wrapper');
			target[show?'show':'hide']('normal');
			window[show ? 'addEventListener' : 'removeEventListener']('click', clickOtherHide, true);
		}
		
		// 点击其它地方隐藏
		function clickOtherHide(e)
		{
			var wrapper = $('.xei-qq-face-wrapper')[0];
			var target = e.target;
			var isChild = target == wrapper; // 点击区域是否属于下拉框范围内
			var parent = target;
			while(!isChild && (parent = parent.parentElement)) {
				if(parent == wrapper) {
					isChild = true;
					break;
				}
			}
			if(!isChild) toggleFaceShow(false);
		}
	}

	// 将评论中的表情替换成真实图片
	function replaceCommentFace(text)
	{
		return text.replace(/\[qq_(\d+?)\]/g, `<img src="${imagePrefix}face/qq/qq_$1.gif"/>`);
	}

	function addCommentToDom(target, item)
	{
		var html = $(getCommentHtml(item));
		html.hide(); // 先隐藏
		// 如果是一级评论、并且是按照最新排序，往前插入
		if(sortType == 'newly' && item.parentId == null) target.prepend(html);
		else target.append(html);
		html.show('normal');
	}

	function getUserInfo()
	{
		ajax('/open_user_auth', {}, function(resp)
		{
			if(resp.code == 0) {
				userInfo = resp.user;
				updateReplyBoxUserInfo();
			}
		}, true);
	}

	function fixAvatar(avatar)
	{
		if(!avatar) return defaultAvatar;
		if(/^(http|\/\/)/g.test(avatar)) return avatar;
		return '//res.' + domain + avatar;
	}

	// 更新回复框中的用户信息
	function updateReplyBoxUserInfo()
	{
		var a = $('#xei-cmt-wrapper .xei-cmt-replybox .xei-cmt-avatar a');
		a.attr('href', userInfo.website || '/');
		a.attr('title', userInfo.nickname || '');
		a.children().attr('src', fixAvatar(userInfo.avatar));
		$('#xei-cmt-wrapper .xei-cmt-replybox .xei-cmt-nickname').html(userInfo.nickname);
		$('#xei-cmt-wrapper .xei-cmt-toolbar .xei-cmt-top-name').html(userInfo.nickname);
		// 更新登录按钮
		$('#xei-cmt-wrapper .xei-cmt-replybox .xei-cmt-login-wrapper').css('display', userInfo.id ? 'none' : 'inline-block');
		$('#xei-cmt-wrapper .xei-cmt-replybox .xei-cmt-post-tip').css('display', userInfo.id ? 'none' : 'block');
		$('#xei-cmt-wrapper .xei-cmt-toolbar').css('visibility', userInfo.id ? 'visible' : 'hidden');
	}

	// 登录成功回调
	function loginCallback(resp)
	{
		if(resp.code !== 0)
		{
			error(resp.text);
			return;
		}
		userInfo = resp.user;
		updateReplyBoxUserInfo();
		// 如果弹出登录前用户已经输入内容了，登录成功后自动帮用户点击发表按钮
		var textarea = loginModal.textarea;
		if(textarea && textarea.value)
		{
			postComment(textarea);
		}
		//TODO 刷新删除按钮
	}

	/**
	 * 居中打开新窗口
	 */
	function openWindow(url, width, height)
	{
		width = width || 600;
		height = height || 400;
		var left = (window.screen.width - width) / 2;
		var top = (window.screen.height - height) / 2;
		window.open(url, "_blank", "toolbar=yes, location=yes, directories=no, status=no, menubar=yes, scrollbars=yes, resizable=no, copyhistory=yes, left="+left+", top="+top+", width="+width+", height="+height);
	}
	
	// 将HTML中的实体字符进行转义，例如< 转换成 &lt;
	function escapeHTML(html)
	{
		var temp = document.createElement("div"), text = document.createTextNode(html);
		temp.appendChild(text);
		return temp.innerHTML;
	}

	// 在文本框或者文本域光标处插入文字
	function insertContentAtCursor(input, myValue) {
		// 如果是IE浏览器
		if (document.selection) {
			input.focus();
			sel = document.selection.createRange();
			sel.text = myValue;
			sel.select();
		}
		// FireFox、Chrome等
		else if (input.selectionStart || input.selectionStart == '0') {
			var startPos = input.selectionStart;
			var endPos = input.selectionEnd;
			// 保存滚动条
			var restoreTop = input.scrollTop;
			input.value = input.value.substring(0, startPos) + myValue + input.value.substring(endPos, input.value.length);
			if (restoreTop > 0) {
				input.scrollTop = restoreTop;  
			}
			input.focus();
			input.selectionStart = startPos + myValue.length;
			input.selectionEnd = startPos + myValue.length;
		} else {
			input.value += myValue;
			input.focus();
		}
	}

	function tip(info, color, time)
	{
		$.fn.jBox('Notice', 
		{
			content: info,//要显示的内容
			autoClose: (time || 2) * 1000,//自动消失时间
			fade: 100,//显示和淡化动画时间
			animation: 'slide',//动画方式，可选：zoomIn, zoomOut, pulse, move, slide, flip, tada
			color: color || 'red' // 颜色，可选：black, red, green, blue, yellow
		});
	}

	function error(info)
	{
		tip(info, 'red');
	}
	function success(info)
	{
		tip(info, 'green');
	}
	function warn(info)
	{
		tip(info, 'yellow');
	}

	function ajax(url, data, callback, dealErrorSelf)
	{
		$.ajax(
		{
			url: ajaxPrefix + url,
			// 跨域携带cookie需要手动打开此参数
			xhrFields: {
				withCredentials: true
			},
			type: 'post',
			data: data,
			success: function(resp)
			{
				// 自己处理错误
				if(dealErrorSelf)
				{
					callback(resp);
					return;
				}
				if(resp.code == 0)
				{
					callback(resp);
				}
				else
				{
					error(resp.text);
				}
			}
		});
	}

	$(function()
	{
		initCommentBody();
		initEvent();
		queryComment();
		getUserInfo();
		initVisitorPost();
	});

})();