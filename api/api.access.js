// API: api.access.js

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

// redis store for temp passwords // todo: move to api
var redis = require('redis');
var redisStore = redis.createClient(api.config.temptokenRedis.port, api.config.temptokenRedis.host)
redisStore.auth(api.config.temptokenRedis.auth);
redisStore.on('error', function (err) { console.error(err); });


module.exports = api.access = {
	
	// superusers todo: remove!
	superusers : [
		'user-f151263a-8a2f-4bfd-86f0-53e71083fb39', 	// KO dev
		'user-5b51ff49-31f5-4a7a-b17c-d18268079d8f', 	//  J dev
		'user-9fed4b5f-ad48-479a-88c3-50f9ab44b17b', 	// KO rg
		'user-e6e5d7d9-3b4c-403b-ad80-a854b0215831',    //  J rg
		'user-5be55fcd-b8c2-4532-8932-c65e608a1f81', 	// ko m.s
		'user-d4d45439-72bc-4124-95a1-9104b482e50e', 	// j m.s
		'user-a15e2219-4ce2-4cf2-b741-eecfe5520f7d',  	// phantom @ maps.systemapic.com
		'user-f36e496e-e3e4-4fac-a37c-f1a98689afda'   	// dev1@noerd.biz
	],

	roleTemplates : {

		// can do anything
		superAdmin : {
			name : 'Super Admin',
			capabilities : {
				create_client 		: true,	
				read_client 		: true, 		
				edit_client 		: true, 		
				edit_other_client 	: true, 	
				delete_client 		: true, 	
				delete_other_client 	: true,  
				create_project 		: true, 	
				read_project 		: true, 	
				edit_project 		: true, 	
				edit_other_project 	: true, 	
				delete_project 		: true, 	
				delete_other_project 	: true,
				upload_file 		: true, 	
				download_file 		: true, 	
				edit_file 		: true, 	
				edit_other_file 	: true, 	
				create_version 		: true, 	
				delete_version 		: true, 	
				delete_other_version 	: true,
				delete_file 		: true, 	
				delete_other_file 	: true, 	
				create_user 		: true, 
				read_user 		: true,
				read_other_user		: true,	
				edit_user 		: true, 		
				edit_other_user 	: true, 	
				delete_user 		: true, 	
				delete_other_user 	: true, 	
				share_project 		: true, 	
				read_analytics 		: true, 	
				manage_analytics	: true, 	
				delegate_to_user 	: true,
				have_superpowers	: true, 
			},
		},

		// can do anything except create superAdmins
		portalAdmin : {
			name : 'Portal Admin',
			capabilities : {
				create_client 		: true,	
				read_client 		: true, 		
				edit_client 		: true, 		
				edit_other_client 	: true, 	
				delete_client 		: true, 	
				delete_other_client 	: true,  
				create_project 		: true, 	
				read_project 		: true, 	
				edit_project 		: true, 	
				edit_other_project 	: true, 	
				delete_project 		: true, 	
				delete_other_project 	: true,
				upload_file 		: true, 	
				download_file 		: true, 	
				edit_file 		: true, 	
				edit_other_file 	: true, 	
				create_version 		: true, 	
				delete_version 		: true, 	
				delete_other_version 	: true,
				delete_file 		: true, 	
				delete_other_file 	: true, 	
				create_user 		: true, 	
				read_user 		: true,
				read_other_user		: true,
				edit_user 		: true, 		
				edit_other_user 	: true, 	
				delete_user 		: true, 	
				delete_other_user 	: true, 	
				share_project 		: true, 	
				read_analytics 		: true, 	
				manage_analytics	: true, 	
				delegate_to_user 	: true,
				
				have_superpowers 	: false,  // needed to diff from superadmin
			},
		},
		

		// can read, edit, manage any content
		projectOwner : {
			name : 'Project Owner',
			capabilities : {
				create_project 		: true, 	
				read_project 		: true, 	
				edit_project 		: true, 	
				delete_project 		: true, 	
				upload_file 		: true, 	
				download_file 		: true, 	
				edit_file 		: true, 	
				edit_other_file 	: true, 	
				create_version 		: true, 	
				delete_version 		: true, 	
				delete_other_version 	: true,
				delete_file 		: true, 	
				delete_other_file 	: true, 	
				create_user 		: true, 	
				read_user 		: true,
				read_other_user		: true,
				edit_user 		: true, 
				delete_user 		: true, 	
				share_project 		: true, 	
				delegate_to_user 	: true,

				create_client 		: false,	
				read_client 		: false, 		
				edit_client 		: false, 		
				edit_other_client 	: false, 	
				delete_client 		: false, 	
				delete_other_client 	: false,  
				edit_other_project 	: false, 	
				delete_other_project 	: false,
				edit_other_user 	: false, 	
				delete_other_user 	: false, 	
				read_analytics 		: false, 	
				manage_analytics	: false, 	
				have_superpowers 	: false, 
			},
		},

		// can read, edit, manage own content
		projectEditor : {
			name : 'Editor',
			capabilities : {
				create_project 		: true, 	
				read_project 		: true, 	
				edit_project 		: true, 
				delete_project 		: true, 	
				upload_file 		: true, 	
				download_file 		: true, 	
				edit_file 		: true, 
				create_version 		: true, 	
				delete_version 		: true, 	
				delete_file 		: true, 	
				create_user 		: true, 	
				read_user 		: true,
				read_other_user		: true,
				edit_user 		: true, 
				delete_user 		: true, 	
				share_project 		: true, 	
				delegate_to_user 	: true,

				create_client 		: false,	
				read_client 		: false, 		
				edit_client 		: false, 		
				edit_other_client 	: false, 	
				delete_client 		: false, 	
				delete_other_client 	: false,  
				edit_other_project 	: false, 	
				delete_other_project 	: false,
				edit_other_file 	: false, 	
				delete_other_version 	: false,
				delete_other_file 	: false, 	
				edit_other_user 	: false, 	
				delete_other_user 	: false, 	
				read_analytics 		: false, 	
				manage_analytics	: false, 	
				have_superpowers 	: false, 
			},
		},

		// can read and manage, not edit
		projectManager : {
			name : 'Manager',
			capabilities : {
				read_project 		: true, 	
				download_file 		: true, 	
				create_user 		: true, 	
				read_user 		: true,
				read_other_user		: true,
				edit_user 		: true, 
				delete_user 		: true, 	
				share_project 		: true, 	
				delegate_to_user 	: true,

				create_client 		: false,	
				read_client 		: false, 		
				edit_client 		: false, 		
				edit_other_client 	: false, 	
				delete_client 		: false, 	
				delete_other_client 	: false,  
				create_project 		: false, 	
				edit_project 		: false, 	
				edit_other_project 	: false, 	
				delete_project 		: false, 	
				delete_other_project 	: false,
				upload_file 		: false, 	
				edit_file 		: false, 	
				edit_other_file 	: false, 	
				create_version 		: false, 	
				delete_version 		: false, 	
				delete_other_version 	: false,
				delete_file 		: false, 	
				delete_other_file 	: false, 	
				edit_other_user 	: false, 	
				delete_other_user 	: false, 	
				read_analytics 		: false, 	
				manage_analytics	: false, 	
				have_superpowers 	: false, 
			},
		},

		// can read and edit, not manage
		projectCollaborator : {
			name : 'Collaborator',
			capabilities : {
				read_project 		: true, 	
				edit_project 		: true, 
				upload_file 		: true, 	
				download_file 		: true, 	
				edit_file 		: true, 
				create_version 		: true, 	
				delete_version 		: true, 
				delete_file 		: true, 	
				share_project 		: true, 	

				create_client 		: false,	
				read_client 		: false, 		
				edit_client 		: false, 		
				edit_other_client 	: false, 	
				delete_client 		: false, 	
				delete_other_client 	: false,  
				create_project 		: false, 	
				edit_other_project 	: false, 	
				delete_project 		: false, 	
				delete_other_project 	: false,
				edit_other_file 	: false, 	
				delete_other_version 	: false,
				delete_other_file 	: false, 	
				create_user 		: false, 	
				read_user 		: false,
				read_other_user		: false,
				edit_user 		: false, 	
				edit_other_user 	: false, 	
				delete_user 		: false, 
				delete_other_user 	: false, 	
				read_analytics 		: false, 	
				manage_analytics	: false, 	
				delegate_to_user 	: false,
				have_superpowers 	: false, 

			},
		},

		// can read
		projectReader : {
			name : 'Reader',
			capabilities : {
				read_project 		: true, 	
				download_file 		: true, 	
				share_project 		: true, 	

				create_client 		: false,	
				read_client 		: false, 		
				edit_client 		: false, 		
				edit_other_client 	: false, 	
				delete_client 		: false, 	
				delete_other_client 	: false,  
				create_project 		: false, 	
				edit_project 		: false, 	
				edit_other_project 	: false, 	
				delete_project 		: false, 	
				delete_other_project 	: false,
				upload_file 		: false, 	
				edit_file 		: false, 	
				edit_other_file 	: false, 	
				create_version 		: false, 	
				delete_version 		: false, 	
				delete_other_version 	: false,
				delete_file 		: false, 	
				delete_other_file 	: false, 	
				create_user 		: false, 	
				read_user 		: false,
				read_other_user		: false,
				edit_user 		: false, 		
				edit_other_user 	: false, 	
				delete_user 		: false, 	
				delete_other_user 	: false, 	
				read_analytics 		: false, 	
				manage_analytics	: false, 	
				delegate_to_user 	: false,
				have_superpowers 	: false, 
			},
		}

	},



	getRole : function (options, callback) {
		Role
		.findOne({uuid : options.roleUuid})
		.exec(callback);
	},


	getProject : function (options, callback) {
		Project
		.findOne({uuid : options.projectUuid})
		.populate('roles')
		.exec(callback);
	},


	getUserRole : function (options, done) {
		var project = options.project,
		    account = options.account,
		    roles = project.roles,
		    ops = {};


		ops.super = function (callback) {
			var superRoleUuid = api.config.portal.roles.superAdmin;

			Role
			.findOne({uuid : superRoleUuid})
			.exec(callback);

		}

		ops.portal = function (callback) {
			var portalRoleUuid = api.config.portal.roles.portalAdmin;

			Role
			.findOne({uuid : portalRoleUuid})
			.exec(callback);

		}


		ops.project = function (callback) {
			// find role that account is member of
			var role = _.find(roles, function (role) {
				return _.contains(role.members, account.getUuid());
			});

			callback(null, role);
		}
		
		async.series(ops, function (err, roles) {
			if (roles.super) return done(null, roles.super);
			if (roles.portal) return done(null, roles.portal);
			if (roles.project) return done(null, roles.project);
		});

	},


	getAll : function (options, done) {	

		// get super/portal roles

		var ops = {};

		ops.portalRole = function (callback) {
			var portalRoleUuid = api.config.portal.roles.portalAdmin;

			Role
			.findOne({uuid : portalRoleUuid})
			.exec(callback);

		};

		ops.superRole = function (callback) {
			var superRoleUuid = api.config.portal.roles.superAdmin;

			Role
			.findOne({uuid : superRoleUuid})
			.exec(callback);

		};

		async.series(ops, done);

	},


	permissionToAddRole : function (options, done) {
		var project = options.project,
		    account = options.account,
		    role = options.role,
		    ops = [];


		console.log('permissionToAddRole options, ', options);

		// get account's role in project
		ops.push(function (callback) {
			api.access.getUserRole({
				project : project,
				account : account
			}, callback);
		});

		// check if user's role has all capabilities necessary (ie. all in delegating role)
		ops.push(function (accountRole, callback) {
			var lacking;
			_.each(role.capabilities, function (cap, key) {
				if (cap) if (!accountRole.capabilities[key]) lacking = true;
			});
			var hasPermission = !lacking && accountRole.capabilities.delegate_to_user;
			callback(!hasPermission);
		});

		async.waterfall(ops, function (err) {
			done(err, options);
		});

	},

	setSuperRoleMember : function (req, res) {
		api.error.general(req, res, 'wait for it!');
	},

	setPortalRoleMember : function (req, res) {
		api.error.general(req, res, 'wait for it!');
	},

	setRoleMember : function (req, res) {
		var projectUuid = req.body.projectUuid,
		    userUuid = req.body.userUuid,
		    roleUuid = req.body.roleUuid,
		    account = req.user,
		    ops = [];

		console.log('api.access.setRoleMember', req.body);

		// return on missing info
		if (!projectUuid || !userUuid || !roleUuid) return api.error.missingInformation(req, res);


		// get role 
		ops.push(function (callback) {
			api.access.getRole({
				roleUuid : roleUuid
			}, callback);
		});

		// get project
		ops.push(function (role, callback) {
			Project
			.findOne({uuid : projectUuid})
			.populate('roles')
			.exec(function (err, project) {
				var options = {
					project : project,
					role : role
				}
				callback(err, options);
			});
		});

		// check if permission to add member to role
		ops.push(function (options, callback) {
			var project = options.project,
			    role = options.role;

			api.access.permissionToAddRole({
				role : role,
				project : project,
				account : account
			}, callback);
		});

		// remove user from all project roles
		ops.push(function (options, callback) {	
			var role = options.role,
			    project = options.project;

			api.access.removeFromProjectRoles({
				project : project,
				userUuid : userUuid,
				role : role
			}, callback);
		});

		// add user to role
		ops.push(function (options, callback) { 
			var role = options.role,
			    project = options.project;

			api.access.addToRole({
				role : role,
				userUuid : userUuid,
				project : project
			}, callback);
		});

		// get updated project
		ops.push(function (options, callback) {
			Project
			.findOne({uuid : projectUuid})
			.populate('roles')
			.exec(callback);
		});

		// return updated project
		async.waterfall(ops, function (err, project) {
			if (err) return api.error.general(req, res, err);
			
			res.end(JSON.stringify(project));
		});

	},

	addToRole : function (options, callback) {
		var role = options.role,
		    userUuid = options.userUuid;

		role.members.addToSet(userUuid);
		role.save(function (err) {
			callback(err, options);
		});
	},

	removeFromProjectRoles : function (options, done) {
		var project = options.project,
		    userUuid = options.userUuid,
		    roles = project.roles,
		    ops = [];

		async.each(roles, function (role, callback) {
			role.members.pull(userUuid);
			role.save(callback);
		}, function (err) {
			done(err, options);
		});
		
	},


	// filter : {

	// 	// get roles which role can delegate to
	// 	roles : function (options) {
	// 		var role = options.role,
	// 		    noAdmins = options.noAdmins,
	// 		    project = options.project,
	// 		    available = [];

	// 		// iterate each project role
	// 		_.each(project.getRoles(), function (template) {
	// 			var lacking = false;
				
	// 			_.each(template.capabilities, function (cap, key) {
	// 				if (cap) if (!role.capabilities[key]) lacking = true;
	// 			});

	// 			// if not lacking any cap, add to available
	// 			if (!lacking) available.push(template);
	// 		});

	// 		return available;
	// 	},
	// },



	requestPasswordReset : function (req, res) {

		// get email
		var email = req.body.email;

		User
		.findOne({'local.email' : email})
		.exec(function (err, user) {

			// send password reset email
			if (!err && user) api.email.sendPasswordResetEmail(user);

			// finish
			res.render('../../views/login.serve.ejs', { message: 'Please check your email for further instructions.' });
			res.end();

		});
	},


	confirmPasswordReset : function (req, res) {
		var email = req.query.email,
	 	    token = req.query.token;

		User
		.findOne({'local.email' : email})
		.exec(function (err, user) {

			// err
			if (err || !user) console.error('no user ?', err, user);

			// check token
			api.access.checkPasswordResetToken(user, token, function (valid) {

				// reset if valid token
				if (valid) {
					api.access.resetPassword(user);
					var message = 'Please check your email for new login details.';
				} else {
					var message = 'Authorization failed. Please try again.';
				}

				// finish
				res.render('../../views/login.serve.ejs', { message : message });
			});
		});
	},


	resetPassword : function (user) {
		var password = crypto.randomBytes(16).toString('hex');
		user.local.password = user.generateHash(password);
		user.markModified('local');
	
		// save the user
		user.save(function(err, doc) { 
			// send email with login details to user
			api.email.sendWelcomeEmail(user, password);
		});
	},


	setPasswordResetToken : function (user) {
		var token = crypto.randomBytes(16).toString('hex'),
		    key = 'resetToken-' + user.uuid;

		redisStore.set(key, token);  // set temp token
		redisStore.expire(key, 600); // expire in ten mins
		return token;
	},


	checkPasswordResetToken : function (user, token, callback) {
		var key = 'resetToken-' + user.uuid;
		redisStore.get(key, function (err, actualToken) {
			callback(!err && actualToken && actualToken == token)
		});
	},



	_createRole : function (options, callback) {

		// create model
		var role 	= new Role();
		role.uuid 	= 'role-' + uuid.v4();
		role.name 	= options.name;
		role.capabilities = api.access.get.capabilities(options);
		
		if (options.members) {
			role.members = options.members;
		}

		// save
		role.save(function (err) {
			callback(err, role);
		});

	},

	// create default roles for new project
	_createDefaultRoles : function (options, done) {
		var user = options.user,
		    ops = [];

		ops.push(function (callback) {
			api.access._createRole({
				name : 'Project Owner',
				template : 'projectOwner',
				members : [user.uuid], 	// add creator 
			}, callback);
		});

		ops.push(function (callback) {
			api.access._createRole({
				name : 'Project Editor',
				template : 'projectEditor',
			}, callback);
		});

		ops.push(function (callback) {
			api.access._createRole({
				name : 'Project Manager',
				template : 'projectManager',
			}, callback);
		});

		ops.push(function (callback) {
			api.access._createRole({
				name : 'Project Collaborator',
				template : 'projectCollaborator',
			}, callback);
		});

		ops.push(function (callback) {
			api.access._createRole({
				name : 'Project Reader',
				template : 'projectReader',
			}, callback);
		});

		async.parallel(ops, function (err, roles) {
			done(err, roles);
		});
	},




	get : {

		portalAdmins : function () {
			return {
				// todo: actual Role model
				members : api.config.portal.portalAdmins,
				capabilities : api.access.get.capabilities({template : 'portalAdmin'}),
				name : 'Portal Admin'
			};
		},

		superAdmins : function () {
			return {
				// todo: actual Role model
				members : api.config.portal.superAdmins,
				capabilities : api.access.get.capabilities({template : 'superAdmin'}),
				name : 'Super Admin'
			}
		},

		capabilities : function (options) {

			var template = options.template,
			    capabilities = {},
			    additionalCapabilities = options.capabilities;

			// get capabilities from template
			if (template == 'superAdmin') capabilities = api.access.roleTemplates.superAdmin.capabilities;
			if (template == 'portalAdmin') capabilities = api.access.roleTemplates.portalAdmin.capabilities;
			if (template == 'projectOwner') capabilities = api.access.roleTemplates.projectOwner.capabilities;
			if (template == 'projectEditor') capabilities = api.access.roleTemplates.projectEditor.capabilities;
			if (template == 'projectReader') capabilities = api.access.roleTemplates.projectReader.capabilities;
			if (template == 'projectManager') capabilities = api.access.roleTemplates.projectManager.capabilities;
				
			// add extra capabilities
			if (additionalCapabilities) _.each(additionalCapabilities, function (value, key) {
				capabilities[key] = value;	
			});

			// return capabilities as {}
			return capabilities;

		},


	},

	


	is : {
		
		contained : function (array, item) {
			return array.indexOf(item) > 0;
		},

		admin : function (options, done) {
			var ops = {};

			ops.portal = function (callback) {
				api.access.is.portalAdmin(options, callback)
			};

			ops.super = function (callback) {
				api.access.is.superAdmin(options, callback)
			};

			async.parallel(ops, function (err, is) {
				done(err, is.portal || is.super);
			});

		},

		portalAdmin : function (options, callback) {
			var user = options.user,
			    roleUuid = api.config.portal.roles.portalAdmin;

			Role
			.findOne({ uuid : roleUuid})
			.exec(function (err, role) {
				var isAdmin = role.isMember(user);
				callback(err, isAdmin);
			});
		},

		superAdmin : function (options, callback) {

			var user = options.user,
			    roleUuid = api.config.portal.roles.superAdmin;

			Role
			.findOne({ uuid : roleUuid})
			.exec(function (err, role) {
				var isAdmin = role.isMember(user);
				callback(err, isAdmin);
			});
		},

		createdBy : function (user, account) {
			return user.createdBy == account.getUuid();
		},

	},

	as : {
		admin : function (user, cap) {
			if (api.access.as.superAdmin(user, cap)) return true;
			if (api.access.as.portalAdmin(user, cap)) return true;
			return false;
		},

		portalAdmin : function (user, cap) {
			if (api.access.is.portalAdmin(user)) {
				var c = api.access.get.portalAdmins().capabilities;
				if (c[cap]) return true;
			}
			return false;
		},

		superAdmin : function (user, cap) {
			if (api.access.is.superAdmin(user)) {
				var c = api.access.get.superAdmins().capabilities;
				if (c[cap]) return true;
			}
			return false;
		},
	},

	has : {

		project_capability : function (options, capability) {
			var user = options.user,
			    project = options.project,
			    roles = project.roles,
			    access = false;

			console.log('has.project_cap roles:', roles);
			
			if (roles) roles.forEach(function (role) {
				// if user in role
				if (api.access.is.contained(role.members, user.getUuid())) {
					// if capability in role
					if (role.capabilities[capability]) access = true;
				}
			});
			return access;
		},

		capability : function (options, done) {
			var user = options.user,
			    capability = options.capability,
			    project = options.project,
			    ops = [];

			// return on missing
			if (!project || !user || !project.roles || !capability) return done(null, false);

			// get role of user in project
			var role = _.find(project.roles, function (r) {
				return _.contains(r.members, user.getUuid());
			});

			// return if no role
			if (!role || !role.capabilities) return done(null, false);

			var hasCapability = role.capabilities[capability];

			done(null, hasCapability);

		}

	},

	// CRUD capabilities
	// must be kept identical with access.js
	to : {


		// potential capabilities:
		// layer access: create, edit, delete, etc.. cartocss, etc..
		// file access...? 
		// settings access - dataLib, mediaLib, etc.
		// more?

		// TODO!! : pass to _other_ if !createdBy self

		// TODO: remove super/portal altogether, simply check those roles for account... 

		// still to go thru 1st round:
		// 	download_file -> move to POST
		// 	upload_file
		// 	versions...
		//	share
		// 	analytics
		// 	delegation...........



		_check : function (options, capability, done) {
			var user = options.user,
			    project = options.project,
			    ops = {};

			ops.admin = function (callback) {

				// if is admin
				api.access.is.admin(options, callback);
			};

			ops.capable = function (callback) {

				// if has capability
				api.access.has.capability({
					user : user,
					capability : capability,
					project : project
				}, callback);
			};

			async.series(ops, function (err, is) {
				if (!err && is.admin || is.capable) return done(null, options);
				done('No access.');
			});

		},





		create_client : function (options, callback) {  			// todo: client roles
			console.log('to.create_client', options);
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		edit_client : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		edit_other_client : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		delete_client : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		delete_other_client : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		read_client : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		create_project : function (options, callback) { 
			api.access.is.admin(options, function (err, isAdmin) {
				if (err || !isAdmin) return callback('No access.');
				callback(null, options);
			});
		},
		
		edit_project : function (options, done) { 
			api.access.to._check(options, 'edit_project', done);
		},
		
		edit_other_project : function (options, done) { 
			api.access.to._check(options, 'edit_other_project', done);
		},
		
		delete_project : function (options, done) { 
			api.access.to._check(options, 'delete_project', done);
		},
		
		delete_other_project : function (options, done) { 
			api.access.to._check(options, 'delete_other_project', done);
		},
		
		read_project : function (options, done) { 
			api.access.to._check(options, 'read_project', done);
		},
		
		upload_file : function (options, done) { 
			api.access.to._check(options, 'upload_file', done);
		},
		
		download_file : function (options, done) { 
			console.log('api.access.to.download_file', options);
			
			// some files not attached to projects, like temp-files (pdfs, etc)
			// so, if created by self, it's ok..
			if (api.access.is.createdBy(options.file, options.user)) return done(null, options);

			// need to find project, and check project_capability
			var ops = [];

			ops.push(function (callback) {
				Project
				.findOne({files : options.file._id})
				.exec(callback);
			});

			ops.push(function (project, callback) {
				if (!project) return callback('No access.');

				options.project = project;
				
				api.access.to._check(options, 'download_file', callback);
			});

			async.waterfall(ops, done);

		},
		
		create_version : function (options, done) { 
			api.access.to._check(options, 'create_version', done);
		},
		
		delete_version : function (options, done) { 
			api.access.to._check(options, 'delete_version', done);
		},

		delete_other_version : function (options, done) {
			api.access.to._check(options, 'delete_other_version', done);
		},

		
		edit_file : function (options, done) {
			api.access.to._check(options, 'edit_file', done); 			// todo: if not createdBy self, pass to _other_
		},

		edit_other_file : function (options, done) {
			api.access.to._check(options, 'edit_other_file', done);
		},
		
		delete_file : function (options, done) { 
			api.access.to._check(options, 'delete_file', done);
		},
		
		delete_other_file : function (options, done) { 
			api.access.to._check(options, 'delete_other_file', done);
		},
		
		create_user : function (options, done) { 
			api.access.to._check(options, 'create_user', done);
		},
		
		edit_user : function (options, done) { 
			var account = options.user, 
			    user = options.subject;

			// if not createdBy self, pass to edit_other_user
			if (!api.access.is.createdBy(user, account)) return api.access.to.edit_other_user(options, done);

			// if created user, then ok // todo: more requirements?
			done(null, options);
		},
		
		edit_other_user : function (options, done) { 
			var account = options.user,
			    subject = options.subject,
			    project = options.project,
			    ops = {};


			ops.super = function (callback) {
				api.access.is.superAdmin(options, callback);
			}

			ops.portal = function (callback) {
				api.access.is.portalAdmin(options, function (err, isPortal) {
					if (err || !isPortal) return callback(null, false);
					
					// if subject is not superadmin!
					api.access.is.superAdmin({
						user : subject
					}, function (err, subjectIsSuper) {
						if (err || subjectIsSuper) return callback(null, false);
						callback(null, options)
					});
				});
			}

			ops.able = function (callback) {
				api.access.to._check(options, 'edit_other_user', callback)
			}

			async.series(ops, function (err, is) {

				// access
				if (is.super || is.portal || is.able) return done(null, options);
				
				// no access
				done('No access.');
			});

		},
		
		delete_user : function (options, done) { 
			var account = options.user,
			    subject = options.subject;

			// if not createdBy self, pass to edit_other_user
			if (!api.access.is.createdBy(subject, account)) return api.access.to.delete_other_user(options, done);

			// if createdBy self, why the fuck not.. todo..
			done(null, options);
		},
		
		delete_other_user : function (options, done) { 
			var account = options.user,
			    subject = options.subject,
			    project = options.project,
			    ops = {};


			ops.super = function (callback) {
				api.access.is.superAdmin(options, callback);
			}

			ops.portal = function (callback) {
				api.access.is.portalAdmin(options, function (err, isPortal) {
					if (err || !isPortal) return callback(null, false);
					
					// if subject is not superadmin!
					api.access.is.superAdmin({
						user : subject
					}, function (err, subjectIsSuper) {
						if (err || subjectIsSuper) return callback(null, false);
						callback(null, options)
					});
				});
			}

			ops.able = function (callback) {
				api.access.to._check(options, 'delete_other_user', callback); // doenst really make sense.. todo!
			}

			async.series(ops, function (err, is) {

				// access
				if (is.super || is.portal || is.able) return done(null, options);
				
				// no access
				done('No access.');
			});

		},
		
		share_project : function (options, done) { 
			api.access.to._check(options, 'share_project', done);
		},
		
		read_analytics : function (options, done) { 
			api.access.to._check(options, 'read_analytics', done);
		},
		
		manage_analytics : function (options, done) { 
			api.access.to._check(options, 'manage_analytics', done);
		},
		
		delegate_to_user : function (options, done) { 
			api.access.to._check(options, 'delegate_to_user', done);
		},

	},

	superadmin : function (user) {
		return (api.access.superusers.indexOf(user.uuid) >= 0)
	}

}



// // convenience method for checking hardcoded super user
// function superadmin(user) {
// 	if (api.access.superusers.indexOf(user.uuid) >= 0) return true;
// 	return false;
// }