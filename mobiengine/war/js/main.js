var plugins='',
	DEBUG=true
	
require.config({
	waitSeconds:30,
	baseUrl:'./js',
	urlArgs: "v=0.1",//+Date.now(),//VERSION,
	shim:{
		'Backbone': {
            deps: ['Underscore', 'jQuery'],
            exports: 'Backbone'
        },
        'Underscore': {
            exports: '_'
        },
		'jQuery':{
			exports:'jQuery'
		}
	},
	paths:{
		"JSZip":"lib/jszip.min",
		"jQuery":"lib/jquery.min",
		"Underscore":"lib/underscore-min",
		"Backbone":"lib/backbone-min",
		"i18n":"lib/i18n",
		"Phonegap":"file:///android_asset/www/phonegap.js",
		
		"UI":"view/base",
		"Plugin":"lib/plugin"
	},
	deps:['jQuery','app', 'model'],
	callback:function($, app, model){
		app.route('createApp','app','view/app',true)
		app.route('settings','settings','view/app',true)
		app.route('schema','data','view/data',true)
		app.route('analytics','analytics','view/analytics',true)
		app.route('cloudcode','cloudcode','view/cloudcode',true)
		
		var _init=app.init
		app.init=function(){
			return _init.apply(app,arguments)
				.then(function(){
					var p=new $.Deferred()
					require(['view/menu', 'view/applist'],function(aside){
						aside[$.media=='tablet' ? 'show' : 'hide']()
						p.resolve()
					})
					return p
				})
		}
		
		$(function () {
			app.start({apiKey:'aglub19hcHBfaWRyCgsSBF9hcHAYAQw'})
		})
	}
});

define('app',['jQuery','Underscore','Backbone'],function($, _, Backbone){
	(function(){
		$.os=$.extend($.os||{},{phonegap:_.has(window,'_cordovaNative')})
		window.reject=function(p){return function(e){p.reject()}}
		Array.prototype.add=function(base,a){
			return a&&a.length ? this.concat(_.map(a.split(','),function(one){
				return base+one
			})) : this;
		}
		Date.prototype.ago=function(){
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
		Date.prototype.toString=function(){
			return this.getFullYear()+"-"+(this.getMonth()+1)+"-"+(this.getDay()+1)
			+" "+this.getHours()+":"+(this.getMinutes()+1)
		}
		Date.regFrom=/[-\s+:]/
		Date.prototype.from=function(s,d){
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
		var _debug=console.debug
		console.debug=function(m){
			if(DEBUG)
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
		/*make all Backbone class have this function*/
		Backbone.View.prototype._super=
		Backbone.Collection.prototype._super=
		Backbone.Model.prototype._super=function(){
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
		Model=Backbone.Model.extend({
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
				patch: function(){
					var patchs=arguments.length==0 ? this.changedAttributes() : this.pick.apply(this,arguments)
					return this.save(null,{attrs:patchs})
				}
			},{
				setSchema: function(schema){
					this.prototype.className=schema.get('name')
					this.prototype.schema={}
					_.each(schema.get('fields'),function(metadata){
						this[metadata.name]=metadata
					},this.prototype.schema)
					return this
				},
				collection:function(){
					if(!this.Collection)
						this.Collection=Backbone.Collection.extend({model:this})
					return new this.Collection()
				},
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
				DATATYPE:'String,Integer,Float,Boolean,Date,File,GeoPoint,Array,Object,Pointer'.split(',')
			}), 		
		app=_.extend({
			version:'0.01',
			apiKey:false,
			start: function(opt){
				opt && _.extend(this,opt)
				
				$(window).bind('resize',function(){
					if($('#media').length==0)
						$('body').append('<div id="media" class="outview"></div>')
					$.media=$('#media').width()==1 ? 'phone' : 'tablet'
					$('body').data('device',$.media)
				}).resize()
				
				$.ajaxSetup({
					dataType:'json',
					headers: {"X-Application-Id": this.apiKey}
				})
				
				require(['view/splash','i18n!nls/all'].add('Plugin!',plugins),function(splash,i18n){
					window.text=function(a, b){return  ((b=a.toLowerCase()) in i18n) ? i18n[b] : (i18n[b]=a)}
					document.title=text(document.title)
					splash.show()
					var _start=function(){
						Backbone.history.start()
						splash.remove()
					}
					app.init().then(_start,_start)
				})
			},
			init: function(){
				var user=this.User.current()
				return user ? this.init4User(user) : $.Deferred().resolve()
			},
			init4User: function(user){
				return user.verify()
			},
			isLoggedIn: function(){
				return currentUser!=null
			},
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
			navigate:function(url, opt){
				router.navigate(url, opt)
			},
			createKind:function(schema, properties, classProperties){
				return Model.extend(properties, classProperties).setSchema(schema)
			},
			Model:Model,
			User: Model.extend({
				className:'_user',
				urlRoot:'1/users',
				parse: function(r){
					var attrs=this._super().parse.apply(this,arguments)
					if(_.has(attrs,'sessionToken')){
						localStorage.setItem('sessionToken',attrs.sessionToken)
						delete attrs.sessionToken
					}
					return attrs
				},
				signUp:function(){
					return this.save()
					.then(_.bind(function(user){
						localStorage.setItem('currentUser',JSON.stringify(this.toJSON()))
						return currentUser=this
					},this))
				},
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
				requestPasswordReset:function(email){
					return $.ajax({
						url:'1/requestPasswordReset',
						type:'json',
						method:'POST',
						data:this.toJSON()
					})
				},
				logOut: function(){
					currentUser=null
					localStorage.removeItem('currentUser')
					location.reload()
				}
			},{
				current:function(){
					var user=localStorage.getItem('currentUser')
					if(user!=null){
						if(currentUser==null)
							currentUser=new User(JSON.parse(user),{parse:true})
						return currentUser
					}else
						return null
				},
				logOut:function(){
					User.current().logOut()
				},
				requestPasswordReset:function(email){
					User.current().requestPasswordReset(email)
				}
			}),
			Role: Model.extend({
				className:'_role',
				urlRoot:'1/roles'
			}),
			Schema: Model.extend({
				className:'_schema',
				urlRoot:'1/schemas',
				addColumn:function(column){
					Backbone.sync('update',this, {
						context:this,
						url:this.urlRoot+'/'+this.id+'/column',
						attrs:column
					}).then(function(){
						var fields=this.get('fields'), i=fields.length-3
						fields.splice(i,0,column)
						this.trigger('addColumn',column, i)
					})
				}
			})
		},Backbone.Events),
		User=app._user=app.User,
		Role=app._role=app.Role,
		Schema=app._schema=app.Schema
	
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