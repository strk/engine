// API: api.js

// config
var config = require('../config/server-config.js');

// redis store for temp passwords
var redisStore = require('redis').createClient(config.serverConfig.temptokenRedis.port, config.serverConfig.temptokenRedis.host);
redisStore.auth(config.serverConfig.temptokenRedis.auth);
redisStore.on('error', console.error);

// api
var api = {};
api.version 		= '1.0-beta';
api.config 		= config.serverConfig;
api.clientConfig 	= config.clientConfig;
api.loginConfig 	= config.loginConfig;
api.redis 		= redisStore;

// exports
module.exports 		= api;
module.exports.geo 	= require('./api.geo');
module.exports.file 	= require('./api.file');
module.exports.auth 	= require('./api.auth');
module.exports.user 	= require('./api.user');
module.exports.layer 	= require('./api.layer');
module.exports.email 	= require('./api.email');
module.exports.error 	= require('./api.error');
module.exports.slack 	= require('./api.slack');
module.exports.debug 	= require('./api.debug');
module.exports.utils 	= require('./api.utils');
module.exports.upload 	= require('./api.upload');
module.exports.legend 	= require('./api.legend');
module.exports.pixels 	= require('./api.pixels');
module.exports.portal 	= require('./api.portal');
module.exports.access 	= require('./api.access');
module.exports.client 	= require('./api.client');
module.exports.socket 	= require('./api.socket');
module.exports.project 	= require('./api.project');
module.exports.provider = require('./api.provider');
module.exports.analytics = require('./api.analytics');