// API: api.provider.js

// database schemas
var Project 	= require('../models/project');
var Clientel 	= require('../models/client');	// weird name cause 'Client' is restricted name
var User  	= require('../models/user');
var File 	= require('../models/file');
var Layer 	= require('../models/layer');
var Hash 	= require('../models/hash');
var Role 	= require('../models/role');
var Group 	= require('../models/group');

// utils
var _ 		= require('lodash-node');
var fs 		= require('fs-extra');
var gm 		= require('gm');
var kue 	= require('kue');
var fss 	= require("q-io/fs");
var zlib 	= require('zlib');
var uuid 	= require('node-uuid');
var util 	= require('util');
var utf8 	= require("utf8");
var mime 	= require("mime");
var exec 	= require('child_process').exec;
var dive 	= require('dive');
var async 	= require('async');
var carto 	= require('carto');
var crypto      = require('crypto');
var fspath 	= require('path');
var mapnik 	= require('mapnik');
var request 	= require('request');
var nodepath    = require('path');
var formidable  = require('formidable');
var nodemailer  = require('nodemailer');
var uploadProgress = require('node-upload-progress');
var mapnikOmnivore = require('mapnik-omnivore');

// api
var api = module.parent.exports;

// exports
module.exports = api.provider = { 

	mapbox : {

		setDefault : function (options, sodone) {	

			var project = options.project,
			    username = api.config.defaultMapboxAccount.username,
			    accessToken = api.config.defaultMapboxAccount.accessToken,
			    ops = [];

			ops.push(function (callback) {
				console.log('callback1', callback);

				// add default mapbox account: systemapic
				api.provider.mapbox.requestAccount({
					project : project, 
					username : username, 
					accessToken : accessToken
				}, callback);
			});

			ops.push(function (options, callback) {
				console.log('callback2', callback);

				// create layers from mapbox data
				api.provider.mapbox.createLayers({
					project : project, 
					mapboxLayers : options.mapboxLayers, 
					accessToken : accessToken
				}, callback);
			});

			ops.push(function (options, callback) {
				console.log('callback3', callback);

				// add layers to project
				api.provider.mapbox.addLayersToProject({
					project : project, 
					layers : options.layers, 
					username : username, 
					accessToken : accessToken
				}, callback); 
			});

			ops.push(function (options, callback) {
				console.log('callback4', callback);

				var project = options.project;

				// save project
				project.markModified('layers');
				project.markModified('connectedAccounts');
				project.save(callback);
			});

			// do async and go to callback
			async.waterfall(ops, function (err, result) {
				console.log('water fall done', err, result);
				sodone(null, result);
			});

		},


		// mapbox helper fn
		addLayersToProject : function (options, callback) {

			console.log('callback5', callback);

			var project = options.project,
			    layers = options.layers,
			    username = options.username,
			    accessToken = options.accessToken;

			// add new layers
			layers.forEach(function (add) {
				project.layers.addToSet(add._id); // mongodB Layer object
			});

			// add account
			var account = {
				username : username,
				accessToken : accessToken
			}
			project.connectedAccounts.mapbox.push(account);

			// return to async ops
			callback(null, options);		
		},


		// import mapbox account from username, create Layer Objects of all layers, return Layers to client
		// called from routes /api/util/getmapboxaccount
		// getAccount : function (req, res) {

		// 	var username 	= req.body.username,
		// 	    projectUuid = req.body.projectId,
		// 	    accessToken = req.body.accessToken,
		// 	    userUuid 	= req.user.uuid,
		// 	    ops = [];

		// 	ops.push(function (callback) {
		// 		Project
		// 		.findOne({uuid : projectUuid})
		// 		.populate('files')
		// 		.populate('layers')
		// 		.exec(callback);
		// 	});

		// 	ops.push(function (project, callback) {
		// 		api.provider.mapbox._getAccount({
		// 			username : username,
		// 			project : project,
		// 			accessToken : accessToken
		// 		}, callback);
		// 	});

		// 	async.waterfall(ops, function (err, project) {
		// 		if (err) api.error.general(req, res, err);

		// 		// return project
		// 		api.project._returnProject(req, res, project);
		// 	});

		// },


		// _getAccount : function (options, done) {

		// 	// req, res, project, username, accessToken

		// 	// add ops to async queue
		// 	var ops = [];

		// 	ops.push(function (callback) {
		// 		// add default mapbox account: systemapic
		// 		api.provider.mapbox.requestAccount(options, callback);
		// 	});

		// 	ops.push(function (options, callback) {
		// 		// create layers from mapbox data
		// 		api.provider.mapbox.createLayers(options, callback);
		// 	});

		// 	ops.push(function (options, callback) {
		// 		// add layers to project
		// 		api.provider.mapbox.addLayersToProject(options, callback); 
		// 	});

		// 	ops.push(function(project, callback) {
		// 		// save project
		// 		project.markModified('layers');
		// 		project.markModified('connectedAccounts');
		// 		project.save(callback);
		// 	});

		// 	// do async and done
		// 	async.waterfall(ops, done);
		// },




		// send request to mapbox
		requestAccount : function (options, callback) {
			
			var project = options.project,
			    username = options.username,
			    accessToken = options.accessToken,
			    err;

			// mapbox url
			var url = 'https://api.tiles.mapbox.com/v3/' + username + '/maps.json?secure=1&access_token=' + accessToken; 

			// send request to mapbox
			request(url, function (error, response, body) {

				// err handling
				if (error || response.statusCode != 200) err = error || response.statusCode;

				// parse result
				options.mapboxLayers = JSON.parse(body);

				// return layers to async ops
				callback(null, options);

			});

		},


		// mapbox helper fn
		createLayers : function (options, callback) {
			
			var project = options.project,
			    mapboxLayers = options.mapboxLayers,
			    accessToken = options.accessToken,
			    layers = [],
			    ops = [];

			// create Layer in dB and save to Project
			mapboxLayers.forEach(function (ml) {

				ops.push(function (done) {

					// create Layers object
					var layer 		= new Layer();
					layer.uuid 		= 'layer-' + uuid.v4(); // unique uuid
					layer.title 		= ml.name;
					layer.description 	= ml.description;
					layer.legend		= ml.legend;
					layer.maxZoom 		= ml.maxzoom;
					layer.minZoom 		= ml.minzoom;
					layer.bounds 		= ml.bounds;
					layer.tms		= false;
					layer.data.mapbox 	= ml.id; 		// eg. rawger.geography-class
					layer.attribution 	= ml.attribution; 	// html
					layer.accessToken 	= accessToken;

					// array of Layers objects
					layers.push(layer);

					// remove old mapbox layer if existing
					_.remove(project.layers, function (old) {
						return old.data.mapbox == ml.id;	
					});

					// save
					layer.save(done);
					
				});
			});

			async.series(ops, function (err, results) {
				if (err) console.error('createLayers err: ', err);

				options.layers = layers;

				callback(null, options);
			});
		},


		

	}

}