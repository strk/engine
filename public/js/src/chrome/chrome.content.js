Wu.Chrome.Content = Wu.Chrome.extend({

	_initialize : function () {

		console.log('chrome.content');
	},


	initLayout : function () {

	},

	_addEvents : function () {

		var trigger = this.options.trigger;
		if (trigger) {
			Wu.DomEvent.on(trigger, 'click', this.show, this);
		}

		Wu.DomEvent.on(window, 'resize', this._windowResize, this);
	},

	_removeEvents : function () {
		Wu.DomEvent.off(window, 'resize', this._windowResize, this);
	},

	_windowResize : function () {

	},

	show : function () {
		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');
	},

	hide : function () {
		this._container.style.display = 'none';
		Wu.DomUtil.removeClass(this.options.trigger, 'active-tab');
	},

	hideAll : function () {
		if (!this.options || !this.options.parent) return console.log('hideAll not possible');

		var tabs = this.options.parent.getTabs();
		for ( var t in tabs ) {
			var tab = tabs[t];
			tab.hide();
		}

	},

	_projectSelected : function (e) {
		var p = e.detail.projectUuid;
		if (!p) return;

		// set project
		this._project = app.activeProject = app.Projects[p];

		// refresh pane
		this._refresh();
	},


	_refresh : function () {

	},

	_initLayout_activeLayers : function () {

		// active layer wrapper
		var wrap = Wu.DomUtil.create('div', 'chrome chrome-content styler-content active-layer wrapper', this._container);

		// title
		var title = Wu.DomUtil.create('div', 'chrome chrome-content active-layer title', wrap, 'Layer');
		
		// create dropdown
		var selectWrap = Wu.DomUtil.create('div', 'chrome chrome-content active-layer select-wrap', wrap);
		var select = this._select = Wu.DomUtil.create('select', 'active-layer-select', selectWrap);

		// get layers
		var layers = this._project.getPostGISLayers();

		console.log('got pg layerS: ', layers);

		// placeholder
		var option = Wu.DomUtil.create('option', '', select);
		option.innerHTML = 'Select a layer to style...';
		option.setAttribute('disabled', '');
		option.setAttribute('selected', '');


		// fill select options
		layers.forEach(function (layer) {
			var option = Wu.DomUtil.create('option', 'active-layer-option', select);
			option.value = layer.getUuid();
			option.innerHTML = layer.getTitle();
		});	

		// select event
		Wu.DomEvent.on(select, 'change', this._selectedActiveLayer, this); // todo: mem leak?

	},

	opened : function () {
	},

	closed : function () {
		console.log('i was also closed!', this);
	},


});


// ┌─┐┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐┌─┐
// └─┐├┤  │  │ │││││ ┬└─┐
// └─┘└─┘ ┴  ┴ ┴┘└┘└─┘└─┘

Wu.Chrome.Content.SettingsSelector = Wu.Chrome.Content.extend({

	options : {
		tabs : {
			styler : {
				enabled : true,
				text : 'Style Editor'
			},
			layers : {
				enabled : true,
				text : 'Layers'
			},
			tooltip : {
				enabled : true,
				text : 'Tooltip'
			},
			cartocss : {
				enabled : true,
				text : 'CartoCSS & SQL'
			},
		}
	},

	_initialize : function () {

		this._initContainer();

		this.initLayout();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content settingsSelector', this.options.appendTo);

		// tabs wrapper
		this._tabsWrapper = Wu.DomUtil.create('div', 'chrome chrome-content settings-tabs-wrapper', this.options.appendTo);

	},

	initLayout : function () {

		// title
		this._title = Wu.DomUtil.create('div', 'chrome chrome-content settings-title', this._container, 'Settings');

		// tabs
		this._initTabs();
	},

	getTabs : function () {
		return this._tabs;
	},

	_initTabs : function () {

		// tabs object
		this._tabs = {};

		// button wrapper
		this._buttonWrapper = Wu.DomUtil.create('div', 'chrome chrome-content settings-button-wrapper', this._container);
		
		// create tabs
		for ( var o in this.options.tabs) {
			if (this.options.tabs[o].enabled) {
				console.log('o: ', o);

				var text = this.options.tabs[o].text;

				var tab = o.camelize();

				console.log('tab: ', tab);

				// create tab contents
				if (Wu.Chrome.Content[tab]) {

					// create tab button
					var trigger = Wu.DomUtil.create('div', 'chrome chrome-content settings-button', this._buttonWrapper, text);

					// create content
					this._tabs[tab] = new Wu.Chrome.Content[tab]({
						options : this._options,
						trigger : trigger,
						appendTo : this._tabsWrapper,
						parent : this
					});
				}
			}
		}

		console.log('this._tabs: ', this._tabs);
	},

	show : function () {

	},

	hide : function () {
		console.log('hiding tab!');
	},

	opened : function () {
		console.log('i was opened!', this._tabs);
		this._tabs['Styler'].show();

	},

	closed : function () {
		console.log('i was closed!');

		for ( var t in this._tabs) {
			this._tabs[t].closed();
		}
	},

	_refreshAll : function () {

		for ( var t in this._tabs) {
			console.log('refreshhhh', t);
			this._tabs[t]._refresh();
		}
	},

});



// ┌─┐┌┬┐┬ ┬┬  ┌─┐┬─┐
// └─┐ │ └┬┘│  ├┤ ├┬┘
// └─┘ ┴  ┴ ┴─┘└─┘┴└─

Wu.Chrome.Content.Styler = Wu.Chrome.Content.extend({

	_initialize : function () {

		console.log('chrome.content styleeditor');

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content styler', this.options.appendTo);
	},

	_initLayout : function () {
		if (!this._project) return;
  
		// active layer
		this._initLayout_activeLayers();

		// mark as inited
		this._inited = true;
	},

	_refresh : function () {

		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._container.innerHTML = '';
	},


	
	// event run when layer selected 
	_selectedActiveLayer : function (e) {

		var layerUuid = e.target.value;
		console.log('selected layer: ', layerUuid);

		var layer = this._project.getLayer(layerUuid);

		// get current style, returns default if none
		var style = layer.getEditorStyle();

		console.log('currentStyle: ', style);

		// init style json
		this._initStyle(style);
	},

	_initStyle : function (style) {
		console.log('currentstyle: ', style);

	},


	_createField : function (json) {



	},


	show : function () {

		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');
	},



});


// ┬  ┌─┐┬ ┬┌─┐┬─┐┌─┐
// │  ├─┤└┬┘├┤ ├┬┘└─┐
// ┴─┘┴ ┴ ┴ └─┘┴└─└─┘

Wu.Chrome.Content.Layers = Wu.Chrome.Content.extend({

	_initialize : function () {

		console.log('chrome.content layers');

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content layers', this.options.appendTo);

	},

	_initLayout : function () {

	},

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
	},



	open : function () {
		console.log('open!', this);
	}

});



// ┌─┐┌─┐┬─┐┌┬┐┌─┐┌─┐┌─┐┌─┐
// │  ├─┤├┬┘ │ │ ││  └─┐└─┐
// └─┘┴ ┴┴└─ ┴ └─┘└─┘└─┘└─┘

Wu.Chrome.Content.Cartocss = Wu.Chrome.Content.extend({

	_initialize : function () {

		console.log('chrome.content carto');

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content cartocss', this.options.appendTo);
	},

	_initLayout : function () {

		// active layer
		this._initLayout_activeLayers();

		// wrapper
		this._codewrap = Wu.DomUtil.create('input', 'chrome chrome-content cartocss code-wrapper', this._container);

		// sql editor
		this._createSqlEditor();
		
		// carto editor
		this._createCartoEditor();

		// add shortkeys
		this._setKeymap();

		// create refresh button
		this._createRefresh();

		// insert titles
		this._createTitles();

		// hide by default
		this._hideEditors();

		// set sizes
		this._updateDimensions();

		// mark as inited
		this._inited = true;

	},

	_refresh : function () {

		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._removeKeymaps();
		this._removeEvents();
		this._cartoEditor = null;
		this._SQLEditor = null;
		this._container.innerHTML = '';
	},


	_cleanup : function () {
		// select nothing from dropdown
		// clear carto, sql
		// hide
		// unbind keys
		if (this._select) this._select.selectedIndex = 0;
		this._cartoEditor && this._cartoEditor.setValue('');
		this._SQLEditor && this._SQLEditor.setValue('');
		this._hideEditors();
		this._removeKeymaps();
		this._removeEvents();
	},

	_removeEvents : function () {

		// Wu.DomEvent.off(window, 'resize', this._windowResize, this);

	},

	_createTitles : function () {
		
		// create
		this._cartotitle = Wu.DomUtil.create('div', 'chrome chrome-content cartocss title');
		this._cartotitle.innerHTML = 'CartoCSS';
		this._sqltitle = Wu.DomUtil.create('div', 'chrome chrome-content cartocss title');
		this._sqltitle.innerHTML = 'SQL';
		
		// insert
		var c = this._cartoEditor.getWrapperElement();
		c.parentElement.insertBefore(this._cartotitle, c);

		// insert
		var s = this._SQLEditor.getWrapperElement();
		s.parentElement.insertBefore(this._sqltitle, s);
	},

	_createCartoEditor : function () {

		// editor
		this._cartoEditor = CodeMirror.fromTextArea(this._codewrap, {
    			lineNumbers: true,    			
    			mode: {
    				name : 'carto',
    				reference : window.cartoRef
    			},
    			matchBrackets: true,
    			lineWrapping: false,
    			paletteHints : true,
    			gutters: ['CodeMirror-linenumbers', 'errors']
  		});

	},

	_createSqlEditor : function () {


		// editor
		this._SQLEditor = CodeMirror.fromTextArea(this._codewrap, {
    			lineNumbers: true,    			
    			mode: {
    				name : 'text/x-sql',
    			},
    			matchBrackets: true,
    			lineWrapping: false,
    			paletteHints : true,
    			gutters: ['CodeMirror-linenumbers', 'errors']
  		});

	},

	_setKeymap : function () {

		this._keymap = {
			"Cmd-S": function(cm){
				this._updateStyle();
			}.bind(this),
			"Ctrl-S": function(cm){
				this._updateStyle();
			}.bind(this),
			"Cmd-R": function(cm){
				this._refreshLayer();
			}.bind(this),
			"Ctrl-R": function(cm){
				this._refreshLayer();
			}.bind(this)
		}

		this._cartoEditor.addKeyMap(this._keymap);
		this._SQLEditor.addKeyMap(this._keymap);

		
		// keymaster('⌘+r, ctrl+r', function(){
		// 	this._refreshLayer();
		// 	return false;
		// }.bind(this));

		// keymaster('⌘+s, ctrl+s', function(){
		// 	this._updateStyle();
		// 	return false;
		// }.bind(this));

	},

	_removeKeymaps : function () {
		this._cartoEditor && this._cartoEditor.removeKeyMap(this._keymap);
		this._SQLEditor && this._SQLEditor.removeKeyMap(this._keymap);
		if (keymaster.unbind) keymaster.unbind('⌘+s, ctrl+s');
		if (keymaster.unbind) keymaster.unbind('⌘+r, ctrl+r');
	},

	

	_updateDimensions : function () {
		if (!this._cartoEditor) return;

		// get dimensions
		var dims = app.Chrome.Right.getDimensions();

		// set sizes
		var carto = this._cartoEditor.getWrapperElement();
		if (carto) {
			carto.style.width = dims.width + 'px';
			carto.style.height = (dims.height/3*2) - 150 + 'px';
		}

		// set sizes
		var sql = this._SQLEditor.getWrapperElement();
		if (sql) {
			sql.style.width = dims.width + 'px';
			sql.style.height = (dims.height/3*1) - 220 + 'px';
		}
	},

	_windowResize : function () {
		this._updateDimensions();
		app._map.invalidateSize();
	},

	_createRefresh : function () {

		var text = (navigator.platform == 'MacIntel') ? 'Save (⌘-S)' : 'Save (Ctrl-S)';
		this._refreshButton = Wu.DomUtil.create('div', 'chrome chrome-content cartocss refresh-button', this._container, text);

		Wu.DomEvent.on(this._refreshButton, 'click', this._updateStyle, this);
	},

	_updateStyle : function () {

		console.log('uypdateSTYLE!');

	},

	_updateStyle : function () {

		// return if no active layer
		if (!this._layer) return console.error('no layer');

		// get css string
		var css = this._cartoEditor.getValue();

		// return if empty
		if (!css) return console.error('no css');

		// get sql
		var sql = this._SQLEditor.getValue();
	
		// request new layer
		var layerOptions = {
			css : css, 
			sql : sql,
			layer : this._layer
		}

		this._updateLayer(layerOptions);

	},

	_createSQL : function (file_id, sql) {

		if (sql) {
			// replace 'table' with file_id in sql
			sql.replace('table', file_id);

			// wrap
			sql = '(' + sql + ') as sub';

		} else {
			// default
			sql = '(SELECT * FROM  ' + file_id + ') as sub';
		}
		return sql;
	},

	_updateLayer : function (options, done) {

		var css = options.css,
		    layer = options.layer,
		    file_id = layer.getFileUuid(),
		    sql = options.sql,
		    sql = this._createSQL(file_id, sql),
		    project = this._project;


		var layerOptions = layer.store.data.postgis;

		layerOptions.sql = sql;
		layerOptions.css = css;
		layerOptions.file_id = file_id;		

		var layerJSON = {
			geom_column: 'the_geom_3857',
			geom_type: 'geometry',
			raster_band: '',
			srid: '',
			affected_tables: '',
			interactivity: '',
			attributes: '',
			access_token: app.tokens.access_token,
			cartocss_version: '2.0.1',
			cartocss : css,
			sql: sql,
			file_id: file_id,
			return_model : true,
			layerUuid : layer.getUuid()
		}

		Wu.post('/api/db/createLayer', JSON.stringify(layerJSON), function (err, newLayerJSON) {

			// new layer
			var newLayerStyle = Wu.parse(newLayerJSON);

			console.log('newLayerJSON', newLayerStyle);

			if (newLayerStyle.error) {
				done && done();
				return console.error(newLayerStyle.error);
			}

			layer.setStyle(newLayerStyle.options);

			layer.update({enable : true});

			done && done();
		});

	},

	_refreshLayer : function () {
		console.log('_refreshLayer');
	},

	open : function () {
		console.log('open!', this);
	},

	_selectedActiveLayer : function (e) {

		// get layer
		var layerUuid = e.target.value;
		this._layer = this._project.getLayer(layerUuid);

		// selecting layer in dropdown...
		// .. problems:
		// 1. what if layer is not in layer menu?
		// 2. if not, should it be added?
		// 3. what if user just clicks wrong layer?
		// 4. should actually layers not in layermenu be available in dropdown? (they are now)
		// 5. 
		// ----------
		// SOLUTION: temporarily add layers to map for editing, remove when done editing.


		// refresh
		this._refreshEditor();

		// add layer temporarily to map
		this._tempaddLayer();
	},

	_tempaddLayer : function () {

		console.log('tempaddinglayer!!');

		// remember
		this._temps = this._temps || [];

		// remove other styling layers
		this._tempRemoveLayers();

		// add
		this._layer._addThin();

		// fly to
		// this._layer.flyTo();

		// remember
		this._temps.push(this._layer);

	},

	_tempRemoveLayers : function () {
		if (!this._temps) return;

		// remove other layers added tempy for styling
		this._temps.forEach(function (layer) {
			layer._removeThin();
		}, this);
	},

	opened : function () {

	},

	closed : function () {
		// clean up
		this._tempRemoveLayers();
		this._cleanup();
	},

	_refreshEditor : function () {
		
		// fill editors
		this._refreshCartoCSS();
		this._refreshSQL();

		// show
		this._showEditors();

		// refresh codemirror (cause buggy)
		this._SQLEditor.refresh();
		this._cartoEditor.refresh();
	},

	_refreshCartoCSS : function () {

		// get
		var css = this._layer.getCartoCSS();

		// set
		this._cartoEditor.setValue(css);
	},

	_refreshSQL : function () {

		// get
		var meta = this._layer.getPostGISData();
		var rawsql = meta.sql;
		var table = meta.table_name;
		var sql = rawsql.replace(table, 'table').replace('  ', ' ');

		// remove (etc) as sub
		var sql = this._cleanSQL(sql);

		// set
		this._SQLEditor.setValue(sql);
	
	},

	_cleanSQL : function (sql) {
		var first = sql.substring(0,1);
		var last = sql.slice(-8);

		// if sql is of format (SELECT * FROM table) as sub
		if (first == '(' && last == ') as sub') {
			var clean_sql = sql.substr(1, sql.length -9);
			return clean_sql;
		}

		return sql;
	},

	_showEditors : function () {
		this._SQLEditor.getWrapperElement().style.opacity = 1;
		this._cartoEditor.getWrapperElement().style.opacity = 1;
		this._sqltitle.style.opacity = 1;
		this._cartotitle.style.opacity = 1;
		this._refreshButton.style.opacity = 1;
	},

	_hideEditors : function () {
		this._SQLEditor.getWrapperElement().style.opacity = 0;
		this._cartoEditor.getWrapperElement().style.opacity = 0;
		this._sqltitle.style.opacity = 0;
		this._cartotitle.style.opacity = 0;
		this._refreshButton.style.opacity = 0;
	},

	show : function () {
		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');
	},


});



// ┌┬┐┌─┐┌─┐┬ ┌┬┐┬┌─┐
//  │ │ ││ ││  │ │├─┘
//  ┴ └─┘└─┘┴─┘┴ ┴┴  

Wu.Chrome.Content.Tooltip = Wu.Chrome.Content.extend({



	_initialize : function () {

		console.log('chrome.content styleeditor');

		// init container
		this._initContainer();

		// add events
		this._addEvents();
	},

	_initContainer : function () {

		// create container
		this._container = Wu.DomUtil.create('div', 'chrome chrome-content styler', this.options.appendTo);
		
	},

	_initLayout : function () {

		if (!this._project) return;
  

		// active layer
		this._initLayout_activeLayers();

		// mark as inited
		this._inited = true;
	},

	_refresh : function () {

		this._flush();
		this._initLayout();
	},

	_flush : function () {
		this._container.innerHTML = '';
	},

	// event run when layer selected 
	_selectedActiveLayer : function (e) {

		var layerUuid = e.target.value;
		this._layer = this._project.getLayer(layerUuid);

		// Get stored tooltip meta
		this.tooltipMeta = this._layer.getTooltip();
		
		// Get layermeta
		var layerMeta = JSON.parse(this._layer.store.metadata)

		// If no tooltip meta stored, create from layer meta
		if ( !this.tooltipMeta ) this.tooltipMeta = this.createTooltipMeta(layerMeta);

		this._fieldsWrapper = Wu.DomUtil.create('div', 'chrome-tooltip-field-wrapper', this._container);

		// Init title
		this.initTitle();

		// Init description
		this.initDescription();

		// Initialize fields
		this.initFields();
	},

	initTitle : function () {


		var title = this.tooltipMeta.title;

		// Wrapper
		var sectionWrapper = Wu.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper)		
		
		// Header
		var header = Wu.DomUtil.create('div', 'chrome-content-header', sectionWrapper, 'Title');

		var titleInput = Wu.DomUtil.create('input', 'chrome-content-tooltip-title-field', sectionWrapper)
		    titleInput.id   = 'tooltip-title-input';
		    titleInput.name = 'tooltip-title-input';
		    
		    titleInput.setAttribute('placeholder', this._layer.store.title);

		    if ( title ) titleInput.value = title;

		Wu.DomEvent.on(titleInput, 'blur', this.saveTitle, this);
	},

	initDescription : function () {
	},

	createTooltipMeta : function (layerMeta) {

		// Get columns
		var columns = layerMeta.columns;

		// Returns object with timeseries separated from the other fields
		var splitMetaData = this.buildTimeSeries(columns);

		if ( splitMetaData[1] > 5 ) {
		
			return splitMetaData[0];
		
		} else {

			return this.cleanColumns(columns);
		}

		// return columns;
	},

	// Create clean columns (without time series)
	cleanColumns : function (columns) {

		var metaData = {
			title : '',
			description : false,
			metaFields : {},
			timeSeries : false
		};

		for ( var f in columns ) {
			
			metaData.metaFields[f] = {
					title : false,
					on    : 'on'
			}
		}

		return metaData;
	},

	// Splits metadata into "time series" and "meta fields"
	buildTimeSeries : function (columns) {

		var metaData = {
			title : '',
			description : false,			
			timeSeries : {},
			metaFields : {}
		}
		
		var timeSeriesCount = 0;

		for ( var f in columns ) {

			var _key = f;
			var isTime = this.checkDateFormat(_key);

			// Is time series
			if ( isTime ) {
				
				metaData.timeSeries[_key] = {
						title : false,
						on    : 'on'
				}

				timeSeriesCount ++;

			// Is not time series
			} else {
				
				metaData.metaFields[_key] = {
						title : false,
						on    : 'on'
				};

			}       
		}

		return [metaData, timeSeriesCount];
	},

	initFields : function () {

		// this._fieldsWrapper = Wu.DomUtil.create('div', 'chrome-tooltip-field-wrapper', this._container);
		this.fieldListFromObject('Fields')
		if ( this.tooltipMeta.timeSeries ) this.initTimeSeries();
	},

	fieldListFromObject : function (title, timeSeries) {


		var fields = timeSeries ? this.tooltipMeta.timeSeries : this.tooltipMeta.metaFields;

		var sectionWrapper = Wu.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper)
		var header = Wu.DomUtil.create('div', 'chrome-content-header', sectionWrapper, title);

		for ( var key in fields ) {
			
			var isOn = fields[key].on;
			var title = fields[key].title;

			// Block 
			if ( key == 'enable' || key == 'minmaxRange' || key == 'graphstyle' ) return;

			var options = {
				key 		: key, 
				wrapper 	: sectionWrapper,
				input 		: true,
				title 		: title,
				switch 		: true,
				isOn 		: isOn,
				dropdown	: false,
				rightPos	: false
			}

			this._createMetaFieldLine(options);
		}
	},

	initTimeSeries : function () {

		var timeSeries = this.tooltipMeta.timeSeries;

		// Wrapper
		var sectionWrapper = Wu.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper)		
		
		// Header
		var header = Wu.DomUtil.create('div', 'chrome-content-header', sectionWrapper, 'Time series');
		var headerExtra = Wu.DomUtil.create('span', 'chrome-content-header-gray', header, ' (auto detected)');

		// Enable tims series switch
		var options = {
			key 		: 'enable', 
			wrapper 	: sectionWrapper,
			input 		: false,
			title 		: 'Enable time series',
			switch 		: true,
			dropdown	: false,
			rightPos	: true,
			isOn 		: this.tooltipMeta.timeSeries.enable,
		}
		var enableTimeSeries = this._createMetaFieldLine(options);
		// timeSeries.enable = 'on';
		
		// Use min/max from styling switch
		var options = {
			key 		: 'minmaxRange', 
			wrapper 	: sectionWrapper,
			input 		: false,
			title 		: 'Range',
			switch 		: false,
			dropdown	: false,
			rightPos	: true,			
			miniInput	: true,
			value 		: this.tooltipMeta.timeSeries.minmaxRange,
			isOn 		: true,
		}
		var useMinMaxFromStyle = this._createMetaFieldLine(options)
		// timeSeries.minmax = 'on';

		// Use min/max from styling switch
		var options = {
			key 		: 'graphstyle', 
			wrapper 	: sectionWrapper,
			input 		: false,
			title 		: 'Graph style',
			switch 		: false,
			dropdown	: ['scatter', 'line'],
			rightPos	: true,
			isOn 		: this.tooltipMeta.timeSeries.graphstyle,
		}

		var graphType = this._createMetaFieldLine(options)
		// timeSeries.graphstyle = 'scatter';


		// Create list of time series fields
		this.fieldListFromObject('Time Series Fields', true);
	},

	_createMetaFieldLine : function (options) {

		// _key, wrapper, input, right
		var _key = options.key;
		var wrapper = options.wrapper;
		var input = options.input;
		var right = options.rightPos;
		var _switch = options.switch;
		var isOn = options.isOn;
		var title = options.title;
		var miniInput = options.miniInput;

		console.log('options', options);

		var fieldWrapper = Wu.DomUtil.create('div', 'chrome-tooltip-metafield-line', wrapper);
		
		// Create switch
		if ( _switch ) {
	
			// Create classname
			var 		    _class = 'chrome-switch-container';
			if ( isOn == 'on' ) _class += ' switch-on';
			if ( right ) 	    _class += ' right-switch';

			// Create button
			var fieldSwitch = Wu.DomUtil.create('div', _class, fieldWrapper);
			    fieldSwitch.setAttribute('key', _key);
			    fieldSwitch.id = 'field_switch_' + _key;

			// Set on/off state
			if ( isOn == 'on' ) fieldSwitch.setAttribute('state', 'on');			    

			// Add hooks
			Wu.DomEvent.on(fieldSwitch, 'click', this.toggleSwitch, this);		    

		}

		if ( miniInput ) {

			var _miniInput = Wu.DomUtil.createId('input', 'field_mini_input_' + _key, fieldWrapper);
			    _miniInput.className = 'chrome-tooltip-field-mini-input';
			    _miniInput.setAttribute('placeholder', 'auto');

			    if ( options.value ) _miniInput.value = options.value;

			Wu.DomEvent.on(_miniInput, 'blur', this.saveMiniBur, this);

		}

		// Create input field
		if ( input ) {

			var fieldName = Wu.DomUtil.createId('input', 'field_input_' + _key, fieldWrapper);
			    fieldName.className = 'chrome-tooltip-field-input';
			    fieldName.setAttribute('name', 'field_input_' + _key);
			    fieldName.setAttribute('placeholder', _key);

			    if ( title ) fieldName.value = title;

			    Wu.DomEvent.on(fieldName, 'blur', this.saveFromBlur, this);
		
		// Create "normal" text line
		} else {

			var fieldName = Wu.DomUtil.create('div', 'chrome-tooltip-field-line', fieldWrapper);
			    fieldName.innerHTML = title ? title : _key;
		}
	},

	toggleSwitch : function (e) {

		var on = e.target.getAttribute('state');
		var key = e.target.getAttribute('key');

		if ( on == 'on') {
			
			e.target.setAttribute('state', 'off');
			Wu.DomUtil.removeClass(e.target, 'switch-on');

			var isOn = 'off';

		} else {

			e.target.setAttribute('state', 'on');
			Wu.DomUtil.addClass(e.target, 'switch-on');

			var isOn = 'on';
		}	

		this._saveTooltipMeta(key, '', isOn)
	},

	saveTitle : function (e) {

		this.tooltipMeta.title = e.target.value;
		this._layer.setTooltip(this.tooltipMeta);
	},

	saveFromBlur : function (e) {
		
		var key   = e.target.id.substring(12, e.target.id.length);
		var value = e.target.value;
		
		var thisSwitch = Wu.DomUtil.get('field_switch_' + key);
		var thisSwitchState = thisSwitch.getAttribute('state');

		var on = thisSwitchState ? 'on' : 'off';

		this._saveTooltipMeta(key, value, on);
	},

	saveMiniBur : function (e) {

		var key   = e.target.id.substring(17, e.target.id.length)
		var value = e.target.value;

		this._saveTooltipMeta(key, false, value);

	},

	_saveTooltipMeta : function (_key, title, on) {

		var titleField = Wu.DomUtil.get('field_input_' + _key);
		var title      = titleField ? titleField.value : false;

		// If no title, set to false
		if ( !titleField ) var title = false 
		else 	           var title = titleField.value
			

		if ( _key == 'enable' || _key == 'minmaxRange' || _key == 'graphstyle' ) {
			
			// Update object
			this.tooltipMeta.timeSeries[_key] = on;

			// Save to server
			this._layer.setTooltip(this.tooltipMeta);

			return;
		}

		// Check if key is date	
		var keyIsDate = this.checkDateFormat(_key);
		
		// If key is date, try to update timeseries
		if ( keyIsDate ) var timeUpdated = this.updateTimeSeriesMeta(_key, title, on);
		
		// If key is not date, or could not be found in time series, go through metafields
		if ( !timeUpdated || !keyIsDate ) this.updateMeta(_key, title, on);
	
		// Save to server
		this._layer.setTooltip(this.tooltipMeta);
	},

	updateTimeSeriesMeta : function (_key, title, on) {

		var timeSeries = this.tooltipMeta.timeSeries;
		var hit = false;

		for ( var f in timeSeries ) {

			if ( f == _key ) {

				timeSeries[f].title = title;
				timeSeries[f].on = on;			

				hit = true
			}
		}

		return hit;

	},

	updateMeta : function (_key, title, on) {

		var metaFields = this.tooltipMeta.metaFields;

		for ( var f in metaFields ) {

			if ( f == _key ) {

				metaFields[f].title = title;
				metaFields[f].on = on;


				return;
			}
		}
	},	

	checkDateFormat : function (_key) {

		if ( _key.length != 8 ) return false;		
		var _m = moment(_key, ["YYYYMMDD", moment.ISO_8601]).format("MMM Do YY");		
		if ( _m == 'Invalid date' ) return false;
		return true;
	},

	show : function () {
		
		if (!this._inited) this._initLayout();

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		Wu.DomUtil.addClass(this.options.trigger, 'active-tab');
	},



});



