/**
 * it's an application singleton instance
 * @namespace app
 * @requires jQuery
 * @requires Underscore 
 * @requires Backbone 
 */
define(['module','jQuery','Underscore','Backbone'], function(module, $, _, Backbone){
	(function(){
		$.os=$.extend($.os||{},{phonegap:_.has(window,'_cordovaNative')})
		window.reject=function(p){return function(e){p.reject()}}
		/**
		 * the built-in Array class 
		 * @external Array
		 */
		/**
		 *  shortcut to create model requires array for models in a parent folder
		 *  @function external:Array.prototype.add
		 *  @param {string} parent directory
		 *  @param {string} relative module names seperated by comma
		 *  @example
		 *  //the result is ["jQuery","Backbone", "pluginA/module1", "pluginA/module2"]
		 *  ["jQuery","Backbone"].add('pluginA/','module1,module2')
		 */
		Array.prototype.add=function(base,a){
			return a&&a.length ? this.concat(_.map(a.split(','),function(one){
				return base+one
			})) : this;
		}
		/**
		 * the built-in Date
		 * @external Date
		 */
		/**
		 *  format date smartly as "10 seconds/minutes/hours ago"/yesterday/2000-10-10
		 *  @function external:Date.prototype.toSmartString
		 */
		Date.prototype.toSmartString=function(){
			var delta=parseInt((new Date().getTime()-this.getTime())/1000),
				aday=24*60*60
			if(delta<aday){
				if(delta<60)
					return delta+" "+text('seconds ago')
				else if(delta<60*60)
					return parseInt(delta/60)+" "+text('minutes ago')
				else
					return parseInt(delta/60/60)+" "+text('hours ago')
			}else if (delta<aday*2)
				return text('yesterday')
			else
				return (this.getMonth()+1)+"-"+(this.getDay()+1)
		}
		
		/**
		 *  format date as YYYY-mm-dd H:m
		 *  @function external:Date.prototype.toString
		 */
		Date.prototype.toString=function(){
			return this.getFullYear()+"-"+(this.getMonth()+1)+"-"+(this.getDay()+1)
			+" "+this.getHours()+":"+(this.getMinutes()+1)
		}
		Date.regFrom=/[-\s+:]/
		/**
		 *  parse string (YYYY[-mm[-dd[ H[:m[:s]]]]]) to date
		 *  @function external:Date.from
		 *  @param {string}
		 */
		Date.from=function(s,d){
			var date=new Date()
			switch((d=s.split(Date.regFrom)).length){
			case 6:
				date.setSeconds(parseInt(d[6]))
			case 5:
				date.setMinutes(parseInt(d[5]))
			case 4:
				date.setHours(parseInt(d[4]))
			case 3:
				date.setDate(parseInt(d[3]))
			case 2:
				date.setMonth(parseInt(d[2]))
			case 1:
				date.setYear(parseInt(d[1]))
				break
			default:
				throw s +" is illegal date"
			}
			return date
		}
		/**
		 * the built-in Object
		 * @external Object
		 */
		/**
		 *  create new class with Backbone.Events capabilities
		 *  @function exteneral:Object.extend
		 *  @param {Function} constructor
		 *  @param {Object} instance properties
		 *  @param {Object} class properties
		 *  @return new class
		 */
		Object.extend = function (constructor, properties, classProperties) {
			_.extend(constructor.prototype, Backbone.Events, properties)
			_.extend(constructor, classProperties)
			return constructor;
		}
		
		var _debug=console.debug
		console.debug=function(m){
			if(app.debug)
				_debug.apply(console,arguments)
		}
		
		$.isOffline=function(){
			if(location.protocol.match(/^file/))
				return (Date.now()-$.isOffline.lastCheckAt)<5000
			return false
		}
		
		//check offline status
		$.isOffline.lastCheckAt=0
		var _$ajax=$.ajax,
			fallback=function(e){
				if(e.status==0)
					$.isOffline.lastCheckAt=Date.now()
			}
		$.ajax=function(options){
			if(options.error){
				var _error=options.error
				options.error=function(xhr){
					fallback(xhr)
					_error.apply(this,arguments)
				}
			}else
				options.error=fallback
			return _$ajax.apply(this,arguments)
		}
		
		//extend _.template
		_.templateSettings = {
			evaluate    : /<%([\s\S]+?)%>/g,
			interpolate : /\{\{([\s\S]+?)\}\}/g,
			escape      : /\{\{\{([\s\S]+?)\}\}\}/g
		  };
		
		var _template=_.template, templates={}
		_.template=function(text,data,setting){//make template support id selector
			if(text.charAt(0)=='#'){
				var name=text.substr(1);
				if(!(name in templates)){
					templates[name]=_template($(text).html())
					$(text).remove()
				}
				if(data!=undefined)
					return templates[name](data,setting)
				return templates[name]
			}else
				return _template(text,data,setting)
		}
		/**
		 *  shortcut to get a Model super class
		 *  <br><b>Backbone.View</b> and <b>Backbone.Collection</b> have the same function
		 *  @function external:Backbone.Model.prototype._super
		 */
		Backbone.View.prototype._super=
		Backbone.Collection.prototype._super=
		Backbone.Model.prototype._super=function(a){
			if(this.__proto__==this.__proto__.constructor.__super__)
				throw "no _super on this class";
			return this.__proto__.constructor.__super__
		}
		
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
	})();
	
	var currentUser,
		Model=Backbone.Model.extend(/** @lends app.Model.prototype */{
				version:'1',
				className:'_unknown',
				get:function(name){
					if(name=='id'||name=='createdAt'||name=='updatedAt')
						return this[name]
					return Backbone.Model.prototype.get.apply(this,arguments)
				},
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
				toJSON: function(){
					var a=Backbone.Model.prototype.toJSON.apply(this,arguments)
					_.each(['id','createdAt','updatedAt'],function(attr){
						if(_.has(this,attr))
							a[attr]=this[attr]
					},this)
					return a
				},
				urlRoot: function(){
					return this.version+"/classes/"+this.className
				},
				parse:function(data){
					if(_.has(data,'id')){
						this.id=data.id
						delete data.id
					}
					if(_.has(data,'updatedAt')){
						this.updatedAt=new Date()
						this.updatedAt.setTime(Date.parse(data.updatedAt))
						delete data.updatedAt
					}
					if(_.has(data,'createdAt')){
						this.createdAt=new Date()
						this.createdAt.setTime(Date.parse(data.createdAt))
						delete data.createdAt
					}
					return data
				},
				/**
				 *  @function
				 */
				patch: function(){
					var patchs=arguments.length==0 ? this.changedAttributes() : this.pick.apply(this,arguments)
					return this.save(null,{attrs:patchs})
				}
			},/** @lends app.Model */{
				/**
				 *  set schema
				 */
				setSchema: function(schema){
					this.prototype.className=schema.get('name')
					this.prototype.schema={}
					_.each(schema.get('fields'),function(metadata){
						this[metadata.name]=metadata
					},this.prototype.schema)
					return this
				},
				/**
				 *  create collection of Model
				 */
				collection:function(){
					if(!this.Collection)
						this.Collection=Backbone.Collection.extend({model:this})
					return new this.Collection()
				},
				/**
				 *  convert from string to type-safed value
				 *  @readonly
				 *  @enum {Function} 
				 */
				types:{
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
				DATATYPE:'String,Integer,Float,Boolean,Date,File,GeoPoint,Array,Object,Pointer'.split(',')
			}),
		app=_.extend(/** @lends app*/{
			/**
			* application title shown as title of page
			*/
			title:'Application',
			/**
			 *  service endpoint
			 *  @type {string}
			 *  @default http://localhost
			 *  @example
			 *  app.start({service:'http://a.com'})
			 */
			service: location.protocol=='file:' ? 'http://localhost/' : '/',
			version:'0.01',
			/**
			 *  application public key distributed by service provider
			 *  @type {string}
			 *  @example 
			 *  app.start({apiKey:"xxx"})
			 */
			apiKey:'',
			/**
			 *  Plugins which should be loaded before application starts
			 *  @type {string}
			 *  @example 
			 *  //pluginA, PluginB, and pluginC must be loaded before application starts
			 *  app.start({plugins:"pluginA,pluginB,pluginC"})
			 */
			plugins:'starter',
			/**
			 *  debug switch
			 *  @type {boolean}
			 *  @example 
			 *  app.start({debug:true})
			 */
			debug:false,
			/**
			 *  aside UI model name, which would be loaded automatically when start app
			 *  @type {string}
			 *  @example
			 *  app.start({asideView:'view/aside'})
			 */
			asideView:false,
			/**
			 *  shortcut UI model name, which would be loaded automatically when starts app. shortcut UI is usually a list shown when click top-right user icon, which usually can be seen for signed-in user.
			 *  @type {string}
			 *  @example
			 *  app.start({shortcutView:'view/friendlist'})
			 */
			shortcutView:false,
			/**
			 *  it's whole application entry point. It would load depended plugins, and creates routes, then start UI
			 *  @param {object} configuration of application
			 *  @default false
			 *  @example 
			 *  app.start({
			 *  	apiKey:"",
			 *  	debug: true,
			 *  	plugins:"pluginA,pluginB,pluginC",
			 *  	author: "null tech"
			 *  })
			 */
			start: function(opt){
				$(window).bind('resize',function(){
					if($('#media').length==0)
						$('body').append('<div id="media" class="outview"></div>')
					$.media=$('#media').width()==1 ? 'phone' : 'tablet'
					$('body').data('device',$.media)
				}).resize()
				
				require(['view/splash','i18n!nls/all'].add('Plugin!',this.plugins),function(splash,i18n){
					_.extend(this,module.config(),opt||{})
				
					$.ajaxSetup({
						dataType:'json',
						headers: {"X-Application-Id": app.apiKey},
						beforeSend: function(xhr, setting){
							setting.url=app.service+setting.url
							var data=setting.data
							if(setting.data){
								delete data.createdAt
								delete data.updatedAt
							}
						}
					})
					/**
					 * translate string to local string
					 * @global
					 */
					window.text=function(a, b){
						return  a ? (((b=a.toLowerCase()) in i18n) ? i18n[b] : (i18n[b]=a)) : ''
					}
					app.title=document.title=text(app.title)
					splash.show()
					var _start=function(){
							Backbone.history.start()
							splash.remove()
						},
						p=app.init()

					app.asideView && (p=p.then(function(){
						var p=new $.Deferred()
						require([app.asideView],function(aside){
							aside[$.media=='tablet' ? 'show' : 'hide']()
							p.resolve()
						})
						return p
					}))
					
					
					app.shortcutView && (p=p.then(function(){
						var p=new $.Deferred()
						require([app.shortcutView],function(){
							p.resolve()
						})
						return p
					}))
					
					p.then(_start,_start)
				})
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
				return currentUser!=null
			},
			
			/**
			 *  add UI route
			 *  @param {string} name - route name
			 *  @param {string} url - hash part without #
			 *  @param {string} view - view module name
			 *  @param {boolean} needLogin - show login page if true and isLoggedIn returns false
			 */
			route: function(name, url, view, needLogin){
				router.route(url, name, function(){
					if(needLogin && !app.isLoggedIn())
						require(['view/user'],function(page){page.show('signin')})
					else{
						var args=arguments
						require([view],function(page){page.show.apply(page,args)})
					}
				})
			},
			
			/**
			 *  navigate to a url
			 *  @param {string} url - hash without #
			 *  @param {object} opt - {@link Backbone.Route#navigate}
			 */
			navigate:function(url, opt){
				router.navigate(url, opt)
			},
			
			/**
			 *  create new kind of entity
			 *  @param {object:Model} schema - entity schema with name and fields properties, field is with name,type,[searchable,and unique] properties
			 *  @param {object} [properties] - instance properties
			 *  @param {object} [classProperties] - class properties
			 *  @returns {app.Model}
			 */
			createKind:function(schema, properties, classProperties){
				return Model.extend(properties, classProperties).setSchema(schema)
			},
			/**
			 *  Base Model, all kinds of entity must be extends from this base model
			 *  @class
			 *  @augments Backbone.Model
			 *  @see {@link http://backbonejs.org#Model}
			 */
			Model:Model,
			/**
			 *  User Model
			 *  @augments app.Model
			 *  @class
			 */
			User: Model.extend(/** @lends app.User.prototype*/{
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
						url:'1/login',
						method:'get',
						data:this.toJSON()
					}).then(function(user){
						delete this.attributes.password
						this.set(this.parse(user),{silent:true})
						localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
						return currentUser=this
					})
				},
				/**
				 *  @returns {Promise}
				 */
				verify:function(){
					return $.ajax({
						context:this,
						timeout:20000,
						url:'1/me',
						method:'get',
						headers:{"X-Session-Token":localStorage.getItem('sessionToken')}
					}).then(function(user){
						this.set(user,{parse:true,silent:true})
						localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
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
						url:'1/requestPasswordReset',
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
			/**
			 *  Role Model
			 *  @augments app.Model
			 *  @class
			 */
			Role: Model.extend(/** @lends app.Role.prototype */{
				className:'_role',
				urlRoot: function(){
					return this.version+'/roles'
				}
			}),
			/**
			 *  Schema Model
			 *  @augments app.Model
			 *  @class
			 */
			Schema: Model.extend(/** @lends app.Schema.prototype */{
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
			}),
			/**
			 *  class Query to search models from server
			 *  @augments app.Query
			 *  @class
			 */
			Query: Object.extend(function (objectClass) {
				this.objectClass = objectClass;
				this._where = {};
				this._include = [];
				this._limit = -1; // negative limit means, do not send a limit
				this._skip = 0;
				this._extraOptions = {};
			}, /** @lends app.Query.prototype */{
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
				/**
				 * fetch objects from server
				 * @return {Promise}
				 */
				fetch : function () {
					return $.ajax({
						context : this,
						url : (new this.objectClass).urlRoot(),
						type : 'get',
						data : this.toJSON()
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
						data : _.extend(this.toJSON(), {
							limit : 0,
							count : 1
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
						data : _.extend(this.toJSON(), {
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
			}, /** @lends app.Query */{}),
		},Backbone.Events),
		User=app._user=app.User,
		Role=app._role=app.Role,
		Schema=app._schema=app.Schema,
		Query=app.Query
	
	//router
	var router=new Backbone.Router
	_.each([//route name, url, view name[,user]
		'main,,view/main',
		'account,account,view/user',
		'test,test,view/test',
		'features,features,view/features',
		'syncOffline,sync,view/sync,true'],function(r){
		app.route.apply(app,r.split(','))
	})
	return app
})