// app / models / layers.js
// load the things we need
var mongoose = require('mongoose');
var timestamps = require('mongoose-times');


// define the schema for our layers model
var layerSchema = mongoose.Schema({

	uuid 		: String,	// layer uuid

	title 		: String,
	description 	: String, 	// html
	legend 		: String,	// html
	maxZoom		: String,
	minZoom		: String,	// which zoom levels layer is active for, todo later..
	bounds		: String,	// bounds for layer
	tms 		: Boolean,	
	attribution     : String,

	// data source for layer
	data : {
		geojson 	: String,			// file uuid, file saved on server - needs to be if over 4MB (mongodb limit)
		topojson	: String,			// file uuid ... // simply request, check auth, serve file.
		
		rastertile 	: String,			// server raster path: raster/hubble2/hubble
		vectortile 	: String,			// server vector tile: vector/bigassvector/bigvector
		mapbox 		: String,			// mapbox id: rawger.geography-class
		cartodb 	: String,			// cartodb id: 
		osm 		: String,			// osm id?
	}, 


});


// timestamps plugin
layerSchema.plugin(timestamps);	// adds created and lastUpdated fields automatically

// create the model for users and expose it to our app
module.exports = mongoose.model('Layer', layerSchema);