;(function()
{
	var domain = 'xiaoming.com';

	var target = $('#xei-cmt-wrapper');
	if(target.length == 0) return;

	var commentType = target[0].dataset.commentType;
	var commentKey = target[0].dataset.commentKey;

	// 初始化评论结构
	function initCommentBody()
	{
		var html = `
					<div class="xei-cmt-top">
						<a href="javascript:;" class="xei-cmt-count">
							<span>0</span>条评论
						</a>
						<div class="xei-cmt-sort">
							<a href="javascript:;" class="current">最新</a>
							<a href="javascript:;">最早</a>
							<a href="javascript:;">最热</a>
						</div>
					</div>
					<div class="xei-cmt-comments">
						正在加载评论
					</div>
					<div class="xei-cmt-replybox">
						<div class="xei-cmt-avatar">
							<a href="javascript:;" title="xiananliu" target="_blank">
								<img src="//res.${domain}/blog/images/default_avatar.gif"/>
							</a>
						</div>
						<div class="xei-cmt-post-wrapper">
							<textarea placeholder="说点什么吧"></textarea>
							<div class="xei-cmt-post-toolbar">
								<a href="javascript:;" title="插入表情" class="xei-cmt-icon xei-cmt-icon-emoji"></a>
								<a href="javascript:;" class="xei-cmt-post-button">发布</a>
								<a href="javascript:;" class="xei-cmt-post-tip" target="_blank" href="//blog.liuxianan.com/sss.html">本评论系统实现方案</a>
							</div>
						</div>
					</div>`;
		var target = $('#xei-cmt-wrapper');
		target.html(html);
	}

	function queryComment(type, key, page, pageSize)
	{
		page = page || 1;
		pageSize = pageSize || 20;
		$.get('/query_comment_list', {type: type, targetKey: key, page: page, pageSize: pageSize}, function(resp)
		{
			console.log(resp);
			var target = $('#xei-cmt-wrapper .xei-cmt-comments');
			if(resp.code != 0)
			{
				target.html('评论加载失败！');
				return;
			}
			// 总条数
			$('#xei-cmt-wrapper .xei-cmt-count span').html(resp.pb.dataCount);
			var list = resp.pb.dataList;
			if(list.length == 0)
			{
				target.html('暂无评论！');
				return;
			}
			var html = '<ul>';
			for(var i=0; i<list.length; i++)
			{
				var item = list[i];
				html += `
						<li class="xei-cmt-comment">
							<div class="xei-cmt-item">
								<div class="xei-cmt-avatar">
									<a href="javascript:;" title="xiananliu" target="_blank">
										<img src="//image.liuxianan.com"/>
									</a>
								</div>
								<div class="xei-cmt-comment-body">
									<div class="xei-cmt-comment-header">
										<a href="javascript:;">${item.nickname}</a>
									</div>
									<p>${item.content}</p>
									<div class="xei-cmt-comment-footer">
										<span>7月25日</span>
										<a href="javascript:;">
											<span class="xei-cmt-icon xei-cmt-icon-reply"></span>回复
										</a>
										<a href="javascript:;">
											<span class="xei-cmt-icon xei-cmt-icon-like"></span>顶(0)
										</a>
										<a href="javascript:;">
											<span class="xei-cmt-icon xei-cmt-icon-delete"></span>删除
										</a>
									</div>
								</div>
							</div>
						</li>`;
			}
			html += '</ul>';
			target.html(html);
		});
	}

	function initEvent()
	{
		$('#xei-cmt-wrapper .xei-cmt-post-button').click(function()
		{
			var params = 
			{
				type: commentType,
				targetKey: commentKey,
				content: $('#xei-cmt-wrapper textarea').val()
			};
			$.post('/add_comment', params, function(resp)
			{
				console.log(resp);
			});
		});
	}

	$(function()
	{
		initCommentBody();
		initEvent();
		queryComment(commentType, commentKey);
	});

})();



