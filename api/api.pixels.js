// API: api.pixels.js

// database schemas
var Project 	= require('../models/project');
var Clientel 	= require('../models/client');	// weird name cause 'Client' is restricted name
var User  	= require('../models/user');
var File 	= require('../models/file');
var Layers 	= require('../models/layer');

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

// config
var config = require('../config/config.js');

// api
var api = module.parent.exports;


// function exports
module.exports = api.pixels = {




	// #########################################
	// ###  API: Create PDF Snapshot         ###
	// #########################################
	createPDFSnapshot : function (req, res) {
		// console.log('cretae PDF snapshot');
		// console.log('body: ', req.body);
		// console.log('hash: ', req.body.hash);


		// run phantomjs cmd	
		// crunch image

		// var hash = req.body.hash;
		var projectUuid = req.body.hash.project;
		
		// var filename = 'snap-' + projectUuid + '-' + req.body.hash.id + '.pdf';
		var filename = 'snap-' + projectUuid + '-' + req.body.hash.id + '.png';
		var fileUuid = 'file-' + uuid.v4();
		// var folder = FILEFOLDER + fileUuid;
		var folder = api.config.path.file + fileUuid;
		var path = folder + '/' + filename;

		var pdfpath = folder + '/' + filename.slice(0, -3) + 'pdf';

		console.log('pdfpath: ', pdfpath);

		var hash = {
			position : req.body.hash.position,
			layers : req.body.hash.layers,
			id : req.body.hash.id,
			
		}


		var args = {
			projectUuid : projectUuid,
			hash : hash,
			// filename : filename,
			// folder : FILEFOLDER
			path : path,
			pdf : true,
			serverUrl : config.portalServer.uri + 'login',
			serverData : config.phantomJS.data
		}

		// console.log('-> PDF args: ', args);

		var snappath = api.config.path.tools + 'phantomJS-snapshot.js';
		var cmd = "phantomjs --ssl-protocol=tlsv1 " + snappath + " '" + JSON.stringify(args) + "'";
		// console.log('cmd: ', cmd);


		var ops = [];
		var dataSize;


		// create file folder
		ops.push(function (callback) {

			fs.ensureDir(folder, function(err) {
				console.log(err); //null
				//dir has now been created, including the directory it is to be placed in
				callback(err);
			})


		});

		// phantomJS: create snapshot
		ops.push(function (callback) {

			var exec = require('child_process').exec;
			exec(cmd, function (err, stdout, stdin) {

				// console.log('executed phantomJS');
				// console.log('err: ', err);
				// console.log('stdout: ', stdout);
				// console.log('stdin: ', stdin);

				callback(err);
			});

		});

		// create pdf from snapshot image
		ops.push(function (callback) {


			// console.log('CREATING PDF!!');

			PDFDocument = require('pdfkit');
			var doc = new PDFDocument({
				margin : 0,
				layout: 'landscape',
				size : 'A4'
			});
			doc.image(path, {fit : [890, 1140]});
			
			doc.pipe(fs.createWriteStream(pdfpath));

			doc.end();


			callback();

		});

		// get size
		ops.push(function (callback) {

			
			fs.stat(pdfpath, function (err, stats) {
				console.log('err: ', err);
				dataSize = stats.size;
	 			callback(err);
	 		});

		});


		// create File
		ops.push(function (callback) {

			var f 			= new File();
			f.uuid 			= fileUuid;
			f.createdBy 		= req.user.uuid;
			f.createdByName    	= req.user.firstName + ' ' + req.user.lastName;
			f.files 		= filename;
			f.access.users 		= [req.user.uuid];	
			f.name 			= filename;
			f.description 		= 'PDF Snapshot';
			f.type 			= 'document';
			f.format 		= 'pdf';
			f.dataSize 		= dataSize;
			f.data.image.file 	= filename; 

			f.save(function (err, doc) {
				if (err) console.log('File err: ', err);
				// console.log('File saved: ', doc);

				callback(err, doc);
			});


		});


		async.series(ops, function (err, results) {
			res.end(JSON.stringify({
				pdf : fileUuid,
				error : null
			}));
		});

	},			


	// #########################################
	// ###  API: Create Thumbnail            ###
	// #########################################
	createThumb : function (req, res) {

		// var hash = req.body.hash;
		var projectUuid = req.body.hash.project;

		var dimensions = req.body.dimensions;
		
		var filename = 'thumb-' + uuid.v4() + '.png';
		// var path = IMAGEFOLDER + filename;
		var path = api.config.path.image + filename;


		var hash = {
			position : req.body.hash.position,
			layers : req.body.hash.layers,
			id : req.body.hash.id
		}

		var args = {
			projectUuid : projectUuid,
			hash : hash,
			path : path,
			pdf : false,
			thumb : true,
			serverUrl : config.portalServer.uri + 'login',
			serverData : config.phantomJS.data
		}

		var snappath = api.config.path.tools + 'phantomJS-snapshot.js';
		var cmd = "phantomjs --ssl-protocol=tlsv1 " + snappath + " '" + JSON.stringify(args) + "'";

		var ops = [];
		var dataSize;

		// phantomJS: create snapshot
		ops.push(function (callback) {

			var exec = require('child_process').exec;
			exec(cmd, function (err, stdout, stdin) {

				callback(err);
			});

		});

		// get size
		ops.push(function (callback) {
			fs.stat(path, function (err, stats) {
				dataSize = stats ? stats.size : 0;
	 			callback(null);
	 		});
		});


		// create File
		ops.push(function (callback) {

			// console.log('create file phsj')

			var f 			= new File();
			f.uuid 			= 'file-' + uuid.v4();
			f.createdBy 		= req.user.uuid;
			f.createdByName    	= req.user.firstName + ' ' + req.user.lastName;
			f.files 		= filename;
			f.access.users 		= [req.user.uuid];	
			f.name 			= filename;
			f.description 		= 'Thumbnail';
			f.type 			= 'image';
			f.format 		= 'png';
			f.dataSize 		= dataSize;
			f.data.image.file 	= filename; 

			f.save(function (err, doc) {
				if (err) console.log('File err: ', err);
				console.log('File saved: ', doc);
				callback(err, doc);
			});


		});

		ops.push(function (callback) {

			var options = {
				height : dimensions.height,
				width : dimensions.width,
				quality : 80,
				file : path

			}

			api.pixels.resizeImage(options, callback);


		});

		console.log('running phantom ascyn');

		async.series(ops, function (err, results) {
			console.log('pahtnom THUMB !! all done: ', err);
			
			if (err) {
				
				console.log('err', err);
				return res.end(JSON.stringify({
					error : err
				}));
			}

			
			var doc = results[2]
			var croppedImage = results[3];

			res.end(JSON.stringify({
				// image : file.uuid,
				image : filename,
				fileUuid : doc.uuid,
				cropped : croppedImage.file,
				error : null
			}));
		});
	},


	// #########################################
	// ###  API: Create Snapshot             ###
	// #########################################
	createSnapshot : function (req, res) {

		// console.log('cretae snapshot');
		// console.log('body: ', req.body);
		// console.log('hash: ', req.body.hash);


		// run phantomjs cmd	
		// crunch image

		// var hash = req.body.hash;
		var projectUuid = req.body.hash.project;
		
		var filename = 'snap-' + projectUuid + '-' + req.body.hash.id + '.png';
		// var path = IMAGEFOLDER + filename;
		var path = api.config.path.image + filename;



		var hash = {
			position : req.body.hash.position,
			layers : req.body.hash.layers,
			id : req.body.hash.id
		}


		var args = {
			projectUuid : projectUuid,
			hash : hash,
			path : path,
			pdf : false,
			serverUrl : config.portalServer.uri + 'login',
			serverData : config.phantomJS.data
		}


		var snappath = api.config.path.tools + 'phantomJS-snapshot.js';
		var cmd = "phantomjs --ssl-protocol=tlsv1 " + snappath + " '" + JSON.stringify(args) + "'";

		var ops = [];
		var dataSize;

		// phantomJS: create snapshot
		ops.push(function (callback) {

			console.log('cmd!! =-> phantomjs2s', cmd);

			var exec = require('child_process').exec;
			exec(cmd, function (err, stdout, stdin) {

				console.log('executed phantomJS');
				console.log('err: ', err);
				console.log('stdout: ', stdout);
				console.log('stdin: ', stdin);

				callback(err);
			});

		});

		// get size
		ops.push(function (callback) {

			console.log('fsstat');
			fs.stat(path, function (err, stats) {
				// console.log('err: ', err);
				// console.log('stats: ', stats);
				if (stats) dataSize = stats.size;
	 			callback(err);
	 		});

		});


		// create File
		ops.push(function (callback) {

			// console.log('create file phsj')

			var f 			= new File();
			f.uuid 			= 'file-' + uuid.v4();
			f.createdBy 		= req.user.uuid;
			f.createdByName    	= req.user.firstName + ' ' + req.user.lastName;
			f.files 		= filename;
			f.access.users 		= [req.user.uuid];	
			f.name 			= filename;
			f.description 		= 'Snapshot';
			f.type 			= 'image';
			f.format 		= 'png';
			f.dataSize 		= dataSize;
			f.data.image.file 	= filename; 

			f.save(function (err, doc) {
				if (err) console.log('File err: ', err);
				// console.log('File saved: ', doc);

				callback(err, doc);
			});


		});

		console.log('running phantom ascyn');

		async.series(ops, function (err, results) {
			console.log('pahtnom !! all done: ', err);
			console.log('results', results);

			if (err) console.log('err', err);
			
			if (err) return api.error.general(req, res, err);
			
			var file = results[2]

			if (!file) return api.error.general(req, res);

			res.end(JSON.stringify({
				image : file.uuid,
				error : null
			}));
		});
		
	},




	handleImage : function (path, callback) {

		var entry = {};
		var file = path;
		var ops = {};
	
		ops.dimensions = function (cb) {
			// get image size
			api.pixels.getImageSize(file, cb);
		};

		ops.identity = function (cb) {
			// get exif size
			api.pixels.getIdentify(file, cb);
		};
		
		ops.dataSize = function (cb) {
			// get file size in bytes
			api.pixels.getFileSize(file, cb);
		};

		// move raw file into /images/ folder
		ops.rawFile = function (cb) {

			// copy raw file
			api.pixels.copyRawFile(file, cb);
		};

		// run all ops async in series
		async.series(ops, function (err, results) {
			if (err) console.error('_processImage err: ', err);
			
			var exif 	= results.identity,
			    dimensions 	= results.dimensions,
			    dataSize 	= results.dataSize,
			    file 	= results.rawFile;

			entry.data 		     = entry.data || {};
			entry.data.image 	     = entry.data.image || {};
			entry.data.image.dimensions  = dimensions;
			entry.dataSize        	     = dataSize;
			entry.data.image.file        = file;
			
			if (exif) {
				entry.data.image.created     = api.pixels.getExif.created(exif);
				entry.data.image.gps         = api.pixels.getExif.gps(exif);
				entry.data.image.cameraType  = api.pixels.getExif.cameraType(exif); 
				entry.data.image.orientation = api.pixels.getExif.orientation(exif);
			}

			console.log('**********************************')
			console.log('* fn: crunch._processImage: * DONE! entry: ', entry);
			console.log('* results: ', results);
			console.log('**********************************')

			// return results to whatever callback
			callback(null, entry);
		});

	},





















	// process images straight after upload
	_processImage : function (entry, callback) {
		console.log('**********************************')
		console.log('* fn: crunch._processImage * entry: ', entry);
		console.log('**********************************')


		var file = entry.permanentPath,
		    ops = {};
	
		ops.dimensions = function (cb) {
			// get image size
			api.pixels.getImageSize(file, cb);
		};

		ops.identity = function (cb) {
			// get exif size
			api.pixels.getIdentify(file, cb);
		};
		
		ops.dataSize = function (cb) {
			// get file size in bytes
			api.pixels.getFileSize(file, cb);
		};

		// move raw file into /images/ folder
		ops.rawFile = function (cb) {

			// move raw file
			api.pixels.moveRawFile(file, cb);
		};

		// run all ops async in series
		async.series(ops, function (err, results) {
			if (err) console.error('_processImage err: ', err);
			
			console.log('*** _processImage async DONE: reults: ', results);

			var exif 	= results.identity,
			    dimensions 	= results.dimensions,
			    dataSize 	= results.dataSize,
			    file 	= results.rawFile;


			entry.data.image 	     = entry.data.image || {};
			entry.data.image.dimensions  = dimensions;
			entry.dataSize        	     = dataSize;
			entry.data.image.created     = api.pixels.getExif.created(exif);
			entry.data.image.gps         = api.pixels.getExif.gps(exif);
			entry.data.image.cameraType  = api.pixels.getExif.cameraType(exif); 
			entry.data.image.orientation = api.pixels.getExif.orientation(exif);
			entry.data.image.file        = file;

			console.log('**********************************')
			console.log('* fn: crunch._processImage: * DONE! entry: ', entry);
			console.log('* results: ', results);
			console.log('**********************************')

			// return results to whatever callback
			callback(err, entry);
		});
	},





	// helper fn to parse exif
	getExif : {
		created : function (exif) {
			if (!exif) return;
			var time = '';
			var profile = exif['Profile-EXIF']
			if (profile) time = profile['Date Time'];			// todo: other date formats
			if (!time) return;
			var s = time.split(/[-: ]/);
 			var date = new Date(s[0], s[1]-1, s[2], s[3], s[4], s[5]);
			time = date.toJSON();
			return time;
		},

		gps : function (exif) {
			var profile = exif['Profile-EXIF'];
			if (!profile) return;

			// get numbers
			var altitude 	= api.pixels.getExif.getAltitude(profile);
			var direction 	= api.pixels.getExif.getDirection(profile);
			var coords 	= api.pixels.getExif.getCoords(profile);
			
			var gps = {
				lat : coords.lat,
				lng : coords.lng,
				alt : altitude,
				dir : direction
			}
	                return gps;
		},

		cameraType : function (exif) {
			var cameraType = '';
			var profile = exif['Profile-EXIF']
			if (profile) cameraType = profile['Model'];
			return cameraType;
		},

		orientation : function (exif) {
			var orientation = -1;
			var orientations = {
				'topleft' 	: 1,
				'bottomright'	: 3,		// todo: BottomImageRight 
				'righttop'	: 6, 
				'leftbottom'	: 8 
			}

			// from exif in int format
			var profile = exif['Profile-EXIF'];
			if (profile) {
				orientation = profile.orientation;
				if (orientation) return orientation;
			}

			// try from root orientation
			var o = exif['Orientation'];
			if (o) {
				var text = o.toLowerCase();
				orientation = orientations[text];
				if (orientation) return orientation;
			}

			return -1;
		},

		getAltitude : function (profile) {
			var gpsalt = profile['GPS Altitude'];
			if (!gpsalt) return -1;
			var alt = gpsalt.split('/');
			if (!alt) return -1;
			var x = alt[0];
			var y = alt[1];
			var altitude = parseInt(x) / parseInt(y);
			console.log('Altitude!: ', altitude);
			return altitude;
		},

		getDirection : function (profile) {
			var gpsdir = profile['GPS Img Direction'];
			if (!gpsdir) return -1;
			var dir = gpsdir.split('/');
			if (!dir) return -1;
			var x = dir[0];
			var y = dir[1];
			var direction = parseInt(x) / parseInt(y);
			console.log('Direction!: ', direction);
			return direction;
		},

		getCoords : function(exif) {
			// https://github.com/Turistforeningen/dms2dec.js/blob/master/lib/dms2dec.js

			var lat = exif.GPSLatitude || exif['GPS Latitude'];
	                var lon = exif.GPSLongitude || exif['GPS Longitude'];
	 		var latRef = exif.GPSLatitudeRef || exif['GPS Latitude Ref'] || "N";  
	                var lonRef = exif.GPSLongitudeRef || exif['GPS Longitude Ref'] || "W";  

	                if (!lat || !lon) return false;

			var ref = {'N': 1, 'E': 1, 'S': -1, 'W': -1};
			var i;

			if (typeof lat === 'string') {
				lat = lat.split(',');
			}

			if (typeof lon === 'string') {
				lon = lon.split(',');
			}

			for (i = 0; i < lat.length; i++) {
				if (typeof lat[i] === 'string') {
					lat[i] = lat[i].replace(/^\s+|\s+$/g,'').split('/');
					lat[i] = parseInt(lat[i][0], 10) / parseInt(lat[i][1], 10);
				}
			}

			for (i = 0; i < lon.length; i++) {
				if (typeof lon[i] === 'string') {
					lon[i] = lon[i].replace(/^\s+|\s+$/g,'').split('/');
					lon[i] = parseInt(lon[i][0], 10) / parseInt(lon[i][1], 10);
				}
			}

			lat = (lat[0] + (lat[1] / 60) + (lat[2] / 3600)) * ref[latRef];
			lon = (lon[0] + (lon[1] / 60) + (lon[2] / 3600)) * ref[lonRef];

			return {lat : lat, lng : lon}
		},

	},


	getImageSize : function (path, callback) {
		gm(path)
		.size(function (err, size) {
			callback(err, size); 
		});
	},


	getFileSize : function (path, callback) {
 		fs.stat(path, function (err, stats) {
 			callback(err, stats.size);
 		});
	},


	// move raw file to /images/ folder
	moveRawFile : function (oldPath, callback) {

		var newFile = 'image-raw-' + uuid.v4();
		// var newPath = IMAGEFOLDER + newFile;
		var newPath = api.config.path.image + newFile;

		// move file
		fs.rename(oldPath, newPath, function (err) {
			if (err) console.log('fs.rename error: ', err);
			callback(err, newFile);
		});
	},

	// copy raw file to /images/ folder
	copyRawFile : function (oldPath, callback) {

		var newFile = 'image-raw-' + uuid.v4();
		var newPath = api.config.path.image + newFile;

		// copy file
		fs.copy(oldPath, newPath, function (err) {
			if (err) console.log('copyRawFile err: ', err);
			callback(null, newFile);
		});
	},

	
	// add file to project
	addFileToProject : function (file, projectUuid) {
		Project
		.findOne({uuid : projectUuid})
		.exec(function (err, project) {
			project.files.push(file._id);
			project.markModified('files');
			project.save(function (err, doc) {
				if (err) console.log('File save error: ', err);
				console.log('File saved to project.');
			});
		});
	},




	// resize single image
	resizeImage : function (option, callback) {


		// basic options
		var width   	= parseInt(option.width) || null;
		var height  	= parseInt(option.height) || null;
		var quality 	= parseInt(option.quality) || 60;			// default quality 60

		console.log('width/height: ', width, height);

		// crop options
		option.crop = option.crop || {};
		var cropX   	= option.crop.x || 0;					// default crop is no crop, same dimensions and topleft
		var cropY   	= option.crop.y || 0;
		var cropW	= option.crop.w || width;
		var cropH 	= option.crop.h || height;
		

		// file options
		var path    	= option.file; 						// original file
		var newFile 	= 'image-' + uuid.v4();					// unique filename
		var newPath 	= api.config.path.image + newFile;				// modified file


		gm.prototype.checkSize = function (action) {
			action()
			return this;
		}

		// do crunch magic
		gm(path)
		.resize(width)						// todo: if h/w is false, calc ratio					
		.autoOrient()
		.crop(cropW, cropH, cropX, cropY)				// x, y is offset from top left corner
		.noProfile()							// todo: strip of all exif?
		.setFormat('JPEG')						// todo: watermark systemapic? or client?
		.quality(quality)
		.write(newPath, function (err) {
			if (err) console.log('22 resizeImage error: ', err);
			
			var result = {
				file   : newFile,
				height : height,
				width  : width,
				path : newPath
			}

			// return error and file
			callback(err, result);

		});
	},



	getIdentify : function (path, callback) {
		gm(path)
		.identify(function (err, exif){
			callback(err, exif);							
		});
	},





	// cxxxxx 

	serveFitPixelPerfection : function (req, res) {

		// set vars
		var quality    = req.query.quality;
		var imageId    = req.params[0]; 		// 'file-ccac0f45-ae95-41b9-8d57-0e64767ea9df'		
		var fitW       = req.query.fitW;
		var fitH       = req.query.fitH;				

		var newFile 	= 'image-' + uuid.v4();					// unique filename
		var newPath 	= api.config.path.image + newFile;				// modified file

		var imagePath = '/data/images/' + imageId;

		api.pixels.getImageSize(imagePath, function (err, size) {

			if ( err || !size ) {
				console.log(err);
				return res.end();
			}

			var imgWidth = size.width;
			var imgHeight = size.height;

			if (imgWidth >= imgHeight) 	var imgLandscape = true;
			if (fitW >= fitH) 		var fitLandscape = true;

			if ( !fitLandscape && imgLandscape ) {

				// regn ut større bredde enn fitW...
				cropW = fitW * fitH/fitW;

				// Offset the X axis
				cropX = (cropW - fitW) / 2;
				cropY = 0;

			} else {

				cropW = fitW;

				// Find the image proportion
				var prop = imgWidth / cropW;

				// Find the image size with overflow
				cropH = imgHeight / prop;

				cropX = 0;

				// Offset the Y axis
				cropY = (cropH - fitH) / 2;
			}


			quality = 100;

			// do crunch magic
			gm(imagePath)
			.resize(cropW)							// the width of the image BEFORE cropping!
			.autoOrient()
			.crop(
				fitW,	// The actual width of the image 
				fitH, 	// The actual height of the image
				cropX, 	// x, y is offset from top left corner
				cropY
			)
			.noProfile()							// todo: strip of all exif?
			.setFormat('JPEG')						// todo: watermark systemapic? or client?
			.quality(quality)
			.write(newPath, function (err) {
				if (err) console.log('px resizeImage error: ', err);
				
				res.sendfile(newPath, {maxAge : 10000000});
			});
		});


	},


	serveImagePixelPerfection : function (req, res) {


		// set vars
		var width      = req.query.width;
		var height     = req.query.height;
		var quality    = req.query.quality;
		var raw        = req.query.raw;
		var imageId    = req.params[0]; 		// 'file-ccac0f45-ae95-41b9-8d57-0e64767ea9df'		
		var cropX      = req.query.cropx;	
		var cropY      = req.query.cropy;
		var cropW      = req.query.cropw;
		var cropH      = req.query.croph;
	
		var imagePath = '/data/images/' + imageId;

		var options = {
			height: height,
			width : width,
			file : imagePath,
			crop : {
				x : cropX,
				y : cropY,
				h : cropH,
				w : cropW
			},
			quality : quality
		}

		// create image with dimensions
		api.pixels.resizeImage(options, function (err, result) {
			console.log('resized!!!', err, result);

			var path = result.path;

			res.sendFile(path, {maxAge : 10000000});
		});
	},			







	// serve images without wasting a pixel
	servePixelPerfection : function (req, res) {

		// set vars
		var width      = req.query.width;
		var height     = req.query.height;
		var quality    = req.query.quality;
		var raw        = req.query.raw;
		var fileUuid   = req.params[0]; 		// 'file-ccac0f45-ae95-41b9-8d57-0e64767ea9df'		
		var cropX      = req.query.cropx;	
		var cropY      = req.query.cropy;
		var cropW      = req.query.cropw;
		var cropH      = req.query.croph;

		// return if invalid
		if (!req.query) return res.end();

		// if raw quality requested, return full image
		if (raw) return api.pixels.returnRawfile(req, res);

		// async waterfall (each fn passes results into next fn)
		var ops = [];

		// find file
		ops.push(function (callback) {

			File
			.findOne({uuid : fileUuid})
			.exec(function (err, file) {

				if (!file) return callback(err, { 
					image : false, 
					rawfile : false
				});
				
				// find image with right dimensions (exactly) // todo: % margins
				var image = _.find(file.data.image.crunched, function (i) {
					if (!i) return false;
					if (_.isObject(i.crop)) i.crop = {}; // prevent errors

					// check if crunched is same dimensions
					return 	parseInt(i.width)   == parseInt(width)    &&  	// width
						parseInt(i.height)  == parseInt(height)   &&  	// height
						parseInt(i.quality) == parseInt(quality)  && 	// quality
						parseInt(i.crop.x)  == parseInt(cropX)    && 	// crop
						parseInt(i.crop.y)  == parseInt(cropY)    && 	// crop
						parseInt(i.crop.h)  == parseInt(cropH)    && 	// crop
						parseInt(i.crop.w)  == parseInt(cropW); 	// crop
						
				});
				
				// return found image (if any)
				var rawfile = file.data.image.file;
				var vars = {
					rawfile : file.data.image.file,
					image : image
				}			

				callback(err, vars);
			});
		});

		// create image if not found
		ops.push(function (vars, callback) {

			var image = vars.image;
			var rawfile = vars.rawfile;

			// return image if found
			if (image) {
				image.existing = true;
				return callback(null, image);
			}

			// if not found, create image
			var template = {
				file   : api.config.path.image + rawfile,
				width  : width,
				height : height,
				quality : quality,
				crop : {
					x : cropX,
					y : cropY,
					h : cropH,
					w : cropW
				}
			}

			// create image with dimensions
			api.pixels.resizeImage(template, callback);

		});

		// image found or created
		ops.push(function (result, callback) {

			// add image to File object if it was created
			if (!result.existing) api.pixels.addImageToFile(result, fileUuid);

			// return result
			callback(null, result);
			
		});


		// run all async ops
		async.waterfall(ops, function (err, result) {
			// all done, serve file
			api.pixels.returnImage(req, res, result);
		});
	},


	// add crunched image to File object
	addImageToFile : function (result, fileUuid, callback) {
		File
		.findOne({uuid : fileUuid})
		.exec(function (err, file) {
			file.data.image.crunched.addToSet(result);	
			file.markModified('data');
			file.save(function (err) {
				if (callback) callback(err, result);
			});
		});
	},


	// send image to client
	returnImage : function (req, res, imageFile) {
		// send file back to client, just need file path
		var path = api.config.path.image + imageFile.file;
		res.sendfile(path, {maxAge : 10000000});	// cache age, 115 days.. cache not working?
	},


	returnRawfile : function (req, res) {

		// get file uuid
		var fileUuid = req.params[0]; 

		// get raw file
		File
		.findOne({uuid : fileUuid})
		.exec(function (err, file) {
			if (!file) return callback(err);

			// return raw file
			var imageFile = file.data.image;
			return api.pixels.returnImage(req, res, imageFile);
		});
		return;
	},


}