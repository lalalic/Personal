define('app',function(){
	var VERSION="0.1", DEBUG=false
	$.os=$.extend($.os||{},{phonegap:_.has(window,'_cordovaNative')})
	window.reject=function(p){return function(e){p.reject()}}
	Array.args=function(args){
		return Array.prototype.slice.call(args)
	}
	Array.prototype.add=function(base,a){
		return this.concat(_.map(a.split(','),function(one){
			return base+one
		}))
	}
	;(function(){
		var _debug=console.debug
		console.debug=function(m){
			if(DEBUG)
				_debug.apply(console,arguments)
		}
		Node.prototype.remove=function(){this.parentNode.removeChild(this)}
	})()
	;(function(){//check offline status
		$.isOffline=function(){
			if(location.protocol.match(/^file/))
				return (Date.now()-$.isOffline.lastCheckAt)<5000
			return false
		}
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
	})();
	
	
	;(function(){// extend _.template
		_.templateSettings = {
			evaluate    : /<%([\s\S]+?)%>/g,
			interpolate : /\{\{([\s\S]+?)\}\}/g,
			escape      : /\{\{\{([\s\S]+?)\}\}\}/g
		  };
		
		var _template=_.template, templates={}
		_.template=function(text,data,setting){
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
	})();
	
	function media(){
		$(window).bind('resize',function(){
			if($('#media').length==0)
				$('body').append('<div id="media" class="outview"></div>')
			$.media=$('#media').width()==1 ? 'phone' : 'tablet'
			$('body').data('device',$.media)
		}).resize()	
	}  
	var app=_.extend({
		title:'app',
		start: function(opt){
			$.extend(this,opt||{})
			$.ajaxSetup({
				dataType:'json',
				beforeSend:function(xhr, settings){
					var current=app.Application.current()
					xhr.setRequestHeader("X-Application-Id", 
						current&&current.get('apiKey')||'aglub19hcHBfaWRyCgsSBF9hcHAYAQw');
				}
			})
			media()
			require.config({
				baseUrl:'./js',
				urlArgs: "v=0.1",//+Date.now(),//VERSION,
				deps: ['view/splash','lib/i18n!nls/all'],
				callback: function(splash,i18n){
					window.text=function(a){return  ((a=a.toLowerCase()) in i18n) ? i18n[a] : (i18n[a]=a)}
					document.title=text(document.title)
					splash.show()				
					var _start=function(){	
						require(['view/applist','view/menu'],function(applist,aside){
							aside[$.media=='tablet' ? 'show' : 'hide']()
							Backbone.history.start()
							splash.remove()
						})
					}
					app.init().then(_start,_start)
				}
			})			
		},
		clear4User:function(){
			
		},
		init: function(){
			var user=this.User.current()
			this.Application.all=this.Application.collection()
			return user ? Promise.when([this.init4User(user)]) : Promise.as()
		},
		init4User:function(user){
			return user.verify().then(_.bind(function(){
					return this.Application.all.fetch()
				},this))
		},
		isLoggedIn: function(){
			return this.User.current()!=null
		},
		navigate:function(a,b){
			Backbone.history.navigate(a,b)
		}
	},Backbone.Events);
	
	;(function(){//Models
		var Model=Backbone.Model.extend({
			kind:false,
			toJSON: function(){
				var a=Backbone.Model.prototype.toJSON.apply(this,arguments)
				_.each(['id','createdAt','updatedAt'],function(attr){
					if(_.has(this,attr))
						a[attr]=this[attr]
				},this)
				return a
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
			sync:function(method,model,opt){
				var p=new Promise,
					defaultOpt={
						error:function(model,e){
							p.reject(e)
						},
						success:function(model){
							p.resolve(model)
						}
					}
				if(opt){
					_.each(['error','success'],function(name){
						if(name in opt){
							var _raw=opt[name]
							opt[name]=function(){
								_raw.apply(null,arguments)
								defaultOpt[name].apply(null,arguments)
							}
						}else
							otp[name]=defaultOpt[name]
					})
				}else
					opt=defaultOpt
				Backbone.Model.prototype.sync.call(this,method,model,opt)
				return p
			}},{
				collection:function(){
					if(!this.Collection)
						this.Collection=Backbone.Collection.extend({model:this,url:this.prototype.urlRoot})
					return new this.Collection()
				} 
			})
		var currentApp, Application=app.Application=Model.extend({
			urlRoot:'1/apps'
		},{
			current:function(m){
				switch(m){
				case undefined:
					var app=localStorage.getItem('currentApp')
					if(app!=null){
						if(currentApp==null)
							currentApp=Application.all.get(parseInt(app))
						return currentApp
					}else
						return null
				case null:
					localStorage.removeItem('currentApp')
					currentApp=null
					Application.all.trigger('current')
					return null
				default:
					currentApp=m
					localStorage.setItem('currentApp',m.id)
					Application.all.trigger('current',m)
					console.log('set current application')
					return m
				}
			}
		})
		var current, User=app.User=Model.extend({
			urlRoot:'1/users',
			parse: function(r){
				var attrs=Model.prototype.parse.apply(this,arguments)
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
					return current=this
				},this))
			},
			logIn: function(){
				var me=this,p=new Promise
				$.ajax({
					url:'1/login',
					method:'get',
					data:this.toJSON(),
					success:function(user){
						delete me.attributes.password
						me.set(me.parse(user),{silent:true})
						localStorage.setItem('currentUser',JSON.stringify(me.toJSON()))
						current=me
						p.resolve(current)
					},
					error:function(e){
						p.reject(e)
					}
				})
				return p
			},
			verify:function(){
				var me=this,p=new Promise
				$.ajax({
					url:'1/me',
					method:'get',
					headers:{"X-Session-Token":localStorage.getItem('sessionToken')},
					success:function(user){
						me.set(user,{parse:true,silent:true})
						localStorage.setItem('currentUser',JSON.stringify(me.toJSON()))
						current=me
						p.resolve(current)
					},
					error:function(e){
						me.logOut()
						p.reject(e)
					}
				})
				return p
			},
			requestPasswordReset:function(email){
				var p=new Promise
				$.ajax({
					url:'1/requestPasswordReset',
					type:'json',
					method:'POST',
					data:this.toJSON(),
					success:function(){
						p.resolve()
					},
					error:function(e){
						p.reject(e)
					}
				})
				return p
			},
			logOut: function(){
				current=null
				localStorage.removeItem('currentUser')
			}
		},{
			current:function(){
				var user=localStorage.getItem('currentUser')
				if(user!=null){
					if(current==null)
						current=new User(JSON.parse(user),{parse:true})
					return current
				}else
					return null
			},
			logOut:function(){
				User.current().logOut()
			},
			requestPasswordReset:function(email){
				User.current().requestPasswordReset(email)
			}
		})
		
		app.Role=Model.extend({
			urlRoot:'1/roles'
		},{})
		app.Schema=Model.extend({
			urlRoot:'1/schemas'
		},{})
	})();
	
	
	//router
	var router=app.router=new Backbone.Router
	_.each([//route name, url, view name[,user]
		'main,,main',
		'createApp,app,app,user',
		'settings,settings,app,user',
		'schema,data,data,user',
		'analytics,analytics,analytics,user',
		'cloudcode,cloudcode,cloudcode,user',
		'test,test,test',
		'syncOffline,sync,sync,user'],function(r){
		router.route((r=r.split(','))[1],r[0],function(){
			var args=arguments
			if(r.length==4 && r[3]=='user' && !app.isLoggedIn())//need login
				require(['view/user'],function(page){page.show('signin')})
			else
				require(['view/'+r[2]],function(page){
					page.show.apply(page,args)
				})
		})
	})
	return app
})