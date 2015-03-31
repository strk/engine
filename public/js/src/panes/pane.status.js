Wu.StatusPane = Wu.Class.extend({

	_ : 'statuspane', 

	initialize : function (options) {
		
		// set options
		Wu.setOptions(this, options);

		// init container
		this.initContainer();

		// add hooks
		this.addHooks();

	},

	initContainer : function () {

		// create div
		var container 	= this._container 	= Wu.DomUtil.create('div', 'home-container');
		var logo 	= this._logo 		= Wu.DomUtil.create('div', 'home-logo', container);
		var statusWrap 	= this._statusWrap 	= Wu.DomUtil.create('div', 'home-status-wrap', container);
		var status 				= Wu.DomUtil.create('div', 'home-status', statusWrap);
		var statusInner 			= Wu.DomUtil.create('div', 'home-status-inner', status);

		// set default status
		this.clearStatus();

		// add to sidepane if assigned container in options
		if (this.options.addTo) this.addTo(this.options.addTo);

		// add tooltip
		app.Tooltip.add(this._container, 'This is the main menu. Here you can change projects, view documents, download files, etc.', { extends : 'systyle', tipJoint : 'bottom right' });

	},

	addHooks : function () {

		// open sidepane menu on mousedown
		Wu.DomEvent.on(this._container, 'mousedown', this.toggle, this);

		// global TAB key toggle
		// Wu.DomEvent.on(document, 'keydown', this.tab, this);	// todo: fix tabbing in inputs
	},


	tab : function (e) {
		if (e.keyCode == 9) this.toggle();
	},

	toggle : function () {
		this.isOpen ? this.close() : this.open();
	
		// div cleanups to do when hitting home
		this.cleaningJobs();

		// Google Analytics event trackign
		app.Analytics.ga(['Status Pane', 'toggle']);
	},

	cleaningJobs: function () {

		// make sure layermenu edit is disabled
		var layerMenu = Wu.app.MapPane.getControls().layermenu;
		if (layerMenu) layerMenu.disableEdit();

		// close all open options
		if (app.SidePane.Options) app.SidePane.Options.closeAll();
	},

	// open sidepane menu
	open : function (e) {

		this.isOpen = true;
		
		// expand sidepane
		if (app.SidePane) app.SidePane.expand();

		// check 
		this.checkMapBlur();
		this.setContentHeights();

		// trigger activation on active menu item
		app._activeMenu._activate();

		// Hide button section and Layer info when the Home dropdown menu opens (j)
		this._hideTopleftControlCorner();

		// close layermenu edit if open  
		var layermenuControl = app.MapPane.getControls().layermenu;
		if (layermenuControl) layermenuControl.disableEdit();

		// Face out startpane if it's open
		if (app.StartPane.isOpen) this._fadeOutStartpane();

		// Mobile option
		if (app.mobile) this._openMobile();

	},

	// close sidepane menu
	close : function (e) {

		this.isOpen = false;

		// collapse sidepane
		if (app.SidePane) app.SidePane.collapse();

		var descriptionControl = app.MapPane.getControls().description;

		// removes the blur on map if it's set by one of the fullpanes
		Wu.DomUtil.removeClass(app.MapPane._container, "map-blur");

		// Show button section and Layer info when the Home dropdown menu opens (j)
		this._showTopleftControlCorner();

		// Face out startpane if it's open
		if (app.StartPane.isOpen) this._fadeInStartpane();

		// Mobile option : activate default sidepane on close to avoid opening in fullscreen
		if (app.mobile) this._closeMobile();


		// // Only open the description box if there is anything inside of it
		// if (descriptionControl && descriptionControl.activeLayer) {
		// 	if (descriptionControl.activeLayer.store.description == '' || !descriptionControl.activeLayer.store.description ) {
		// 		descriptionControl.hide();
		// 	}
		// } 
		

	},

	_hideTopleftControlCorner : function () {
		if (app._map) app._map._controlCorners.topleft.style.opacity = 0;
	},

	_showTopleftControlCorner : function () {
		if (app._map) {
			var topleft = app._map._controlCorners.topleft;
		    	topleft.style.opacity = 1;
			topleft.style.display = 'block';
		}
	},

	_fadeOutStartpane : function () {
		app.StartPane._banner.style.opacity = '0.1';
	},

	_fadeInStartpane : function () {
		app.StartPane._banner.style.opacity = '1';
	},

	_openMobile : function () {
		if (!app.MapPane) return;
		
		var layermenuControl = app.MapPane.getControls().layermenu,
		    descriptionControl = app.MapPane.getControls().description,
		    legendsControl = app.MapPane.getControls().legends;

		// Close the Layer Menu control
		if (layermenuControl) {
			layermenuControl.closeLayerPane();
			layermenuControl._openLayers.style.opacity = 0;
		}

		// Close the Legends control
		if (legendsControl) {
			if ( legendsControl._isOpen ) legendsControl.MobileCloseLegends();
			legendsControl._legendsOpener.style.opacity = 0;
		}

		// Close the description control
		if (descriptionControl) {
			if (!descriptionControl._isClosed) descriptionControl.mobileClosePane();
		}
	},

	_closeMobile : function () {
		
		// Show the controllers (has been hidden when a new project is refreshed in projects.js > refresh() )
		app._map._controlContainer.style.opacity = 1;

		if (!app.MapPane) return;

		var layermenuControl = app.MapPane.getControls().layermenu,
		    legendsControl = app.MapPane.getControls().legends,
		    descriptionControl =  app.MapPane.getControls().description;

		if (layermenuControl) 	layermenuControl._openLayers.style.opacity = 1;
		if (legendsControl)	legendsControl._legendsOpener.style.opacity = 1;
		if (descriptionControl) descriptionControl._button.style.opacity = 1;
		
		// Make sure we reset if we're in fullscreen mode (media library, users, etc)
		if (app.SidePane.fullscreen) app.SidePane.Clients.activate();	
	
	},


	

	setContentHeights : function () {

		var clientsPane = app.SidePane.Clients;
		var optionsPane = app.SidePane.Options;

		if (clientsPane) clientsPane.setContentHeight();
		if (optionsPane) optionsPane.setContentHeight();
	},

	checkMapBlur : function () {

		if ( 	app._activeMenuItem == 'documents' || 
			app._activeMenuItem == 'dataLibrary' || 
			app._activeMenuItem == 'users' ) 
		{
			Wu.DomUtil.addClass(app.MapPane._container, "map-blur");
		}

	},

	addTo : function (wrapper, before) {
		// insert first in wrapper
		if (before) {
			wrapper.insertBefore(this._container, wrapper.firstChild);
		} else {
			wrapper.appendChild(this._container);
		}
	},

	setHeight : function (height) {
		// set height
		this._container.style.height = parseInt(height) + 'px';
	},

	// refresh : function () {
	// 	if (!this.project) return;

	// 	// set height to project headerHeight
	// 	var headerHeight = this.project.getHeaderHeight();
	// 	this.setHeight(headerHeight);
	// },

	updateContent : function (project) {

		this.project = project;

		// refresh height
		// this.refresh();

		// collapse errything to just logo
		this.close();
	},

	setStatus : function (message, timer) {
		var that = this;

		// clear last clearTimer
		if (this.clearTimer) clearTimeout(this.clearTimer);

		// create div
		var status 	= Wu.DomUtil.create('div', 'home-status');
		var statusInner = Wu.DomUtil.create('div', 'home-status-inner', status);

		
		// set message
		statusInner.innerHTML = message;
		
		// push onto dom
		this.pushStatus(status);

		// clearTimer
		this.clearTimer = setTimeout(function () {
			that.clearStatus();
		}, timer || 3000);
	
	},

	// set 3000ms save status
	setSaveStatus : function (delay) {
		this.setStatus('Saved!', delay);
	},

	pushStatus : function (div) {

		// get old status div, insertBefore
		var old = this._statusWrap.firstChild;
		this._statusWrap.insertBefore(div, old);
		
		// wait 50ms for div to enter DOM
		setTimeout(function () {

			// add in class
			Wu.DomUtil.addClass(div, 'status-in');

			// after css effects done (250ms);
			setTimeout(function () {
				// remove old
				Wu.DomUtil.remove(old);
			}, 250);
		}, 50);
	},

	clearStatus : function () {
		// set default string
		var portalName = app.getPortalName();
		
		// do nothing if same
		if (portalName == this.getStatus()) return;

		// set status
		this.setStatus(portalName);
	},

	getStatus : function () {
		return this._statusWrap.firstChild.firstChild.innerHTML;
	},


});