Wu.Chrome.SettingsContent.Layers = Wu.Chrome.SettingsContent.extend({


	// INITS
	// INITS
	// INITS		

	_initialize : function () {

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content chrome-pane layers', this.options.appendTo);
	},

	_initLayout : function () {

		if (!this._project) return;

		this._topButtonWrapper = Wu.DomUtil.create('div', 'chrome-layers-top-button-wrapper', this._container);

		// Scroller
		this._midSection = Wu.DomUtil.create('div', 'chrome-middle-section', this._container);
		this._midOuterScroller = Wu.DomUtil.create('div', 'chrome-middle-section-outer-scroller', this._midSection);
		this._midInnerScroller = Wu.DomUtil.create('div', 'chrome-middle-section-inner-scroller', this._midOuterScroller);

		// Inner wrapper
		this._fieldsWrapper = Wu.DomUtil.create('div', 'chrome-field-wrapper', this._midInnerScroller);

		// Init layer/baselayer toggle
		this.initLayerBaselayerToggle();

		// Init Layers
		this.initLayers();

		// mark as inited
		this._inited = true;

		// This fires too late...
		this._mode = 'layer';

	},


	// OTHER UNIVERSALS
	// OTHER UNIVERSALS
	// OTHER UNIVERSALS		

	_refresh : function () {

		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._container.innerHTML = '';
	},
	
	show : function () {

		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');

		// enable edit of layer menu...
		var layerMenu = app.MapPane.getControls().layermenu;
		if (app.access.to.edit_project(this._project)) layerMenu.enableEdit();

	},

	open : function () {
		console.log('open!', this);
	},



	// TOP BUTTONS (BASE LAYERS / LAYERS)
	// TOP BUTTONS (BASE LAYERS / LAYERS)
	// TOP BUTTONS (BASE LAYERS / LAYERS)		


	initLayerBaselayerToggle : function () {

		var wrapper = Wu.DomUtil.create('div',   'chrome-layer-baselayer-toggle', this._topButtonWrapper);
		this.baselayerButton = Wu.DomUtil.create('div', 'chrome-layer-toggle-button chrome-baselayer', wrapper, 'BASE LAYERS');
		this.layerButton = Wu.DomUtil.create('div',     'chrome-layer-toggle-button chrome-layer layer-toggle-active', wrapper, 'LAYERS');

		Wu.DomEvent.on(this.layerButton,     'click', this.toggleToLayers, this);
		Wu.DomEvent.on(this.baselayerButton, 'click', this.toggleToBaseLayers, this);
	},

	toggleToBaseLayers : function () {
		Wu.DomUtil.addClass(this.baselayerButton, 'layer-toggle-active')
		Wu.DomUtil.removeClass(this.layerButton, 'layer-toggle-active')

		Wu.DomUtil.addClass(this._fieldsWrapper, 'editing-baselayers')

		this._mode = 'baselayer';
		this.update();		
	},

	toggleToLayers : function () {
		Wu.DomUtil.removeClass(this.baselayerButton, 'layer-toggle-active')
		Wu.DomUtil.addClass(this.layerButton, 'layer-toggle-active')

		Wu.DomUtil.removeClass(this._fieldsWrapper, 'editing-baselayers')

		this._mode = 'layer';
		this.update();
	},



	// ROLL OUT LAYERS
	// ROLL OUT LAYERS
	// ROLL OUT LAYERS	

	initLayers : function () {

		this._layers = {};

		// return if no layers
	       	if (_.isEmpty(this._project.layers)) return;

	       	this.sortedLayers = this.sortLayers(this._project.layers);

	       	this.sortedLayers.forEach(function (provider) {

	       		var providerTitle = this.providerTitle(provider.key);

	       		var sectionWrapper = Wu.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper)
			var header = Wu.DomUtil.create('div', 'chrome-content-header', sectionWrapper, providerTitle);

	       		provider.layers.forEach(function (layer) {

	       			this.addLayer(layer, sectionWrapper);

	       		}, this);

	       	}, this);

	       	this.update();
	},

	addLayer : function (layer, wrapper) {

		// Get title 
		var layerTitle = layer.getTitle();
		var uuid       = layer.store.uuid;
		var on 	       = false;
		
		// set active or not
		this._project.store.baseLayers.forEach(function (b) {
			if ( uuid == b.uuid ) { on = true; return; } 
		}.bind(this));

		var lineOptions = {
			key 		: uuid,
			wrapper 	: wrapper,
			input 		: false,
			title 		: layerTitle,
			isOn 		: on,
			rightPos	: false,
			type 		: 'switch',
			radio 		: true,
			radioOn		: false
		}

		this._createMetaFieldLine(lineOptions);
	},


	providerTitle : function (provider) {

		if (provider == 'postgis') var title = 'Data Library';
		if (provider == 'mapbox')  var title = 'Mapbox';
		if (provider == 'norkart') var title = 'Norkart';
		if (provider == 'google')  var title = 'Google';
		if (provider == 'osm')     return false;

		// Return title
		return title;
	},

	// sort layers by provider
	sortLayers : function (layers) {

		var keys = ['postgis', 'google', 'norkart', 'geojson', 'mapbox', 'raster'];
		var results = [];
	
		keys.forEach(function (key) {
			var sort = {
				key : key,
				layers : []
			}
			for (var l in layers) {
				var layer = layers[l];

				if (layer) {

					if (layer.store && layer.store.data.hasOwnProperty(key)) {
						sort.layers.push(layer)
					}
				}
			}
			results.push(sort);
		}, this);

		// console.log('SROOTED', results);
		this.numberOfProviders = results.length;
		return results;
	},






	// UPDATE
	// UPDATE
	// UPDATE		

	update : function () {

		console.log('%c update ', 'background: red; color: white;');

		if ( !this._mode ) this._mode = 'layer';

		if ( this._mode == 'baselayer' ) this.markBaseLayerOccupied();
		if ( this._mode == 'layer' )     this.markLayerOccupied();
		
		this.updateSwitches();
		this.updateRadios();
	},


	// MARK BASE LAYERS AS OCCUPIED

	markBaseLayerOccupied : function () {

		// get layers and active baselayers
		var layermenuLayers = this._project.getLayermenuLayers();
		var layers = this._project.getLayers();

		// activate layers
		layers.forEach(function (a) {
			if (a.store) this.activateLayer(a.store.uuid);
		}, this);

		layermenuLayers.forEach(function (bl) {
			var layer = _.find(layers, function (l) { 
				if (!l.store) return false;
				return l.store.uuid == bl.layer; 
			});
			if (layer) this.deactivateLayer(layer.store.uuid);
		}, this);
	},

	// MARK LAYERS AS OCCUPIED

	markLayerOccupied : function () {


		var project = this._project;

		// get active baselayers
		var baseLayers = project.getBaselayers();
		var all = project.getLayers();

		all.forEach(function (a) {
			this.activateLayer(a.store.uuid);
		}, this);

		baseLayers.forEach(function (bl) {
			this.deactivateLayer(bl.uuid);
		}, this);

	},

	// SET LAYER AS NOT OCCUPIED

	activateLayer : function (layerUuid) {

		var id = 'field_wrapper_' + layerUuid;
		var elem = Wu.DomUtil.get(id);

		Wu.DomUtil.removeClass(elem, 'deactivated-layer');

	},

	// SET LAYER AS OCCUPIED

	deactivateLayer : function (layerUuid) {

		var id = 'field_wrapper_' + layerUuid;
		var elem = Wu.DomUtil.get(id);

		Wu.DomUtil.addClass(elem, 'deactivated-layer');

	},


	// TOGGLE RADIOS
	// TOGGLE RADIOS
	// TOGGLE RADIOS	

	// Toggle radio
	toggleRadio : function (e) {

		var elem = e.target;
		this.radioOnOff(elem);

	},

	radioOnOff : function (elem) {
		var state = elem.getAttribute('state');
		state == 'true' ? this.radioOff(elem) : this.radioOn(elem);
	},


	radioOn : function (elem) {

		var id = elem.id;
		var uuid = id.slice(6, id.length);		

		Wu.DomUtil.addClass(elem, 'radio-on');
		elem.setAttribute('state', 'true');

		console.log('%c saveStartLayer ', 'background: red; color: white;')
		console.log('layer id => ', uuid);
		console.log('');		

	},

	radioOff : function (elem) {

		var id = elem.id;
		var uuid = id.slice(6, id.length);

		Wu.DomUtil.removeClass(elem, 'radio-on');
		elem.setAttribute('state', 'false');

		console.log('%c removeStartLayer ', 'background: red; color: white;')
		console.log('layer id => ', uuid);
		console.log('');

	},



	// UPDATE RADIOS
	// UPDATE RADIOS
	// UPDATE RADIOS	


	updateRadios : function () {

	       	this.sortedLayers.forEach(function (provider) {
	       		provider.layers.forEach(function (layer) {
	       			this.updateRadio(layer);
	       		}, this);
	       	}, this);		
	},


	updateRadio : function (layer) {

		// Get title 
		var layerTitle = layer.getTitle();
		var uuid       = layer.store.uuid;
		var layerActive = false;
		

		if ( this._mode == 'baselayer' ) {}

		// Only show radio if layer is active...
		if ( this._mode == 'layer' ) {
			this._project.store.layermenu.forEach(function (b) {
				if ( uuid == b.layer ) { layerActive = true; return; }
			}, this);
		}

		// Get switch
		var s = Wu.DomUtil.get('radio_' + uuid);

		if ( layerActive ) {
			Wu.DomUtil.removeClass(s, 'displayNone');
		} else {
			Wu.DomUtil.addClass(s, 'displayNone');		
		}
	},	


	// UPDATE SWITCHES
	// UPDATE SWITCHES
	// UPDATE SWITCHES

	// Toggle switch
	toggleSwitch : function (e) {

		// get state
		var stateAttrib = e.target.getAttribute('state');
		var on = (stateAttrib == 'true');
		var key = e.target.getAttribute('key');

		if ( on ) {
			e.target.setAttribute('state', 'false');
			Wu.DomUtil.removeClass(e.target, 'switch-on');
			var isOn = false;		

			// Turn off radio
			var radioElem = Wu.DomUtil.get('radio_' + key);
			this.radioOff(radioElem);
			
		} else {
			e.target.setAttribute('state', 'true');
			Wu.DomUtil.addClass(e.target, 'switch-on');
			var isOn = true;
		}	

		// save
		this._saveToServer(key, '', isOn)

		// Update radios
		this.updateRadios();
	},	

	updateSwitches : function () {

	       	this.sortedLayers.forEach(function (provider) {
	       		provider.layers.forEach(function (layer) {
	       			this.updateSwitch(layer);
	       		}, this);
	       	}, this);		
	},

	updateSwitch : function (layer) {

		// Get title 
		var layerTitle = layer.getTitle();
		var uuid       = layer.store.uuid;
		var on 	       = false;
		

		if ( this._mode == 'baselayer' ) {
			// Set active or not
			this._project.store.baseLayers.forEach(function (b) {
				if ( uuid == b.uuid ) { on = true; return; } 
			}.bind(this));
		}

		if ( this._mode == 'layer' ) {
			// set active or not
			this._project.store.layermenu.forEach(function (b) {
				if ( uuid == b.layer ) { on = true; return; }
			}, this);
		}

		// Get switch
		var s = Wu.DomUtil.get('field_switch_' + uuid);

		if ( on ) {
			Wu.DomUtil.addClass(s, 'switch-on');
			s.setAttribute('state', 'true');
		} else {
			Wu.DomUtil.removeClass(s, 'switch-on');
			s.setAttribute('state', 'false');			
		}
	},	

	

	// SAVE
	// SAVE
	// SAVE		

	_saveToServer : function (key, title, on) {

		if ( this._mode == 'baselayer' ) {
			on ? this.enableBaseLayer(key) : this.disableBaseLayer(key);
		} else {
			on ? this.enableLayer(key) : this.disableLayer(key);
		}
	},


	// ENABLE BASE LAYER (AND SAVE)

	enableBaseLayer : function (uuid) {

		var layer = this._project.layers[uuid];

		// Update map	
		if (layer) layer._addTo('baselayer');

		// Save to server
		this._project.addBaseLayer({
			uuid : uuid,
			zIndex : 1,
			opacity : layer.getOpacity()
		});

		this.update();
	},

	// DISABLE BASE LAYER (AND SAVE)

	disableBaseLayer : function (uuid) {		

		var layer = this._project.layers[uuid];

		// Update map
		if (layer) layer.disable(); 

		// Save to server
		this._project.removeBaseLayer(layer);

		this.update();	
	},



	// ENABLE LAYER (AND SAVE)
	enableLayer : function (uuid) {

		var layer = this._project.layers[uuid];

		var layerMenu = app.MapPane.getControls().layermenu;
		layerMenu.add(layer);

	},

	// DISABLE LAYER (AND SAVE)
	disableLayer : function (uuid) {

		console.log(uuid);

		var layer = this._project.layers[uuid];
		var _uuid = layer.store.uuid;

		var layerMenu = app.MapPane.getControls().layermenu;
		layerMenu._remove(_uuid);

	},	
});
