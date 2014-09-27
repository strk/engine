Wu.SidePane.DataLibrary = Wu.SidePane.Item.extend({

	type : 'dataLibrary',
	title : 'Data',

	initContent : function () {

		// create new fullscreen page, and set as default content
		this._content = Wu.DomUtil.create('div', 'data-library ct1', Wu.app._appPane);
		
		// create container (overwrite default)
		this._container = Wu.DomUtil.create('div', 'editor-wrapper ct1', this._content);

		// create progress bar
		this.progress = Wu.DomUtil.create('div', 'progress-bar', this._content);
		
		// insert template
		this._container.innerHTML = ich.datalibraryContainer();

		// get element handlers
		this._tableContainer = Wu.DomUtil.get('datalibrary-table-container');
	      
		// create fullscreen dropzone
		this.fulldrop = Wu.DomUtil.create('div', 'fullscreen-drop', this._content);

		// filecount
		this.filecount = 0;



		// render empty table
		this._tableContainer.innerHTML = ich.datalibraryTableframe();

		// get elements
		this._table 		= Wu.DomUtil.get('datalibrary-insertrows');
		this._errors 		= Wu.DomUtil.get('datalibrary-errors');
		this._uploader 		= Wu.DomUtil.get('upload-container');
		this._deleter 		= Wu.DomUtil.get('datalibrary-delete-file');
		this._downloader 	= Wu.DomUtil.get('datalibrary-download-files');
		this._downloadList 	= Wu.DomUtil.get('datalibrary-download-dialogue');
		this._checkall 		= Wu.DomUtil.get('checkbox-all');
		this._checkallLabel 	= Wu.DomUtil.get('label-checkbox-all');

		// init table
		this.initList();

		// init dropzone
		this.initDZ();

		// init download table
		this.initDownloadTable();

	},

	// hooks added automatically on page load
	addHooks : function () {
	       
		// download button
		Wu.DomEvent.on(this._downloader, 'mousedown', this.downloadConfirm, this);

		// check all button
		Wu.DomEvent.on(this._checkallLabel, 'mousedown', this.checkAll, this);
	       
	},


	addEditHooks : function () {

		// delete button
		Wu.DomEvent.on(this._deleter, 'mousedown', this.deleteConfirm, this);
		Wu.DomUtil.removeClass(this._deleter, 'displayNone');

	},

	removeEditHooks : function () {

		// delete button
		Wu.DomEvent.off(this._deleter, 'mousedown', this.deleteConfirm, this);
		Wu.DomUtil.addClass(this._deleter, 'displayNone');


	},

	_activate : function () {

		if (this.dz) this.dz.enable();

	},

	_deactivate : function () {
		console.log('deactive sidepane datalib');
		this.dz.disable();
		this.disableFullscreenDZ();
	},

	initDownloadTable : function () {

		var table = ich.datalibraryTableDownload();
		this._downloadList.innerHTML = table;

		// get elems 
		this._downloadOK = Wu.DomUtil.get('download-ok-button');
		this._downloadCancel = Wu.DomUtil.get('download-cancel-button');
	
		// set hooks
		Wu.DomEvent.on(this._downloadOK, 'mousedown', this.downloadFiles, this);
		Wu.DomEvent.on(this._downloadCancel, 'mousedown', this.downloadCancel, this);

	},

	checkAll : function () {

		if (this._checkall.checked) {
			// uncheck all visible
			var visible = this.list.visibleItems;
			visible.forEach(function (item, i, arr) {
				var ch = item.elm.children[0].childNodes[1].children[0];
				// uncheck
				if (ch.checked) ch.checked = false;
			}, this);


		} else {
			// check all visible
			var visible = this.list.visibleItems;
			visible.forEach(function (item, i, arr) {
				var ch = item.elm.children[0].childNodes[1].children[0];
				// check
				if (!ch.checked) ch.checked = true; 
			}, this);
		}
	},

	downloadFiles : function () {

		// create list of uuids only
		var fuuids = [];
		this._downloadFileList.forEach(function (file, i, arr) {
			fuuids.push(file.uuid);
		}, this);

		var json = {
			'files' : this._downloadFileList, //fuuids,
			'puuid' : this.project.store.uuid,
			'pslug' : this.project.store.slug
		}
		var json = JSON.stringify(json);

		// post         path          json      callback           this
		Wu.post('/api/file/download', json, this.receivedDownload, this);

	},

	receivedDownload : function (that, response) {
		// this = window

		// set path for zip file
		var path = '/api/file/download?file=' + response + '&type=zip';
		
		// add <a> for zip file
		that._downloadList.innerHTML = ich.datalibraryDownloadReady({'url' : path});
		var btn = Wu.DomUtil.get('download-ready-button');
		Wu.DomEvent.on(btn, 'click', that.downloadDone, that);

	},

	downloadCancel : function () {

		console.log('downloadCancel!');
		
		// clear download just in case
		this._downloadFileList = [];

		// hide
		this._downloadList.style.display = 'none';
	},

	downloadDone : function () {

		// close and re-init
		this.downloadCancel();
		this.initDownloadTable();
	},

	downloadConfirm : function (e) {

		// get selected files
		var checks = this.getSelected();
		this._downloadFileList = checks;
		
		// do nothing on 0 files
		if (checks.length == 0) { return; }

		// populate download window
		var tr = '';
		checks.forEach(function (file, i, arr) {
			var tmp = Wu.extend({}, file);
			tmp.format = tmp.format.join(', ');     // fix format format
			tr += ich.datalibraryDownloadRow(tmp);
		}, this);

		// get table and insert
		var table = Wu.DomUtil.get('datalibrary-download-insertrows');
		table.innerHTML = tr;

		// show
		this._downloadList.style.display = 'block';
	},

	getSelected : function () {

		// get selected files
		var checks = [];
		this.project.store.files.forEach(function(file, i, arr) {
			var checkbox = Wu.DomUtil.get('checkbox-' + file.uuid);
			if (checkbox) { var checked = checkbox.checked; }
			if (checked) { checks.push(file); }
		}, this);

		return checks;
	},

	deleteConfirm : function (e) {

		// get selected files
		var checks = this.getSelected();
				
		// do nothing on 0 files
		if (checks.length == 0) return; 

		// confirm dialogue, todo: create stylish confirm
		if (confirm('Are you sure you want to delete these ' + checks.length + ' files?')) {    
			this.deleteFiles(checks);
		} 
	},

	deleteFiles : function (files) {
		console.log('deleting ', files);
		
		// iterate over files and delete
		var _fids = [];
		files.forEach(function(file, i, arr) {

			// remove from list
			this.list.remove('uuid', file.uuid);
		
			// remove from local project
			var i;
			for (i = this.project.store.files.length - 1; i >= 0; i -= 1) {
			//this.project.files.forEach(function(f, i, a) {
				if (this.project.store.files[i].uuid == file.uuid) {
					this.project.store.files.splice(i, 1);
				}
			};

			// remove from layermenu                // todo: remove from actual menu div too
			// DO use a reverse for-loop:
			var i;
			for (i = this.project.store.layermenu.length - 1; i >= 0; i -= 1) {
				if (this.project.store.layermenu[i].fuuid == file.uuid) {
					this.project.store.layermenu.splice(i, 1);
				}
			}
			
			// prepare remove from server
			_fids.push(file._id);

		}, this);

		// save changes to layermenu
		this.project._update('layermenu');                                                                                                                                                                                                   
	       
		// remove from server
		var json = {
		    '_fids' : _fids,
		    'puuid' : this.project.store.uuid
		}
		var string = JSON.stringify(json);
		Wu.save('/api/file/delete', string); 

	},


	// list.js plugin
	initList : function () { 
		
		// add dummy entry
		var tr = Wu.DomUtil.createId('tr', 'dummy-table-entry');
		tr.innerHTML = ich.datalibraryTablerow({'type' : 'dummy-table-entry'});
		this._table.appendChild(tr);

		// init list.js
		var options = { valueNames : ['name', 'file', 'category', 'keywords', 'date', 'status', 'type'] };
		this.list = new List('filelist', options);

		// remove dummy
		this.list.clear();
	},

	// is only fired once ever
	initDZ : function () {
		var that = this;

		// create dz
		this.dz = new Dropzone(this._uploader, {
				url : '/api/upload',
				createImageThumbnails : false,
				autoDiscover : false
				// uploadMultiple : true
		});

		// add fullscreen dropzone
		this.enableFullscreenDZ();                                                                                                                                                                   
		
	},

	enableFullscreenDZ : function () {

		// add fullscreen bridge to dropzone
		Wu.DomEvent.on(document, 'dragenter', this.dropping, this);
		Wu.DomEvent.on(document, 'dragleave', this.undropping, this);
		Wu.DomEvent.on(document, 'dragover', this.dragover, this);
		Wu.DomEvent.on(document, 'drop', this.dropped, this);
	},

	disableFullscreenDZ : function () {

		// remove fullscreen bridge to dropzone
		Wu.DomEvent.off(document, 'dragenter', this.dropping, this);
		Wu.DomEvent.off(document, 'dragleave', this.undropping, this);
		Wu.DomEvent.off(document, 'dragover', this.dragover, this);
		Wu.DomEvent.off(document, 'drop', this.dropped, this);

	},

	refreshDZ : function () {
		var that = this;

		// clean up last dz
		this.dz.removeAllListeners();

		// set project uuid for dropzone
		this.dz.options.params.project = this.project.store.uuid;

		// set dz events
		this.dz.on('drop', function () { 
			console.log('drop'); 
		});

		this.dz.on('dragenter', function () { 
			console.log('dragenter'); 
		});

		this.dz.on('addedfile', function (file) { 

			// count multiple files
			that.filecount += 1;

			// show progressbar
			that.progress.style.opacity = 1;

			// show fullscreen file info
			if (!that._fulldrop) {
				that.fullOn();
				that.fullUpOn();
			}
		});


		this.dz.on('complete', function (file) {
			console.log('complete');

			// count multiple files
			that.filecount -= 1;

			// clean up
			that.dz.removeFile(file);
		      
		});

		// this.dz.on('totaluploadprogress', function (progress, totalBytes, totalSent) { 
		//         // set progress
		//         console.log('progress: ', progress);
		//         that.progress.style.width = progress + '%';
		// });

		this.dz.on('uploadprogress', function (file, progress) {
			// set progress
			that.progress.style.width = progress + '%';
		})                                                                                                                                                                                                               

		this.dz.on('success', function (err, json) {
			// parse and process
			var obj = Wu.parse(json);
			if (obj) { that.uploaded(obj); }
		});

		this.dz.on('complete', function (file) {
			console.log('complete!', file);
			console.log('filecount: ', that.filecount);

			if (!that.filecount) {
				// reset progressbar
				that.progress.style.opacity = 0;
				that.progress.style.width = '0%';

				// reset .fullscreen-drop
				that.fullUpOff();
				that.fulldropOff();
				that._fulldrop = false;
			}
		});

	},

	
	// fullscreen when started uploading                                            // TODO: refactor fullUpOn etc..
	fullUpOn : function () {                                                        //       add support for multiple files
		// transform .fullscreen-drop                                           //       bugtest more thourougly
		Wu.DomUtil.addClass(this.fulldrop, 'fullscreen-dropped');
	},
	fullUpOff : function () {
		Wu.DomUtil.removeClass(this.fulldrop, 'fullscreen-dropped');
	},

	// fullscreen for dropping on
	fulldropOn : function (e) {

		// turn on fullscreen-drop
		this.fullOn();
		
		// remember drop elem
		this._fulldrop = e.target.className;
	},
	fulldropOff : function () {
		// turn off .fullscreen-drop
		this.fullOff();
	},

	// fullscreen for dropping on
	fullOn : function () {
		// turn on fullscreen-drop
		this.fulldrop.style.opacity = 0.9;
		this.fulldrop.style.zIndex = 1000;
	},

	fullOff : function () {
		var that = this;
		this.fulldrop.style.opacity = 0;
		setTimeout(function () {        // hack for transitions
			 that.fulldrop.style.zIndex = -10;      
		}, 200);
	},

	dropping : function (e) {
		e.preventDefault();
	    
		// show .fullscreen-drop
		this.fulldropOn(e);
	},

	undropping : function (e) {
		e.preventDefault();
		var t = e.target.className;

		// if leaving elem that started drop
		if (t == this._fulldrop) this.fulldropOff(e);
	},

	dropped : function (e) {
		e.preventDefault();
		
		// transform .fullscreen-drop
		this.fullUpOn();

		// fire dropzone
		this.dz.drop(e);
	},

	dragover : function (e) {
		// needed for drop fn
		e.preventDefault();
	},

	handleError : function (error) {
		console.log('Handling error: ', error);

		var html = '';
		error.forEach(function (err, i, arr) {
			html += err.error;
			html += '<br>';
		})
		this._errors.innerHTML = html;
		this._errors.style.display = 'block';
	},

	// process file
	uploaded : function (record) {
		console.log('Upload done:', record);

		// handle errors
		if (record.errors) {
			if (record.errors.length > 0) this.handleError(record.errors);
		}
		
		// return if nothing
		if (!record.files) return;

		// add files to library
		record.files.forEach(function (file, i, arr) {
			// add to table
			this.addFile(file);
 
			// add to project locally (already added on server)
			this.project.store.files.push(file);
		}, this);

	},

	addFile : function (file) {

		// clone file object
		var tmp = Wu.extend({}, file);   
		
		// add record (a bit hacky, but with a cpl of divs inside the Name column)
		tmp.name = ich.datalibraryTablerowName({
			name : tmp.name || 'Title',
			description : tmp.description || 'Description',
			nameUuid : 'name-' + tmp.uuid,
			descUuid : 'description-' + tmp.uuid,
		});

		// clean arrays
		tmp.files = tmp.files.join(', ');
		tmp.keywords = tmp.keywords.join(', ');
		tmp.createdDate = new Date(tmp.createdDate).toDateString();

		// add file to list.js
		var ret = this.list.add(tmp);
		
		// ugly hack: manually add uuids
		ret[0].elm.id = tmp.uuid;                              // <tr>
		var c = ret[0].elm.children[0].children[0].children;    
		c[0].id = 'checkbox-' + tmp.uuid;                      // checkbox
		c[1].setAttribute('for', 'checkbox-' + tmp.uuid);      // label

		// add hooks for editing file, if edit access
		if (this.project.editMode) {
			this._addFileEditHooks(tmp.uuid);
		} 
	},

	_addFileEditHooks : function (uuid) {

		// get <input>'s
		var title = Wu.DomUtil.get('name-' + uuid);
		var desc = Wu.DomUtil.get('description-' + uuid);

		// set click hooks on title and description
		Wu.DomEvent.on( title,  'mousedown mouseup click', 	this.stop, 	this ); 
		Wu.DomEvent.on( title,  'dblclick', 			this.rename, 	this );     // select folder
		Wu.DomEvent.on( desc,   'mousedown mouseup click', 	this.stop, 	this ); 
		Wu.DomEvent.on( desc,   'dblclick', 			this.rename, 	this );     // select folder

	},

	// to prevent selected text
	stop : function (e) {
		console.log('stop!');   // not working!
		e.preventDefault();
		e.stopPropagation();
	},

	rename : function (e) {

		// enable editing on input box
		e.target.removeAttribute('readonly'); 
		e.target.focus();
		e.target.selectionStart = e.target.selectionEnd;

		// set key
		e.target.fieldKey = e.target.id.split('-')[0];

		// save on blur or enter
		Wu.DomEvent.on( e.target,  'blur', this.editBlur, this );     // save folder title
		Wu.DomEvent.on( e.target,  'keydown', this.editKey, this );     // save folder title

	},


	editKey : function (e) {
		// blur on enter
		if (event.which == 13 || event.keyCode == 13) e.target.blur();
	},

	editBlur : function (e) {

		// get key
		var key = e.target.fieldKey;

		// set back to readonly
		e.target.setAttribute('readonly', 'readonly');                                                                                                                                                                                         
		
		// get file uuid
		var fuuid = e.target.id.replace(key + '-', '');

		// get new title
		var value = e.target.value || e.target.innerHTML;

		// update file in project
		this.project.store.files.forEach(function(file, i, arr) {
			// iterate and find hit
			if (file.uuid == fuuid) file[key] = value;
		}, this);

		// refresh list
		this.list.update();     // todo: funky behavior when changing name, doesn't reflect (ie. sort works on old value)

		// save to server
		this._save(fuuid, key);

	},

	_save : function (fuuid, key) {

		// save the file
		this.project.store.files.forEach(function(file, i, arr) {
		     
			// iterate and find hit
			if (file.uuid == fuuid) {

				// create update object
				var json = {};
				json[key] = file[key];
				json.uuid = file.uuid;

				console.log('##$$$ save ::', key, json);

				// update, no callback
				var string = JSON.stringify(json);
				Wu.save('/api/file/update', string); 
			}
		});
	},

	

	updateContent : function () {
		this.update();
	},

	update : function () {

		// use active project
		this.project = Wu.app.activeProject;

		// flush
		this.reset();

		// refresh dropzone
		this.refreshDZ();

		// refresh table entries
		this.refreshTable();

		if (this.project.editMode) {
			this.addEditHooks();
		} else {
			this.removeEditHooks();
		}

	},

	refreshTable : function () {

		// return if empty filelist
		if (!this.project.store.files) { return; }

		// enter files into table
		this.project.store.files.forEach(function (file, i, arr) {
		       this.addFile(file);
		}, this);

		// sort list by name by default
		this.list.sort('name', {order : 'asc'});
	},

	reset : function () {

		// clear table
		this.list.clear();

		// remove uploading, in case bug
		this.fullOff();
		this.fulldropOff();

	}

});
