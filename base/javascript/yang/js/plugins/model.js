/**
 *  @module Database Schema
 *  @requires Backbone 
 */
 
define(['app'],function(app){
	$.extend(Backbone.Collection.prototype,{
		url : function(){
			if(this.model){
				var root=this.model.prototype.urlRoot
				if(_.isString(root))
					return this.model.Collection.prototype.url=root;
				else if(_.isFunction(root))
					return this.model.Collection.prototype.url=(new this.model()).urlRoot()
			}
		},
		parse : function(response){
			return response.results
		},
		sync : $.aop(Backbone.Collection.prototype.sync, function(_sync){
			return function(method, model, opt){
				method=="read" && this.query && (opt.data=this.query.toURL())
				return _sync.apply(this,arguments)
			}
		})
	});
	
	var currentUser, DEFINES={},
	Model=app.Model=Backbone.Model.extend(/** @lends app.Model.prototype */{
		version:'1',
		idAttribute:"_id",
		className:'_unknown',
		urlRoot: function(){
			return this.version+"/classes/"+this.className
		},
		parse:function(data){
			data && _.each(this.schema,function(schema, name){
				if(data[name]!=undefined){
				switch(schema.type){
				case 'Date':
					data[name]=new Date(data[name])
					break
				}}
			})
			return data
		},
		get: function(name){
			var value=Backbone.Model.prototype.get.call(this,name)
			if(value && _.has(value,'__op')){
			switch(value.__op){
			case 'Increment':
				return value.guess;
			}}
			return value
		},
		increment: function(name,amount){
			amount=_.isNumber(amount) ? amount : 1
			var value=Backbone.Model.prototype.get.call(this,name)
			if(_.isNull(value) || _.isUndefined(value))
				value={__op:"Increment", amount:amount, guess:amount}
			else if(_.isNumber(value))
				value={__op:"Increment", amount:amount, guess:value+amount}
			else {
				value.amount+=amount;
				value.guess+=amount;
			}
			this.set(name,value)
		},
		addUnique: function(name,value){
			this.set(name,_.union(this.attributes[name]||[], _.isArray(value)? value : [value]))
		},
		remove: function(name,value){
			this.set(name,_.difference(this.attributes[name]||[],_.isArray(value)? value : [value]))
		},
		fetch: function(){
			return Backbone.Model.prototype.fetch.apply(this,arguments).then(_.bind(function(){ return this},this))
		},
		save: function(){
			return Backbone.Model.prototype.save.apply(this,arguments).then(_.bind(function(){this.changed={};return this},this))
		},
		getUrl: function(name){
			return this.get(name)||""
		},
		schema:{
			'createdAt':{type:'Date'},
			'updatedAt':{type:'Date'}
		}
	},/** @lends app.Model */{
		/**
		 *  create collection of Model
		 */
		collection:function(models, options){
			if(!this.Collection)
				this.Collection=Backbone.Collection.extend({model:this})
			var a=new this.Collection(models, options)
			a.query=new Query(this)
			return a
		}
	})
	
	Model.extend=$.aop(Model.extend,function(_extend){
		return function(instanceProperties, classProperties){
			return DEFINES[instanceProperties.className] || (DEFINES[instanceProperties.className]=_extend.apply(this,arguments))
		}
	})

	var 
	_internalModel=Model.extend({
		urlRoot:function(){
			return this.version+"/"+this.className
		}
	})
	User=app.User=_internalModel.extend(/** @lends app.User.prototype*/{
		className:'users',
		parse: function(r){
			var attrs=this._super().parse.apply(this,arguments)
			if(_.has(attrs,'sessionToken')){
				localStorage.setItem('sessionToken',attrs.sessionToken)
				delete attrs.sessionToken
			}
			return attrs
		},
		/**
		 *  @returns {Promise}
		 */
		signUp:function(){
			return this.save()
			.then(_.bind(function(user){
				localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
				return currentUser=this
			},this))
		},
		/**
		 *  @returns {Promise}
		 */
		logIn: function(){
			return $.ajax({
				context:this,
				url:this.version+'/login',
				method:'get',
				data:this.toJSON()
			}).then(function(user){
				this.set(user,{parse:true,silent:true})
				localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
				return currentUser=this
		})
		},
		/**
		 *  @returns {Promise}
		 */
		verify:function(){
			if(!localStorage.getItem('sessionToken'))
				return
			return $.ajax({
				context:this,
				timeout:20000,
				url:this.version+'/me',
				method:'get',
				headers:{"X-Session-Token":localStorage.getItem('sessionToken')}
			}).then(function(user){
				this.set(user,{parse:true,silent:true})
				localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
				$.ajaxSetup({headers:{"X-Session-Token":localStorage.getItem('sessionToken')}})
				return currentUser=this
			},function(e){
				this.logout()
				return e
			})
		},
		/**
		 *  @returns {Promise}
		 */
		requestPasswordReset:function(email){
			return $.ajax({
				url:this.version+'/requestPasswordReset',
				type:'json',
				method:'POST',
				data:this.toJSON()
			})
		},
		/**
		 *  @instance
		 */
		logout: function(){
			currentUser=null
			localStorage.removeItem('currentUser')
			localStorage.removeItem('sessionToken')
			localStorage.removeItem('JSESSIONID')
			location.reload()
		}
	},/** @lends app.User */{
		/**
		 *  @returns {app.User}
		 */
		current:function(){
			var user=localStorage.getItem('currentUser')
			if(user!=null){
				if(currentUser==null)
					currentUser=new User(JSON.parse(user),{parse:true})
				return currentUser
			}else
				return null
		},
		/**
		 *  @returns {Promise}
		 */
		logout:function(){
			return User.current().logout()
		},
		/**
		 *  @returns {Promise}
		 */
		requestPasswordReset:function(email){
			return User.current().requestPasswordReset(email)
		}
	}),
	Role=app.Role=_internalModel.extend(/** @lends app.Role.prototype */{
		className:'roles'
	}),
	Schema=app.Schema=_internalModel.extend(/** @lends app.Schema.prototype */{
		className:'schemas'
	}),
	File=app.File=_internalModel.extend(/** @lends app.File.prototype*/{
			className:"files",
			save: function(opt){
				var me=this,data=new FormData();
				data.append('file',this.toBlob())
				data.append('key',this.get('name'))
				data.append('token', File.want2upload(opt))
				return $.ajax({
						url: this.urlRoot(),//"http://up.qiniu.com",
						data:data,
						cache: false,
						contentType : false,
						processData: false,
						type: 'POST'
					}).then(function(data){
						me.set('key',data.key)
						me.unset('data')
						me.unset('name')
						return me
					})
			},
			toArrayBuffer: function(){
				var data=this.get('data'),
					buffer=new ArrayBuffer(data.length),
					bufferView=new Uint8Array(buffer);
				for(var i=0, len=data.length; i<len;i++)
					bufferView[i]=data.charCodeAt(i)
				return buffer
			},
			toBlob: function(){
				var data=this.get('data')
				data=_.isString(data) 
					? new Blob([this.toArrayBuffer()],{type:this.get('type')})
					: data;
				this.has('name') && (data.name=this.get('name'))
				return data;
			},
			url: function(){
				return this.get('url') || ("http://127.0.0.1/mobiengine/"+this.get('key'))
			},
			download: function(){
				var p=new $.Deferred
				$.ajax({
					url:this.url(),
					mimeType:'text/plain; charset=x-user-defined',
					processData:false,
					dataFilter:function(data,type){
						p.resolve(data)
						return null
					}
				})
				return p
			}
		},{
			want2upload: function(callback){
				return $.ajax((new app.File()).urlRoot()+'/want2upload',
								{async:false,dataType:'text'}).responseText
			}
		}),
	PluginModel=app.Plugin=_internalModel.extend(/** @lends app.PluginModel.prototype*/{
		className:'plugins',
		save: function(){
			if(this._clientCode){
				return new File({data:this._clientCode})
					.save()
					.then(_.bind(function(f){
						this.set('clientCode',f.url())
						delete this._clientCode
						return this._super().save.call(this)
					},this))
			}else
				return this._super().save.apply(this,arguments)
		},
		setClientCode: function(code){
			this._clientCode=code
		},
		setCloudCode: function(code){
			this.set('cloudCode',code,{silent:true})
		},
		download: function(){
			(new File({url:this.get('clientCode')}))
			.download()
			.then(_.bind(function(data){
				var JSZip=require('JSZip'),	zip=new JSZip(data);
				zip.file("cloud/main.js",this.get('cloudCode'),{type:'text'})
				require('UI').util.save(zip,this.get('name')+".zip","application/zip")
			},this))	
		}
	}),
	Query=app.Query=_.newClass(function (objectClass) {
			this.objectClass = objectClass;
			this._where = {};
			this._include = [];
			this._limit = -1; // negative limit means, do not send a limit
			this._skip = 0;
			this._extraOptions = {};
		},/** @lends app.Query.prototype */{
		/**
		 * Returns a JSON representation of this query.
		 * @return {Object} The JSON representation of the query.
		 */
		toJSON : function () {
			var params = {
				where : this._where
			}

			if (this._include.length > 0) {
				params.include = this._include.join(",");
			}
			if (this._select) {
				params.keys = this._select.join(",");
			}
			if (this._limit >= 0) {
				params.limit = this._limit;
			}
			if (this._skip > 0) {
				params.skip = this._skip;
			}
			if (this._order !== undefined) {
				params.order = this._order;
			}

			_.each(this._extraOptions, function (v, k) {
				params[k] = v;
			});

			return params;
		},
		toURL:function(){
			var q=this.toJSON()
			_.keys(q.where).length && (q.query=JSON.stringify(q.where))
			return q
		},
		/**
		 * fetch objects from server
		 * @return {Promise}
		 */
		fetch : function () {
			return $.ajax({
				context : this,
				url : (new this.objectClass).urlRoot(),
				type : 'get',
				data : this.toURL()
			}).then(function (r) {
				return _.map(r.results, function (json) {
					return new this.objectClass(json);
				}, this)
			})
		},
		/**
		 * Counts the number of objects that match this query.
		 * Either options.success or options.error is called when the count
		 * completes.
		 * @return {Promise} A promise that is resolved with the count when
		 * the query completes.
		 */
		count : function () {
			return $.ajax({
				context : this,
				url : (new this.objectClass).urlRoot(),
				type : 'get',
				data : _.extend(this.toURL(), {
					limit : 0,
					count : true
				})
			}).then(function (r) {
				return r.count
			})
		},
		/**
		 * Retrieves at most one Object that satisfies this query.
		 *
		 * @return {Promise} A promise that is resolved with the object when
		 * the query completes.
		 */
		first : function () {
			return $.ajax({
				context : this,
				url : (new this.objectClass).urlRoot(),
				type : 'get',
				data : _.extend(this.toURL(), {
					limit : 1
				})
			}).then(function (r) {
				return r.results.length ? new this.objectClass(r.results[0]) : null;
			})
		},
		/**
		 * Sets the number of results to skip before returning any results.
		 * This is useful for pagination.
		 * Default is to skip zero results.
		 * @param {Number} n the number of results to skip.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		skip : function (n) {
			this._skip = n;
			return this;
		},

		/**
		 * Sets the limit of the number of results to return. The default limit is
		 * 100, with a maximum of 1000 results being returned at a time.
		 * @param {Number} n the number of results to limit to.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		limit : function (n) {
			this._limit = n;
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be equal to the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that the Object must contain.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		equalTo : function (key, value) {
			if (_.isUndefined(value)) {
				return this.doesNotExist(key);
			}

			this._where[key] = value
			return this;
		},
		/**
		 * Helper for condition queries
		 * @private
		 * @ignore
		 */
		_addCondition : function (key, condition, value) {
			// Check if we already have a condition
			if (!this._where[key]) {
				this._where[key] = {};
			}
			this._where[key][condition] = value;
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be not equal to the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that must not be equalled.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		notEqualTo : function (key, value) {
			this._addCondition(key, "$ne", value);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be less than the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that provides an upper bound.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		lessThan : function (key, value) {
			this._addCondition(key, "$lt", value);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be greater than the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that provides an lower bound.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		greaterThan : function (key, value) {
			this._addCondition(key, "$gt", value);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be less than or equal to the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that provides an upper bound.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		lessThanOrEqualTo : function (key, value) {
			this._addCondition(key, "$lte", value);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be greater than or equal to the provided value.
		 * @param {String} key The key to check.
		 * @param value The value that provides an lower bound.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		greaterThanOrEqualTo : function (key, value) {
			this._addCondition(key, "$gte", value);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * be contained in the provided list of values.
		 * @param {String} key The key to check.
		 * @param {Array} values The values that will match.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		containedIn : function (key, values) {
			this._addCondition(key, "$in", values);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * not be contained in the provided list of values.
		 * @param {String} key The key to check.
		 * @param {Array} values The values that will not match.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		notContainedIn : function (key, values) {
			this._addCondition(key, "$nin", values);
			return this;
		},

		/**
		 * Add a constraint to the query that requires a particular key's value to
		 * contain each one of the provided list of values.
		 * @param {String} key The key to check.  This key's value must be an array.
		 * @param {Array} values The values that will match.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		containsAll : function (key, values) {
			this._addCondition(key, "$all", values);
			return this;
		},

		/**
		 * Add a constraint for finding objects that contain the given key.
		 * @param {String} key The key that should exist.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		exists : function (key) {
			this._addCondition(key, "$exists", true);
			return this;
		},

		/**
		 * Add a constraint for finding objects that do not contain a given key.
		 * @param {String} key The key that should not exist
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		doesNotExist : function (key) {
			this._addCondition(key, "$exists", false);
			return this;
		},

		/**
		 * Add a regular expression constraint for finding string values that match
		 * the provided regular expression.
		 * This may be slow for large datasets.
		 * @param {String} key The key that the string to match is stored in.
		 * @param {RegExp} regex The regular expression pattern to match.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		matches : function (key, regex, modifiers) {
			this._addCondition(key, "$regex", regex);
			if (!modifiers) {
				modifiers = "";
			}
			// Javascript regex options support mig as inline options but store them
			// as properties of the object. We support mi & should migrate them to
			// modifiers
			if (regex.ignoreCase) {
				modifiers += 'i';
			}
			if (regex.multiline) {
				modifiers += 'm';
			}

			if (modifiers && modifiers.length) {
				this._addCondition(key, "$options", modifiers);
			}
			return this;
		},
		/**
		 * Add a constraint for finding string values that contain a provided
		 * string.  This may be slow for large datasets.
		 * @param {String} key The key that the string to match is stored in.
		 * @param {String} substring The substring that the value must contain.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		contains : function (key, value) {
			this._addCondition(key, "$regex", this._quote(value));
			return this;
		},

		/**
		 * Add a constraint for finding string values that start with a provided
		 * string.  This query will use the backend index, so it will be fast even
		 * for large datasets.
		 * @param {String} key The key that the string to match is stored in.
		 * @param {String} prefix The substring that the value must start with.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		startsWith : function (key, value) {
			this._addCondition(key, "$regex", "^" + this._quote(value));
			return this;
		},

		/**
		 * Add a constraint for finding string values that end with a provided
		 * string.  This will be slow for large datasets.
		 * @param {String} key The key that the string to match is stored in.
		 * @param {String} suffix The substring that the value must end with.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		endsWith : function (key, value) {
			this._addCondition(key, "$regex", this._quote(value) + "$");
			return this;
		},

		/**
		 * Sorts the results in ascending order by the given key.
		 *
		 * @param {String} key The key to order by.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		ascending : function (key) {
			this._order = key;
			return this;
		},

		/**
		 * Sorts the results in descending order by the given key.
		 *
		 * @param {String} key The key to order by.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		descending : function (key) {
			this._order = "-" + key;
			return this;
		},
		/**
		 * Restrict the fields of the returned Objects to include only the
		 * provided keys.  If this is called multiple times, then all of the keys
		 * specified in each of the calls will be included.
		 * @param {Array} keys The names of the keys to include.
		 * @return {Query} Returns the query, so you can chain this call.
		 */
		select : function () {
			var self = this;
			this._select = this._select || [];
			_.each(arguments, function (key) {
				if (_.isArray(key)) {
					self._select = self._select.concat(key);
				} else {
					self._select.push(key);
				}
			});
			return this;
		},
	}, /** @lends app.Query */{})
	
	$.extend(app,{
		/**
		 *  service endpoint
		 *  @type {string}
		 *  @default http://localhost
		 *  @example
		 *  app.start({service:'http://a.com'})
		 */
		service: location.protocol=='file:' ? 'http://127.0.0.1/' : '/',
		startUI: $.aop(app.startUI,function(_raw){
			return function(){
				$.ajaxSetup({
					dataType:'json',
					headers: {"X-Application-Id": this.apiKey},
					beforeSend: function(xhr, setting){
						app.service && !(/^https?\:/i.test(setting.url)) 
							&& (setting.url=(app.service+setting.url).replace('//','/'))
					}
				})
				return _raw.apply(this,arguments)
			}
		}),
		/**
		 *  initialize application
		 *  @protected
		 *  @returns {Promise}
		 */
		init: function(){
			var user=this.User.current()
			return user ? this.init4User(user) : $.when(this)
		},
		/**
		 *  initialize user specific stuff
		 *  @protected 
		 *  @returns {Promise}
		 */
		init4User: function(user){
			return user.verify()
		},
		
		/**
		 *  @method
		 */
		isLoggedIn: function(){
			return this.User.current()!=null
		},
		logout: function(){
			this.User.logout()
		}
	})
})