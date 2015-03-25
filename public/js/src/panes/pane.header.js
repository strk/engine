Wu.HeaderPane = Wu.Pane.extend({
	
	_ : 'headerpane', 

	_initContainer : function () {

		// create divs
		this._container     = app._headerPane = Wu.DomUtil.create('div', '', app._mapContainer);
		this._container.id  = 'header';

		// wrapper for header
		this._logoContainer = Wu.DomUtil.create('div', 'header-logo-container', this._container);
		this._logo 	    = Wu.DomUtil.create('img', 'header-logo', this._logoContainer);
		this._titleWrap     = Wu.DomUtil.create('div', 'header-title-wrap', this._container);
		this._title 	    = Wu.DomUtil.create('div', 'header-title', this._titleWrap);
		this._subtitle 	    = Wu.DomUtil.create('div', 'header-subtitle', this._titleWrap);

		// tooltips
		this._addTooltips();

		// add hooks
		this.addHooks();

		// hide by default
		this._hide();
	},

	// refresh view (ie. on projectSelected)
	_refresh : function () {

		// refresh fields
		this.setLogo();
		this.setTitle();
		this.setSubtitle();

		// make sure is visible
		this._show();
	},

	addHooks : function () {
		// stops
		Wu.DomEvent.on(this._logo, 'mouseover', Wu.DomEvent.stopPropagation, this);
		Wu.DomEvent.on(this._title, 'mouseover', Wu.DomEvent.stopPropagation, this);
	},

	_addTooltips : function () {
		app.Tooltip.add(this._logo, 'Click to upload a new logo');
	},

	_show : function () {
		this._container.style.display = 'block';
	},

	_hide : function () {
		this._container.style.display = 'none';
	},

	setLogo : function (logo) {
		this._logo.src = logo || this._project.getHeaderLogo() ? this._project.getHeaderLogo() :  '/css/images/defaultProjectLogo.png';
	},

	setTitle : function (title) {
		this._title.innerHTML = title || this._project.getHeaderTitle();
	},

	setSubtitle : function (subtitle) {
		this._subtitle.innerHTML = subtitle || this._project.getHeaderSubtitle();
	},

	getContainer : function () {
		return this._container;
	},

	addedLogo : function (path) {
		
		// set path
		var fullpath = '/images/' + path;

		// set new image and save
		this._project.setHeaderLogo(fullpath);

		// update image in header
		this.setLogo();
	},

	_flush : function () {
		this.setTitle(' ');
		this.setSubtitle(' ');
		this.setLogo('/css/images/defaultProjectLogo.png');
	},

});