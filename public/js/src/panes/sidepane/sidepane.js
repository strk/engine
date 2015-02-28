Wu.SidePane = Wu.Class.extend({
	_ : 'sidepane', 

	initialize : function (options) {
		
		this.options = options || app.options;

		this.initContainer();
		this.initContent();
		this.render();     
		
		return this;   
	},

	
	initContainer: function () {

		// create container
		var className = 'q-editor-container';
		this._container = Wu.DomUtil.create('div', className, Wu.app._appPane);
		
		// toggle panes button
		this.paneOpen = false; // default
		this.whichPaneOpen = 'projects';

		// Mobile option ~ Back button when entering documents/datalibrary/users fullscreen
		if ( Wu.app.mobile ) {

			this._mobileFullScreenCloser = Wu.DomUtil.create('div', 'q-editor-fullscreen-mobile-close displayNone', this._container);
			Wu.DomEvent.on(this._mobileFullScreenCloser, 'mousedown', this.closeMobileFullscreen, this);
		}		

	},

	closeMobileFullscreen : function () {

		if ( app.SidePane.fullscreen ) {

			Wu.app._editorMenuPane.style.opacity = 1; // .q-editor-content
			Wu.DomUtil.addClass(app.SidePane._mobileFullScreenCloser, 'displayNone'); // Hide back button
			Wu.DomUtil.removeClass(app._mapPane, "map-blur"); // remove map blurring
			Wu.DomUtil.removeClass(Wu.app._active, 'show'); // Hide current active fullpane
			
			app.SidePane.fullscreen = false;

		}

	},

	initContent : function () {
		
		// menu pane
		var className = 'q-editor-menu';
		Wu.app._editorMenuPane = Wu.DomUtil.create('menu', className, this._container); 

		// content pane
		var className = 'q-editor-content hide-menu displayNone';
		app._editorContentPane = Wu.DomUtil.create('content', className, this._container); 

		// menuslider
		app._menuSlider = Wu.DomUtil.createId('div', 'menuslider', Wu.app._editorMenuPane);
		app._menuSliderArrow = Wu.DomUtil.createId('div', 'menuslider-arrow', Wu.app._menuSlider);	// refactor app

		
	},
	
	render : function () {
		var pane = this.options.panes;

		// render sidepanes
		if (pane.clients) 	this.Clients 	  = new Wu.SidePane.Clients();
		if (pane.mapOptions) 	this.Map 	  = new Wu.SidePane.Map();		// Options
		if (pane.documents) 	this.Documents 	  = new Wu.SidePane.Documents();
		if (pane.dataLibrary) 	this.DataLibrary  = new Wu.SidePane.DataLibrary();
		if (pane.mediaLibrary) 	this.MediaLibrary = new Wu.SidePane.MediaLibrary();
		if (pane.users) 	this.Users 	  = new Wu.SidePane.Users();
		if (pane.share) 	this.Share 	  = new Wu.SidePane.Share();
		if (pane.account) 	this.Account 	  = new Wu.SidePane.Account();

	},

	calculateHeight : function () {


		var header = app.HeaderPane;
		var height = header.getHeight();

		// set minimum width
		if (!height) height = 80;

		// set height
		this._minHeight = 0;
	},

	setHeight : function (height) {

		this._container.style.height = height + 'px';
	},

	collapse : function () {
		
		// calculate
		this.calculateHeight();
		
		// set height
		this.setHeight(this._minHeight);

		// close menu panes if open
		this.closePane();

		// deactivte submenus
		this._deactivate();

	},

	// call _deactivate on all items
	_deactivate : function () {

		if (this.Clients) 	this.Clients._deactivate();
		if (this.Map) 		this.Map._deactivate();
		if (this.Documents) 	this.Documents._deactivate();
		if (this.DataLibrary) 	this.DataLibrary._deactivate();
		if (this.MediaLibrary) 	this.MediaLibrary._deactivate();
		if (this.Users) 	this.Users._deactivate();
		if (this.Share) 	this.Share._deactivate();
		if (this.Account) 	this.Account._deactivate();
	},

	expand : function () {

		// set height of menu
		this._setMenuHeight();

		// open
		this.openPane();
	},

	_setMenuHeight : function () {

		var project = app.activeProject;

		// Button height
		if ( !Wu.app.mobile ) {
			var bHeight = 70;
		} else {
			var bHeight = 50;
		}

		var panes = this._getPaneArray();
		var defaultPanes = app.access.to.edit_user(project) ? 3 : 2;

		if (panes != 0) {
			var height = panes.length * bHeight;
		} else {
			var height = defaultPanes * bHeight;
		}

		app._editorMenuPane.style.height = parseInt(height) + 'px';
	},

	_getPaneArray : function (project) {
		console.log('_getPaneArray', project);
		var project = project || app.activeProject;

		if (!project) return ['Clients', 'Users', 'Account'];

		var panes = [],
		    pane = this.options.panes,
		    settings = project.getSettings(),
		    user = app.Account,
		    canEdit = app.access.to.edit_project(project, user),
		    canManage = app.access.to.edit_user(project, user);


		if (pane.clients) 					panes.push('Clients');
		if (pane.mapOptions 	&& canEdit) 			panes.push('Map'); 
		if (pane.documents   	&& settings.documentsPane) 	panes.push('Documents');
		if (pane.dataLibrary 	&& settings.dataLibrary) 	panes.push('DataLibrary');
		if (pane.MediaLibrary 	&& settings.mediaLibrary) 	panes.push('MediaLibrary');
		if (pane.users 		&& canManage) 			panes.push('Users');
		if (pane.share 		&& settings.socialSharing) 	panes.push('Share');
		if (pane.account) 					panes.push('Account');

		console.log('panes: ', panes);
		return panes;
	},

	setProject : function (project) {
		// update content
		if (this.Home) 		this.Home.updateContent(project);
		if (this.Map) 		this.Map.updateContent(project);
		if (this.Documents) 	this.Documents.updateContent(project);
		if (this.DataLibrary) 	this.DataLibrary.updateContent(project);
	},

	refreshProject : function (project) {

		console.log('refreshProject', project);

		var editMode = project.editMode; // access determined at Wu.Project
		
		// default menus in sidepane
		var panes = this._getPaneArray(project);

		// set menu height
		if (this.paneOpen) this._setMenuHeight();									

		// remove Map pane if not editor
		if (!editMode) _.pull(panes, 'Map');

		if (!app.access.to.edit_user(project)) _.pull(panes, 'Users');

		// refresh
		this.refresh(panes);
	},

	refreshClient : function () {

		console.log('refreshClient')
		
		// set panes 
		var panes = ['Clients'];
		if (app.Account.isManager()) panes.push('Users');
		panes.push('Account'); // logout button

		// refresh
		this.refresh(panes);
	},

	// display the relevant panes
	refresh : function (panes) {
		
		console.log('sidepane.refresh panes: ', panes);

		var panes = panes || this.panes;
		this.panes = [];

		// all panes
		var all = ['Clients', 'Map', 'Documents', 'DataLibrary', 'Users', 'Share', 'Account'], // MediaLibrary
		    sidepane = app.SidePane;

		// panes to active
		all.forEach(function (elem, i, arr) {
			if (!sidepane[elem]) {
				sidepane[elem] = new Wu.SidePane[elem];
			}
			sidepane[elem].enable();
			this.panes.push(elem);	// stored for calculating the menu slider
		}, this);

		// panes to deactivate
		var off = all.diff(panes);
		off.forEach(function (elem, i, arr) {
			var dis = sidepane[elem];
			if (dis)  sidepane[elem].disable();
			_.pull(this.panes, elem);
		}, this);

		if (this.paneOpen) setTimeout(this._setMenuHeight.bind(this), 100); // another ugly hack! todo: refactor to avoid these type errs
			
	},

	_refresh : function () {
		// var panes = Wu.extend([], this.panes);
		var panes = this._getPaneArray();
		this.refresh(panes);
	},
	

	addPane : function (pane) {
		var panes = this._addPane(pane);
		this.refresh(panes);
	},

	_addPane : function (pane) {
		var panes = Wu.extend([], this.panes);
		panes.push(pane);
		panes = _.unique(panes);
		return panes;
	},

	removePane : function (pane) {
		var panes = this._removePane(pane);
		this.refresh(panes);
	},

	_removePane : function (pane) {
		var panes = Wu.extend([], this.panes);
		_.pull(panes, pane);
		return panes;
	},

	// close sidepane
	closePane : function () {

		// return if already closed
		if (!this.paneOpen) return;
		this.paneOpen = false;

		// Close drop down menu
		Wu.app._editorMenuPane.style.height = '0px';

		// Close menu container
		Wu.DomUtil.addClass(app._editorContentPane, 'hide-menu');

		// Make map clickable behind...
		setTimeout(function(){
			Wu.DomUtil.addClass(app._editorContentPane, 'displayNone');	
		}, 300)

		// refresh leaflet
		this._refreshLeaflet();

		// todo: what if panes not there?
		Wu.DomUtil.removeClass(app.SidePane.Documents._content, 'show'); 	// refactorrr
		Wu.DomUtil.removeClass(app.SidePane.DataLibrary._content, 'show');
		Wu.DomUtil.removeClass(app.SidePane.Users._content, 'show');

	},

	_closePane : function () {				// refactor: move to SidePane.Item ... 
		// noop
	},	

	// open sidepane
	openPane : function () {


		// return if already open
		if (this.paneOpen) return;
		this.paneOpen = true;

		// open
		Wu.DomUtil.addClass(app._active, 'show');
		Wu.DomUtil.removeClass(app._editorContentPane, 'displayNone');

		// Have to set a micro timeout, so that it doesn't mess with the displayNone class above
		setTimeout(function() {
			Wu.DomUtil.removeClass(app._editorContentPane, 'hide-menu');
		}, 10)

		// refresh leaflet
		this._refreshLeaflet();

		if ( Wu.app.mobile ) this.openOnMobile();
		
	},

	// By Jørgen ~ Do not open full screen panes
	openOnMobile : function () {

		if ( app._activeMenuItem == 'documents' || app._activeMenuItem == 'dataLibrary' || app._activeMenuItem == 'users') {
			app.SidePane.Clients.activate();	
		}
	},

	widenContainer : function () {
		this._container.style.width = '100%';
	},

	_refreshLeaflet : function () {
		setTimeout(function() {
			var map = Wu.app._map;
			if (map) map.reframe();
		}, 300); // time with css
	},

	
});