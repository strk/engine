// api
var api = module.parent.exports;

// config
var config = require('../config/server-config.js');

// redis store for temp tokens and upload increments
var redisLayers = require('redis').createClient(config.serverConfig.redis.layers.port, config.serverConfig.redis.layers.host);
redisLayers.on('error', function (err) {console.log('Redis error: ', err);});
redisLayers.auth(config.serverConfig.redis.layers.auth);

// redis store for temp tokens and upload increments
var redisStats = require('redis').createClient(config.serverConfig.redis.stats.port, config.serverConfig.redis.stats.host);
redisStats.on('error', function (err) {console.log('Redis error: ', err);});
redisStats.auth(config.serverConfig.redis.stats.auth);
// redis store for temp tokens and upload increments
var redisTemp = require('redis').createClient(config.serverConfig.redis.temp.port, config.serverConfig.redis.temp.host);
redisTemp.on('error', function (err) {console.log('Redis error: ', err);});
redisTemp.auth(config.serverConfig.redis.temp.auth);

// exports
module.exports = api.redis = { 
	layers : redisLayers,
	stats : redisStats,
	temp : redisTemp
}