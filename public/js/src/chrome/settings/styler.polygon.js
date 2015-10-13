Wu.Styler.Polygon = Wu.Styler.extend({

	type : 'polygon',


	// creates content of point container
	_createOptions : function () {

		// color
		this._createColor();

		// opacity
		this._createOpacity();

		// create (+) button
		console.log('(+) button');
	},

	
	_preSelectOptions : function () {

		// open relevant subfields
		this._initSubfields(this.carto().color.column, 'color');
		this._initSubfields(this.carto().opacity.column, 'opacity');
	},

	_clearOptions : function () {

		var content = this._content[this.type];

		// return if not content yet
		if (_.isEmpty(content)) return;

		// get divs
		var color_wrapper = content.color.line.container;
		var color_children = content.color.line.childWrapper;
		var opacity_wrapper = content.opacity.line.container;

		// remove divs
		color_wrapper && Wu.DomUtil.remove(color_wrapper);
		color_children && Wu.DomUtil.remove(color_children);
		opacity_wrapper && Wu.DomUtil.remove(opacity_wrapper);
	},

});