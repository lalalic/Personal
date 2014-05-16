/**
 *  @module Database Schema
 *  @requires Backbone 
 */
define(['app','Plugin','JSZip','UI'],function(app,Plugin,JSZip,UI){
	(function(root){
		Backbone.Collection.prototype.url=function(){
			if(this.model){
				var root=this.model.prototype.urlRoot
				if(_.isString(root))
					return this.model.Collection.prototype.url=root;
				else if(_.isFunction(root))
					return this.model.Collection.prototype.url=(new this.model()).urlRoot()
			}
		}
		Backbone.Collection.prototype.parse=function(response){
			return response.results
		}
		
		var _sync=Backbone.Collection.prototype.sync
		Backbone.Collection.prototype.sync=function(method, model, opt){
			method=="read" && this.query && (opt.data=this.query.toURL())
			return _sync.apply(this,arguments)
		}
		
		var currentUser, DEFINES={},
		Model=root.Model=Backbone.Model.extend(/** @lends app.Model.prototype */{
			version:'1',
			className:'_unknown',
			validate: function(attrs){
				var error={}, failed=false
				_.each(attrs,function(key,value){
					if(value!=null && this.schema && this.schema[key]){
						var dataType=this.schema[key].type
						if(Model.types[dataType]){
							try{
								attrs[key]=Model.types[dataType](value)
							}catch(e){
								error[key]=e
								failed=true
							}
						}
					}
				},this)
				if(failed)
					return error
			},
			urlRoot: function(){
				return this.version+"/classes/"+this.className
			},
			parse:function(data){
				_.each(this.schema,function(schema, name){
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
				return Backbone.Model.prototype.save.apply(this,arguments).then(_.bind(function(){return this},this))
			},
			schema:{
				'createdAt':{type:'Date'},
				'updatedAt':{type:'Date'},
				'id':{type:'Integer'},
				'ACL':{type:'Object'}
			}
			
		},/** @lends app.Model */{
			/**
			 *  set schema
			 */
			setSchema: function(schema){
				this.prototype.className=schema.get('name')
				this.prototype.schema=_.clone(Model.prototype.schema)
				_.each(schema.get('fields'),function(metadata){
					this[metadata.name]=metadata
				},this.prototype.schema)
				return this
			},
			/**
			 *  create collection of Model
			 */
			collection:function(models, options){
				if(!this.Collection)
					this.Collection=Backbone.Collection.extend({model:this})
				var a=new this.Collection(models, options)
				a.query=new Query(this)
				return a
			},
			/**
			 *  convert from string to type-safed value
			 *  @readonly
			 *  @enum {Function} 
			 */
			types:{//convert from input to javascript data
				Integer: function(value){
					return parseInt(value)
				},
				Float: function(value){
					return parseFloat(value)
				},
				Boolean: function(value){
					switch(value.toLowerCase()){
					case 'true':
						return true
					case 'false':
						return false
					default:
						return true && value
					}
				},
				Date: function(value){
					return Date.from(value)
				},
				Array: function(value){
					return JSON.parse(value)
				},
				Object: function(value){
					return JSON.parse(value)
				}
			},
			/**
			 *  supported data types
			 *  @memberof app.Model
			 *  @type {string[]}
			 */
			DATATYPE:'String,Integer,Float,Boolean,Date,File,GeoPoint,Array,Object,Pointer'.split(','),
			create: function(kind,data,opt){
				return new (DEFINES[kind] || (DEFINES[kind]=Model.extend({className:kind})))(data,opt)
			}
		})
		
		Model.extend=_.aop(Model.extend,function(_extend){
			return function(instanceProperties, classProperties){
				return DEFINES[instanceProperties.className]=_extend.apply(this,arguments)
			}
		})

		var 
		User=root.User=Model.extend(/** @lends app.User.prototype*/{
			className:'_user',
			urlRoot: function(){
				return this.version+'/users'
			},
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
					this.logOut()
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
			logOut: function(){
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
			logOut:function(){
				return User.current().logOut()
			},
			/**
			 *  @returns {Promise}
			 */
			requestPasswordReset:function(email){
				return User.current().requestPasswordReset(email)
			}
		}),
		Role=root.Role=Model.extend(/** @lends app.Role.prototype */{
			className:'_role',
			urlRoot: function(){
				return this.version+'/roles'
			}
		}),
		Schema=root.Schema=Model.extend(/** @lends app.Schema.prototype */{
			className:'_schema',
			urlRoot: function(){
				return this.version+'/schemas'
			},
			/**
			 *  @returns {Promise}
			 */
			addColumn:function(column){
				return Backbone.sync('update',this, {
					context:this,
					url:this.urlRoot()+'/'+this.id+'/column',
					attrs:column
				}).then(function(){
					var fields=this.get('fields'), i=fields.length-3
					fields.splice(i,0,column)
					this.trigger('addColumn',column, i)
				})
			}
		},{
			upload:function(data){
				return $.ajax({
					url: this.prototype.version+'/schemas/import',
					type:'post',
					contentType:'application/json;charset=UTF-8',
					data:data
				})
			}
		}),
		File=root.File=Model.extend({
				className:"_file",
				urlRoot:function(){
					return this.version+'/files'
				},
				save: function(callback){
					var me=this,
						data=new FormData();
					data.append('file',this.toBlob())
					return $.ajax({
							url: File.want2upload(callback),
							data:data,
							cache: false,
							contentType : false,
							processData: false,
							type: 'POST',
							dataFilter:function(data,type){
								me.set('url',data)
								me.unset('data')
								me.unset('name')
								return null
							}
						}).then(function(){
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
					return _.isString(data) 
						? new Blob([this.toArrayBuffer()],{type:this.get('type')})
						: data
				},
				url: function(){
					return this.get('url')
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
					return $.ajax((new app.File()).urlRoot()
									+'/want2upload'+(callback && encodeURIComponent(("/"+callback).replace('//','/'))),
									{async:false,dataType:'text'}).responseText
				}
			}),
		PluginModel=root.Plugin=Model.extend({
			className:'_plugin',
			urlRoot: function(){
				return this.version+'/plugins'
			},
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
					var zip=new JSZip(data)
					zip.file("cloud/main.js",this.get('cloudCode'),{type:'text'})
					UI.util.save(zip,this.get('name')+".zip","application/zip")
				},this))	
			}
		}),
		Query=root.Query=_.newClass(function (objectClass) {
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
				q.where=JSON.stringify(q.where)
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
		
		_.has(this,'navigator') && _.extend(root,{
			/**
			 *  service endpoint
			 *  @type {string}
			 *  @default http://localhost
			 *  @example
			 *  app.start({service:'http://a.com'})
			 */
			service: location.protocol=='file:' ? 'http://localhost/' : '/',
			startUI: _.aop(root.startUI,function(_raw){
				return function(){
					$.ajaxSetup({
						dataType:'json',
						headers: {"X-Application-Id": this.apiKey},
						beforeSend: function(xhr, setting){
							root.service && !(/^https?\:/i.test(setting.url)) && (setting.url=(root.service+setting.url).replace('//','/'))
							var data=setting.data
							if(setting.data){
								delete data.createdAt
								delete data.updatedAt
							}
						}
					})
					return _raw.apply(this,arguments)
				}
			}),
			/**
			 *  create new kind of entity
			 *  @param {object:Model} schema - entity schema with name and fields properties, field is with name,type,[searchable,and unique] properties
			 *  @param {object} [properties] - instance properties
			 *  @param {object} [classProperties] - class properties
			 *  @returns {app.Model}
			 */
			createKind:function(schema, properties, classProperties){
				return Model.extend(properties||{className:schema.get('name')}, classProperties).setSchema(schema)
			},
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
	})(app)
})