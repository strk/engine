L.Control.CartoCSS = L.Control.extend({
	
	options: {
		position : 'topleft' 
	},

	_laidout : false,

	onAdd : function () {

		// create toolbar container
		var container = Wu.DomUtil.create('div', 'leaflet-control-cartocss leaflet-control');
		Wu.DomEvent.on(container, 'click mousedown mouseup', Wu.DomEvent.stopPropagation, this);

		// create toolbar button
		this._toolbarButton = Wu.DomUtil.create('div', 'cartocss-toolbar-button', container);

		// init rest of layout
		this.initLayout();

		// init code mirror
		this.initCodeMirror();

		// add hooks
		this.addHooks();

		// automatically becomes this._container;
		return container;	

	},

	onRemove : function () {

		// remove hooks
		this.removeHooks();

		// remove from DOM
		Wu.DomUtil.remove(this._codeMirror.getWrapperElement());

		// remove from leaflet-control-container
		Wu.DomUtil.remove(this._editorContainer);
	},

	initLayout : function () {

		// create divs
		this._editorContainer 		= Wu.DomUtil.create('div', 'cartocss-control-container'); // editor container
		this._wrapper 			= Wu.DomUtil.create('div', 'cartocss-control-wrapper', this._editorContainer); // the obligatory wrapper
		this._xButton 			= Wu.DomUtil.create('div', 'close-cartocss-editor-x', this._wrapper); // close button
		this._zoomVal 			= Wu.DomUtil.create('div', 'cartocss-zoomval', this._wrapper, app._map.getZoom()); // Show zoom value
		this._styleHeaderWrapper 	= Wu.DomUtil.create('div', 'cartocss-style-header-wrapper', this._wrapper); // create form wrapper
		this._styleHeaderLayerName 	= Wu.DomUtil.create('div', 'cartocss-style-header-layer', this._styleHeaderWrapper);
		this._styleHeaderLayerName.innerHTML = 'Select layer'; 
		this._styleHeaderDropDownButton = Wu.DomUtil.create('div', 'cartocss-style-dropdown-arrow', this._styleHeaderWrapper);
		this._layerSelectorOuter 	= Wu.DomUtil.create('div', 'cartocss-layerselector-outer', this._wrapper); // create layer selector
		this._layerSelector 		= Wu.DomUtil.create('div', 'cartocss-layerselector', this._layerSelectorOuter);
		
		// Tabs
		this._tabsWrapper 		= Wu.DomUtil.create('div', 'cartocss-tab-wrapper', this._wrapper); // Wrapper for tabs
		this._tabStyling 		= Wu.DomUtil.create('div', 'cartocss-tab cartocss-tab-styling cartocss-active-tab', this._tabsWrapper); // Styling tab
						  this._tabStyling.innerHTML = 'Styling';

		this._tabTooltip 		= Wu.DomUtil.create('div', 'cartocss-tab cartocss-tab-tooltip', this._tabsWrapper); // Styling tab		
						  this._tabTooltip.innerHTML = 'Tooltip';

		this._tabLegends 		= Wu.DomUtil.create('div', 'cartocss-tab cartocss-tab-legends', this._tabsWrapper); // Styling tab				
						  this._tabLegends.innerHTML = 'Legend';

		this._legendsWrapper		= Wu.DomUtil.create('div', 'cartocss-legends-wrapper displayNone', this._wrapper);
		
		this._tooltipOuterWrapper	= Wu.DomUtil.create('div', 'cartocss-tooltip-outer-wrapper displayNone', this._wrapper);
		this._tooltipWrapper		= Wu.DomUtil.create('div', 'cartocss-tooltip-wrapper', this._tooltipOuterWrapper);


		this._formWrapper 		= Wu.DomUtil.create('form', 'cartocss-form-wrapper', this._wrapper); // For CodeMirror: create form wrapper
		this._inputArea 		= Wu.DomUtil.create('textarea', 'cartocss-input', this._formWrapper); // For CodeMirror: create text area
		this._errorPane 		= Wu.DomUtil.create('div', 'cartocss-error-pane', this._wrapper); // error feedback pane
		this._updateButton 		= Wu.DomUtil.create('div', 'cartocss-update-button', this._wrapper); // create update button
		this._updateButton.innerHTML 	= 'Render layer';

		// append to leaflet-control-container
		app._map.getContainer().appendChild(this._editorContainer);

	},

	initCodeMirror : function () {
		
		this._codeMirror = CodeMirror.fromTextArea(this._inputArea, {
    			lineNumbers: true,    			
    			mode: {
    				name : 'carto',
    				reference : window.cartoRef
    			},
    			matchBrackets: true,
    			lineWrapping: true,
    			paletteHints : true,
    			gutters: ['CodeMirror-linenumbers', 'errors']
  		});

		// set default value
  		this._codeMirror.setValue('// No layer selected. \n\n// #layer is always base \n#layer { \n  \n}');

		// todo:
  		// var completer = cartoCompletion(this._codeMirror, window.cartoRef);
		// this._codeMirror.on('keydown', completer.onKeyEvent);
		// this._codeMirror.on('change', function() { return window.editor && window.editor.changed(); });
		// this._codeMirror.setOption('onHighlightComplete', _(completer.setTitles).throttle(100));
		// console.log(')thi wrapper element', this._codeMirror);
		// this._codeMirror.getWrapperElement().id = 'code-' + id.replace(/[^\w+]/g,'_');
	
	},

	setLayerDescription : function () {

		// get meta fields
		var fields = this._layer.getMetaFields(); // return false if no fields found
		
		// create string
		var string = '// #layer is always the layer identifyer \n\n';
		string += '// For a full cartoCSS reference guide:\n // http://projects.ruppellsgriffon.com/docs/cartocss-reference/\n\n';
		string += '#layer {\n\n';
		string += '// Available fields in layer:\n';

		// add each field to string
		for (key in fields) {
			var type = fields[key];
			string += '// [' + key + '=' + type + '] {}\n';
		}
		
		string += '\n}';

		// update text
		this.updateCodeMirror(string);

	},

	updateCodeMirror : function (css) {
		this._codeMirror.setValue(css);
	},

	clearCodeMirror : function () {
		this._codeMirror.setValue('');
	},

	_fillLayers : function () {
		
		// clear
		this._layerSelector.innerHTML = '';

		// add
		this._layers.forEach(function (layer) {

			// append
			var wrapper = Wu.DomUtil.create('div', 'layer-selector-item-wrap');
			var div = Wu.DomUtil.create('div', 'layer-selector-item', wrapper, layer.getTitle());
			this._layerSelector.appendChild(wrapper);

			// hook
			Wu.DomEvent.on(wrapper, 'mousedown', function () {
				this._selectLayer(layer, wrapper)
			}, this);

			// add stops
			Wu.DomEvent.on(wrapper, 'click mousedown mouseup', Wu.DomEvent.stopPropagation, this);


		}, this);

	},

	setSelected : function (wrapper) {

		// clear selected
		this._clearSelected(wrapper);

		// mark selected
		Wu.DomUtil.addClass(wrapper, 'vt-selected', this);
	},

	_clearSelected : function (wrapper) {
		// Set class to show which layer is selected
		for ( var i = 0; i<wrapper.parentNode.children.length; i++ ) {
			var child = wrapper.parentNode.children[i];
			Wu.DomUtil.removeClass(child, 'vt-selected', this);
		}
	},

	_selectLayer : function (layer, wrapper) {

		this.toggleLayerDropDown();
		this.refresh(layer);
		this.setSelected(wrapper);				
		this.initTooltip();


	},

	addHooks : function () {

		// update button click
		Wu.DomEvent.on(this._updateButton, 'click', this.updateCss, this);

		// toolbar button click
		Wu.DomEvent.on(this._toolbarButton, 'click', this.toggle, this);

		// remove control
		Wu.DomEvent.on(this._xButton, 'click', this.toggle, this);

		// Layer drop down
		Wu.DomEvent.on(this._styleHeaderLayerName, 'click', this.toggleLayerDropDown, this);

		// Toggle legends tab
		Wu.DomEvent.on(this._tabLegends, 'mousedown', this.toggleLegends, this);

		// Toggle styles tab
		Wu.DomEvent.on(this._tabStyling, 'mousedown', this.toggleStyles, this);

		// Toggle tooltip tab
		Wu.DomEvent.on(this._tabTooltip, 'mousedown', this.toggleTooltip, this);



		// stops
		Wu.DomEvent.on(this._editorContainer, 		'mousewheel mousedown dblclick mouseup click', 	Wu.DomEvent.stopPropagation, this);
		Wu.DomEvent.on(this._toolbarButton, 		'dblclick', 				Wu.DomEvent.stopPropagation, this);
		Wu.DomEvent.on(this._styleHeaderLayerName, 	'click mousedown mouseup', 		Wu.DomEvent.stopPropagation, this);
		Wu.DomEvent.on(this._formWrapper, 		'click mousedown mouseup', 		Wu.DomEvent.stopPropagation, this);




		// // hack attempt to fix weird unclickables
		// Wu.DomEvent.on(this._editorContainer, 'mouseenter', function () {
		// 	console.log('mousenter!');
		// 	this._codeMirror.focus();
		// }, this);

		// // if first u dont succeed
		// var leafletControlContainer = app._map._controlContainer;
		// Wu.DomEvent.on(leafletControlContainer, 'mousedown', function () {
		// 	console.log('mosue');
		// }, this);


		// Update Zoom
		var map = app._map;
		map.on('zoomend', function() {
			this._zoomVal.innerHTML = map.getZoom();
		}, this)
		
	},

	removeHooks : function () {

		

	},

	toggleLegends : function () {

		// cxxxx

		// Hide Styler
		Wu.DomUtil.addClass(this._formWrapper, 'displayNone');

		// Hide Tooltip
		Wu.DomUtil.addClass(this._tooltipOuterWrapper, 'displayNone');

		// Show Legends Wrapper
		Wu.DomUtil.removeClass(this._legendsWrapper, 'displayNone');


		// Set tab to active
		Wu.DomUtil.removeClass(this._tabTooltip, 'cartocss-active-tab');
		Wu.DomUtil.removeClass(this._tabStyling, 'cartocss-active-tab');
		Wu.DomUtil.addClass(this._tabLegends, 'cartocss-active-tab');


	},

	toggleStyles : function () {


		// Show Styler
		Wu.DomUtil.removeClass(this._formWrapper, 'displayNone');

		// Hide Tooltip
		Wu.DomUtil.addClass(this._tooltipOuterWrapper, 'displayNone');

		// Hide Legends Wrapper
		Wu.DomUtil.addClass(this._legendsWrapper, 'displayNone');

		// Set tab to active
		Wu.DomUtil.removeClass(this._tabTooltip, 'cartocss-active-tab');
		Wu.DomUtil.addClass(this._tabStyling, 'cartocss-active-tab');
		Wu.DomUtil.removeClass(this._tabLegends, 'cartocss-active-tab');


	},

	toggleTooltip : function () {


		// Show Tooltip
		Wu.DomUtil.removeClass(this._tooltipOuterWrapper, 'displayNone');

		// Hide Styler
		Wu.DomUtil.addClass(this._formWrapper, 'displayNone');

		// Hide Legends Wrapper
		Wu.DomUtil.addClass(this._legendsWrapper, 'displayNone');


		// Set tab to active
		Wu.DomUtil.addClass(this._tabTooltip, 'cartocss-active-tab');
		Wu.DomUtil.removeClass(this._tabStyling, 'cartocss-active-tab');
		Wu.DomUtil.removeClass(this._tabLegends, 'cartocss-active-tab');


	},

	initTooltip : function () {


		this._tooltipWrapper.innerHTML = '';
		// cxxxx

		var tooltipCustomHeader	= Wu.DomUtil.createId('input', 'cartocss-tooltip-custom-header', this._tooltipWrapper);
		tooltipCustomHeader.setAttribute('placeholder', 'Tooltip header')


		if ( !this._layer ) return;

		var fields = this._layer.getMetaFields();

		
		for ( key in fields ) {

			var value = fields[key];
			
			console.log(key, value);

			var fieldWrapper = Wu.DomUtil.create('div', 'tooltip-field-wrapper', this._tooltipWrapper);
			
			var fieldKey = Wu.DomUtil.create('input', 'tooltip-field-key', fieldWrapper);
			fieldKey.setAttribute('type', 'text');
			fieldKey.setAttribute('placeholder', key);


			var fieldSwitch = Wu.DomUtil.create('div', 'switch controls-switch', fieldWrapper);
			
			var switchId = 'switch-' + key;

			var fieldSwitchInput = Wu.DomUtil.createId('input', switchId, fieldSwitch);
				Wu.DomUtil.addClass(fieldSwitchInput, 'cmn-toggle cmn-toggle-round-flat')
				fieldSwitchInput.setAttribute('type', 'checkbox');
				fieldSwitchInput.setAttribute('checked', 'checked');

			var fieldSwitchLabel = Wu.DomUtil.create('label', '', fieldSwitch);
				fieldSwitchLabel.setAttribute('for', switchId)
		}
	},


	toggleLayerDropDown : function () {

		if ( !this._openDropDown ) {

			this._openDropDown = true;
			var dropDownHeight = this._layers.length * 27;

			if ( this._layers.length <= 2 ) dropDownHeight+=2;

			this._layerSelectorOuter.style.height = dropDownHeight + 'px';


			Wu.DomUtil.addClass(this._styleHeaderDropDownButton, 'carrow-flipped', this);
			

		} else {

			this._openDropDown = false;
			this._layerSelectorOuter.style.height = '0px';

			Wu.DomUtil.removeClass(this._styleHeaderDropDownButton, 'carrow-flipped', this);
		}		

	},
	
	refresh : function (layer) {

		// new layer is active
		this._layer = layer;
		this._cartoid = false;

		// insert title
		this._styleHeaderLayerName.innerHTML = layer.store.title.camelize();

		// check for existing css
		this._cartoid = this._layer.getCartoid();

		// insert into input area
		if (this._cartoid) {				// callback
			this._layer.getCartoCSS(this._cartoid, this.insertCss.bind(this));
		} else {
			// no style stored on layer yet, set welcome message with meta
			this.setLayerDescription();
		}

	},

	insertCss : function (ctx, css) {

		// set values
		this.updateCodeMirror(css);
	},

	// update (new project, etc.)
	update : function () {

		// set active project
		this.project = app.activeProject;

		// get all active, geojson layers
		this._layers = this.project.getStylableLayers();

		// fill active layers box
		this._fillLayers();
	},

	toggle : function () {
		this._open ? this.close() : this.open();
	},

	open : function () {
		this._open = true;
		Wu.DomUtil.addClass(this._editorContainer, 'open');

		// To make sure the code mirror looks fresh
		this._codeMirror.refresh();
	},

	close : function () {
		this._open = false;
		Wu.DomUtil.removeClass(this._editorContainer, 'open');
	},

	updateCss : function () {

		// return if no active layer
		if (!this._layer) return;

		// get css string
		var css = this._codeMirror.getValue();

		// return if empty
		if (!css) return;
		
		// set vars
		var fileUuid = this._layer.getFileUuid();
		var cartoid = Wu.Util.createRandom(7);

		// send to server
		var json = {							// todo: verify valid css
			css : css,
			fileUuid : fileUuid,
			cartoid : cartoid
		}

		// save to server
		this._layer.setCartoCSS(json, this.updatedCss.bind(this));

		
	},

	
	updatedCss : function (context, json) {

		// parse
		var result = JSON.parse(json);

		// handle errors
		if (!result.ok) return this.handleError(result.error);
			
		// update style on layer
		this._layer.updateStyle();
	},

	handleError : function (error) {

		// handle unrecognized rule
		if (typeof(error) == 'string' && error.indexOf('Unrecognized rule') > -1) {
			return this._handleSyntaxError(error);
		}

		// handle unrecognized rule
		if (typeof(error) == 'string' && error.indexOf('Invalid code') > -1) {
			return this._handleSyntaxError(error);
		}

		// todo: other errors
	},

	_handleSyntaxError : function (error) {

		// parse error
		var err = error.split(':');
		var line 	= parseInt(err[2].trim()) - 1;
		var charr 	= err[3].split(' ')[0].trim();
		var problem 	= err[3].split(' ')[1] + ' ' + err[3].split(' ')[2];
		problem 	= problem.trim().camelize();
		var word 	= err[4].split(' ')[1].trim();
		var suggestion 	= err[4].split(' ');
		suggestion.splice(0,2);
		suggestion 	= suggestion.join(' ');

		// console.log('err:', err);
		// console.log('line: ', line);
		// console.log('char: ', charr);
		// console.log('problem: ', problem);
		// console.log('word: ', word);
		// console.log('suggestion: ', suggestion);


		// mark error in codemirror:

		// get current document
		var doc = this._codeMirror.getDoc()
		
		// add class to line with error 
		//   		 line, [text, background or wrap], className
		doc.addLineClass(line, 'wrap', 'gutter-syntax-error');

		// add error text
		this._errorPane.innerHTML = problem + ': ' + word + '. ' + suggestion;
		Wu.DomUtil.addClass(this._errorPane, 'active-error');

		// clear error on change in codemirror input area
		var that = this;
		Wu.DomEvent.on(doc, 'change', this._clearError, this);
		doc.on('change', function () {
			that._clearError(line);
			
		});



	},

	_clearError : function (line) {

		// clear error pane
		this._errorPane.innerHTML = '';
		Wu.DomUtil.removeClass(this._errorPane, 'active-error');
		
		// remove line class
		var doc = this._codeMirror.getDoc();
		doc.removeLineClass(line, 'wrap'); // removes all classes

		// remove event (doesn't work.. see here instead: http://codemirror.net/doc/manual.html#events)
		var that = this;
		doc.off('change', function () {
			that._clearError(line);
		});

	},

	destroy : function () {
		this.onRemove();
	}



	
});
L.control.cartoCss = function (options) {
	return new L.Control.CartoCSS(options);
};
console.log('cartocssControl.js');