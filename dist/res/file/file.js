function tip(info) {
	alert(info);
}


$(function() {
	// 如果是文件列表页面
	if(!$('#btn_mkdir').length) return;
	var mkdirMoal = $('#btn_mkdir').jBox('Modal', {
		width: 500,
		height: 180,
		title: '新建文件夹',
		closeButton: 'title',
		content: $('#jbox_modal_mkdir'),
		draggable: 'title',
		onInit: function() {
			$('#jbox_modal_mkdir form').on('submit', function(e) {
				e.preventDefault();
				$.post('/create_directory', $(this).serialize(), function(resp) {
					if(resp.success) location.reload();
					else tip(resp.text);
				});
			});
			$('.hide-mkdir-modal').click(function() {
				mkdirMoal.close();
			});
		}
	});
	$('#fileList').on('click', '[data-dir-del-id]', function() {
		if(!confirm('确定要删除该目录吗？')) return;
		$.post('/delete_directory', {id: this.dataset.dirDelId}, function(resp) {
			if(resp.success) location.reload();
			else tip(resp.text);
		});
	});
	$('#fileList').on('click', '[data-dir-rename-id]', function() {
		var name = prompt('请输入新的目录名称', this.dataset.dirName);
		if(!name) return;
		$.post('/rename_directory', {id: this.dataset.dirRenameId, name: name}, function(resp) {
			if(resp.success) location.reload();
			else tip(resp.text); 
		});
	});
	$('#fileList').on('click', '[data-file-del-id]', function() {
		if(!confirm('确定要删除该文件吗？')) return;
		$.post('/delete_file', {id: this.dataset.fileDelId}, function(resp) {
			if(resp.success) location.reload();
			else tip(resp.text);
		});
	});
	$('#fileList').on('click', '[data-file-rename-id]', function() {
		var name = prompt('请输入要修改的名称', this.dataset.fileName);
		if(!name) return;
		$.post('/rename_file', {id: this.dataset.fileRenameId, name: name}, function(resp) {
			if(resp.success) location.reload();
			else tip(resp.text); 
		});
	});
});

$(function() {
	// 如果是文件上传页面
	if(!$('#dropTarget').length) return;

	var pid = xei.getParamInt('pid');
	if(pid > 0) $('#directory').val(pid);

	var dropTarget = document.getElementById('dropTarget');
	var hiddenHile = document.getElementById('hiddenHile');
	dropTarget.addEventListener('dragover', function(e)
	{
		e.preventDefault();
	});
	dropTarget.addEventListener('dragenter', function(e)
	{
		this.classList.add('allow-drop');
	});
	dropTarget.addEventListener('dragend', function(e)
	{
		this.classList.remove('allow-drop');
	});
	dropTarget.addEventListener('dragleave', function(e)
	{
		this.classList.remove('allow-drop');
	});
	dropTarget.addEventListener('drop', function(e)
	{
		e.preventDefault();
		this.classList.remove('allow-drop');
		readFiles(e.dataTransfer.files);
	});
	hiddenHile.addEventListener('change', function(e) {
		readFiles(this.files);
	});
	var uploadFile;
	function readFiles(files) {
		if(!files.length) return;
		if(files.length > 1) {
			tip('每次最多上传一个文件！');
			return;
		}
		var file = files[0];
		$('#file_name').val(file.name);
		$('#description').val(file.name);
		$('#file_size').val(file.size);
		uploadFile = file;
	}

	$('#uploadForm').on('submit', function(e) {
		e.preventDefault();
		var id = $('#uploadForm input[name="id"]').val();
		// 如果是修改
		if(id) {
			$.post('/update_file', $('#uploadForm').serialize(), function(resp){
				console.log(resp);
				if(resp.success) location.href = `/detail/${id}`;
				else tip(resp.text);
			});
			return;
		}

		// 自有服务器
		if($('#storeType').val() == 'server') {
			var form = new FormData();
			form.append('file', uploadFile);
			$.ajax({
				url: '/upload',
				method: 'POST',
				data: form,
				contentType: false,
				processData: false,
				success: function(resp) {
					console.log(resp);
					if(resp.success) {
						$('#uploadForm input[name="size"]').val(resp.byte);
						$('#uploadForm input[name="fileType"]').val(resp.format);
						$('#uploadForm input[name="path"]').val(resp.url);
						$.post('/add_file', $('#uploadForm').serialize(), function(resp){
							console.log(resp);
							if(resp.success) location.href = `/${pid>0?('?pid='+pid):''}`;
							else tip(resp.text);
						});
					} else {
						tip(resp.text);
					}
				},
				error: function() {
					tip('上传失败！');
				}
			});
		}
	});
});