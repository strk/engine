Wu.User = Wu.Class.extend({ 

	initialize : function (store) {
		this.store = store;
		this.lastSaved = _.cloneDeep(store);
	},

	// set functions
	setLastName : function (value) {
		this.store.lastName = value;
		this.save();
	},

	setFirstName : function (value) {
		this.store.firstName = value;
		this.save();
	},

	setCompany : function (value) {
		this.store.company = value;
		this.save();
	},

	setPosition : function (value) {
		this.store.position = value;
		this.save();
	},

	setPhone : function (value) {
		this.store.phone = value;
		this.save();
	},

	setMobile : function (value) {
		this.store.mobile = value;
		this.save();
	},

	setEmail : function (value) {
		this.store.local.email = value;
		this.save();
	},


	setKey : function (key, value) {
		if (key == 'lastName' ) return this.setLastName(value);
		if (key == 'firstName') return this.setFirstName(value);
		if (key == 'company'  ) return this.setCompany(value);
		if (key == 'position' ) return this.setPosition(value);
		if (key == 'mobile'   ) return this.setMobile(value);
		if (key == 'phone'    ) return this.setPhone(value);
		if (key == 'email'    ) return this.setEmail(value);
	},

	setAccess : function (project) {
		// console.log('setAccess to new proejct: ', project);
		// todo!
	},


	// save 
	save : function (key) {
		
		// clear timer
		if (this._saveTimer) clearTimeout(this._saveTimer);

		// save changes on timeout
		var that = this;
		this._saveTimer = setTimeout(function () {
		
			// find changes
			var changes = that._findChanges();
			
			// return if no changes
			if (!changes) return;

			that._save(changes);
		
		}, 1000);       // don't save more than every goddamed second

	},

	_save : function (changes) {
		if (app.activeProject) changes.project = app.activeProject.getUuid(); // for edit_user access, may need project...
		Wu.save('/api/user/update', JSON.stringify(changes)); 
	},




	attachToApp : function () {
		app.Users[this.getUuid()] = this;
	},




	deleteUser : function (context, callback) {

		// delete in local store
		delete app.Users[this.store.uuid];

		// delete on server
		var uuid = this.store.uuid;
		var json = JSON.stringify({ 
			uuid : uuid
		});

		// post              path          data           callback        context of cb
		Wu.Util.postcb('/api/user/delete', json, context[callback], context);

	},

	// set project access
	delegateAccess : function (project, role, add) {

		// save to server, only specific access
		var access = {
			userUuid    : this.getUuid(),
			projectUuid : project.getUuid(),
			// clientUuid  : project.getClientUuid(),
			role        : role, // eg. 'reader'
			add         : add // true or false
		}

		// post              path 	             data               callback     context of cb
		Wu.Util.postcb('/api/user/delegate', JSON.stringify(access), this.delegatedAccess, this);

		// this._saveAccess(access)
		app.setSaveStatus();
	},

	delegatedAccess : function (context, result) {

	},

	// convenience methods
	addReadProject : function (project) {

		// save to server, only specific access
		this.delegateAccess(project, 'reader', true);

		// add access locally
		this.store.role.reader.projects.push(project.getUuid());

	},

	removeReadProject : function (project) {

		// save to server, only specific access
		this.delegateAccess(project, 'reader', false);

		// remove access locally
		_.remove(this.store.role.reader.projects, function (p) {
			return p == project.getUuid();
		});
	},

	addUpdateClient : function (client) {
		
		// save to server, only specific access
		// this.delegateAccess(client, 'editor', true);

		// add access locally
		this.store.role.editor.clients.push(client.getUuid());
	},

	addUpdateProject : function (project) {
		
		// save to server, only specific access
		this.delegateAccess(project, 'editor', true);

		// add access locally
		this.store.role.editor.projects.push(project.getUuid());
	},

	removeUpdateProject : function (project) {

		// save to server, only specific access
		this.delegateAccess(project, 'editor', false);

		// remove access
		_.remove(this.store.role.editor.projects, function (p) {
			return p == project.getUuid();
		});
	},


	addManageProject : function (project) {
		// save to server, only specific access
		this.delegateAccess(project, 'manager', true);

		// add access locally
		this.store.role.manager.projects.push(project.getUuid());
	},

	removeManageProject : function (project) {

		// save to server, only specific access
		this.delegateAccess(project, 'manager', false);

		// remove access
		_.remove(this.store.role.manager.projects, function (p) {
			return p == project.getUuid();
		});
	},


	addProjectAccess : function (project) {
		// add access locally
		var uuid = project.getUuid();
		this.store.role.editor.projects.push(uuid);
		this.store.role.reader.projects.push(uuid);
		this.store.role.manager.projects.push(uuid);
	},

	removeProjectAccess : function (project) {
		// remove access locally
		_.remove(this.store.role.manager.projects, function (p) {
			return p == project.getUuid();
		});
		_.remove(this.store.role.editor.projects, function (p) {
			return p == project.getUuid();
		});
		_.remove(this.store.role.reader.projects, function (p) {
			return p == project.getUuid();
		});
	},


















	
	// get functions
	getKey : function (key) {
		return this.store[key];
	},

	getFirstName : function () {
		return this.store.firstName;
	},

	getLastName : function () {
		return this.store.lastName;
	},

	getFullName : function () {
		return this.store.firstName + ' ' + this.store.lastName;
	},

	getName : function () {
		return this.getFullName();
	},

	getCompany : function () {
		return this.store.company;
	},

	getPosition : function () {
		return this.store.position;
	},

	getPhone : function () {
		return this.store.phone;
	},

	getMobile : function () {
		return this.store.mobile;
	},

	getEmail : function () {
		return this.store.local.email;
	},

	getProjects : function () {
		// get projects which user has a role in
		var allProjects = app.Projects;

		// return all if admin
		if (app.access.is.admin(this)) return _.values(allProjects);

		var projects = [];

		_.each(allProjects, function (p) {

			var roles = p.getRoles();

			_.each(roles, function (r) {
				if (r.hasMember(this)) projects.push(p);
			}, this)

		}, this);

		return projects;


	},

	getProjectsByRole : function () {
		var projects    = {};
		projects.read   = this.store.role.reader.projects;
		projects.update = this.store.role.editor.projects;
		projects.manage = this.store.role.manager.projects;
		return projects;
	},

	getClients : function () {
		var clients = {};
		clients.read = this.store.role.reader.clients;
		clients.update = this.store.role.editor.clients;
		return clients;
	},

	getUuid : function () {
		return this.store.uuid;
	},












	// find changes to user.store for saving to server. works for two levels deep // todo: refactor, move to class?
	_findChanges : function () {
		var clone   = _.cloneDeep(this.store);
		var last    = _.cloneDeep(this.lastSaved);
		var changes = [];
		for (c in clone) {
			if (_.isObject(clone[c])) {
				var a = clone[c];
				for (b in a) {
					var d = a[b];
					equal = _.isEqual(clone[c][b], last[c][b]);
					if (!equal) {
						var change = {}
						change[c] = {};
						change[c][b] = clone[c][b];
						changes.push(change);
					}
				}
			} else {
				var equal = _.isEqual(clone[c], last[c]);
				if (!equal) {
					var change = {}
					change[c] = clone[c];
					changes.push(change);
				}
			}
		}
		if (changes.length == 0) return false; // return false if no changes
		var json = {};
		changes.forEach(function (change) {
			for (c in change) { json[c] = change[c]; }
		}, this);
		json.uuid = this.getUuid();
		this.lastSaved = _.cloneDeep(this.store);  // update lastSaved
		return json;
	},

});