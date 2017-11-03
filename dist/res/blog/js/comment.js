;(function()
{
	// 本评论库依赖jQuery、xei 2个库
	//TODO 插入删除动画、文字前后台过滤、表情、QQ登录、删除处理、超级管理员登录问题、删除按钮显示与隐藏、点赞、跨域兼容、评论列表隐藏敏感信息

	var protocol = 'http';
	var domain = 'xiaoming.com'; // 这个将来要处理一下
	var defaultAvatar = `//res.${domain}/blog/images/default_avatar.gif`;
	var weiboAppId = '3077921064';
	var weiboAuthPath= `${protocol}://blog.${domain}/auth_weibo`;

	var target = $('#xei-cmt-wrapper');
	if(target.length == 0)
	{
		console.error('请先在页面准备一个 <div id="xei-cmt-wrapper"></div> ！');
		return;	
	}

	var commentType = target[0].dataset.commentType;
	var commentKey = target[0].dataset.commentKey;
	var cookieSortType = 'sort_type';
	var sortType = xei.getCookie(cookieSortType, 'newly'); // 排序方式
	var commentCount = 0; // 评论总条数
	var isSuperAdmin = true;
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
			<div class="xei-cmt-toolbar" style="visibility:hidden;">
				<div>
					<span class="xei-cmt-top-name">${userInfo.nickname}</span>
					<span class="xei-cmt-settings">
						<span class="xei-cmt-icon xei-cmt-icon-settings"></span>
						<span>设置</span>
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
					<span>0</span>条评论
				</a>
				<div class="xei-cmt-sort">
					<a href="javascript:;" data-sort-type="early" class="${sortType=='early'?'current':''}">最早</a>
					<a href="javascript:;" data-sort-type="newly" class="${sortType=='newly'?'current':''}">最新</a>
					<a href="javascript:;" data-sort-type="hot" class="${sortType=='hot'?'current':''}">最热</a>
				</div>
			</div>
			<div class="xei-cmt-comments">
				正在加载评论
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

		// 删除评论，删除功能待改造
		$('#xei-cmt-wrapper').on('click', '[data-del-id]', function()
		{
			if(!confirm('确定要删除该条评论吗？')) return;
			var id = this.dataset.delId;
			$.post('/del_comment', {id: id}, function(resp)
			{
				if(resp.code == 0)
				{
					updateCommentCount(parseInt(resp.text)); // text放最新的评论条数
					$('#xei-cmt-wrapper [data-cmt-id="'+id+'"]').remove();
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
			if(box.length) box.remove(); // 已经有了就移除
			else
			{
				var parentId = this.dataset.replyId;
				// 根评论ID
				var rootId = $(this).parents('.xei-cmt-comment:last')[0].dataset.cmtId;
				$parent.after(getReplyBoxHtml(parentId, rootId));
			}
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

		$('#xei-cmt-wrapper textarea').on('keyup', function(e)
		{
			if(e.ctrlKey && e.keyCode == 13)
			{
				postComment(this);
			}
		});

		$('#xei-cmt-logout').click(function(e)
		{
			xei.delCookie('open_token');
			userInfo = 
			{
				avatar: '',
				nickname: '游客',
				website: '/'
			};
			updateReplyBoxUserInfo();
		});

		// QQ登录
		$('#xei-cmt-wrapper .xei-cmt-icon-qq').click(function(e)
		{
			openWindow(`https://api.weibo.com/oauth2/authorize?client_id=${weiboAppId}&response_type=code&redirect_uri=${websiteProtocol}%3A%2F%2F${websiteDomain}%2Fauth-weibo`)
		});

		// 微博登录
		$('#xei-cmt-wrapper .xei-cmt-icon-weibo').click(function(e)
		{
			openWindow(`https://api.weibo.com/oauth2/authorize?client_id=${weiboAppId}&response_type=code&redirect_uri=${encodeURIComponent(weiboAuthPath)}`);
		});

		window.addEventListener('message', function(e)
		{
			console.log(e);
			if(weiboAuthPath.indexOf(e.origin) == 0)
			{
				loginCallback(e.data);
			}
		});
	}

	function queryComment(page, pageSize)
	{
		page = page || 1;
		pageSize = pageSize || 20;
		$.get('/query_comment_list', {type: commentType, targetKey: commentKey, page: page, pageSize: pageSize, sortType: sortType}, function(resp)
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
			var list = resp.pb.dataList;
			
			// 处理二级以上评论
			list = parseComments(list);

			if(list.length == 0)
			{
				target.html('暂无评论！');
				return;
			}console.log(list)
			var html = renderComment(list);
			target.html(html);
		});

		function renderComment(list, isRoot)
		{
			isRoot = isRoot == undefined ? true : isRoot;
			if(!list || !list.length) return '';
			var html = `<ul ${isRoot?'':'class="xei-cmt-children-wrapper"'}>`;
			for(var i=0; i<list.length; i++)
			{
				var item = list[i];
				html += getCommentHtml(item, true);
				html += renderComment(item.children, false);
				html += '</li>';
			}
			html += '</ul>';
			return html;
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
		var content = $(textarea).val();
		if(!content)
		{
			error('评论内容不能为空！');
			return;
		}
		if(visitor) // 如果以访客模式
		{

		}
		else if(!userInfo.id)
		{
			error('请先点击左边小图标登录，您也可以点击左侧红色链接以游客身份登录。');
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
		$.post('/add_comment', params, function(resp)
		{
			textarea.blur();
			if(resp.code == 0)
			{
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
			}
			else
			{
				error(resp.text);
			}
		});
	}

	function updateCommentCount(count)
	{
		commentCount = count;
		$('#xei-cmt-wrapper .xei-cmt-count span').html(commentCount);
	}

	// noEnd表示是否不需要</li> 结尾
	function getCommentHtml(item, noEnd)
	{
		return `
			<li class="xei-cmt-comment" data-cmt-id="${item.id}">
				<div class="xei-cmt-item">
					<div class="xei-cmt-avatar">
						<a href="${item.userWebsite}" title="${item.userName}" target="_blank">
							<img src="${fixAvatar(item.userAvatar)}"/>
						</a>
					</div>
					<div class="xei-cmt-comment-body">
						<div class="xei-cmt-comment-header">
							<a href="javascript:;">${item.userName || ''}</a>
						</div>
						<p>${item.content}</p>
						<div class="xei-cmt-comment-footer">
							<span class="xei-cmt-time" title="${xei.formatDate(item.commentTime)}">${xei.formatDateToFriendly(item.commentTime)}</span>
							<a href="javascript:;" data-reply-id="${item.id}">
								<span class="xei-cmt-icon xei-cmt-icon-reply"></span>回复
							</a>
							<a href="javascript:;" data-zan-id="">
								<span class="xei-cmt-icon xei-cmt-icon-like"></span>顶(${item.zan})
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
					<a href="${userInfo.website}" title="${userInfo.nickname}" target="_blank">
						<img src="${fixAvatar(userInfo.avatar)}"/>
					</a>
					<div class="xei-cmt-nickname">${userInfo.nickname}</div>
				</div>
				<div class="xei-cmt-post-wrapper">
					<textarea placeholder="客官，来都来了，那就说点什么吧~~" data-parent-id="${parentId}" data-root-id="${rootId}"></textarea>
					<div class="xei-cmt-post-toolbar">
						<a href="javascript:;" title="插入表情" class="xei-cmt-icon xei-cmt-icon-emoji"></a>
						<div class="xei-cmt-login-wrapper" style="display:${userInfo.id?'none':'inline-block'}">
							<span class="xei-cmt-login-tip">使用社交账号登录</span>
							<a href="javascript:;" title="使用QQ账号登录" class="xei-cmt-icon-qq"></a>
							<a href="javascript:;" title="使用微博账号登录" class="xei-cmt-icon-weibo"></a>
						</div>
						<a href="javascript:;" class="xei-cmt-post-button">发表</a>
						<span class="xei-cmt-post-tip" style="display:${userInfo.id?'none':'block'}">发表评论前请先登录，您也可以<a href="javascript:;">以游客身份发表</a></span>
					</div>
				</div>
			</div>`;
	}

	function addCommentToDom(target, item)
	{
		var html = getCommentHtml(item);
		// 如果是一级评论、并且是按照最新排序，往前插入
		if(sortType == 'newly' && item.parentId == null) target.prepend(html);
		else target.append(html);
	}

	function getUserInfo()
	{
		$.get('/open_user_auth', function(resp)
		{
			if(resp.code == 0)
			{
				userInfo = resp.user;
				updateReplyBoxUserInfo();
			}
		});
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

	function loginCallback(resp)
	{
		if(resp.code !== 0)
		{
			error(resp.text);
			return;
		}
		userInfo = resp.user;
		updateReplyBoxUserInfo();
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

	function error(info)
	{
		alert(info);
	}
	function success(info)
	{
		alert(info);
	}
	function warn(info)
	{
		alert(info);
	}
	$(function()
	{
		initCommentBody();
		initEvent();
		queryComment();
		getUserInfo();
	});

})();