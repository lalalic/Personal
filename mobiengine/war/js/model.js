define(['app', 'jQuery','Underscore','Backbone', 'Promise'],function(app, $, _, Backbone, Promise){
	var Model=Backbone.Model.extend({
	get:function(name){
		if(name=='id'||name=='createdAt'||name=='updatedAt')
			return this[name]
		return Backbone.Model.prototype.get.apply(this,arguments)
	},
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
	});

	_.extend(app,{// extend app schema
		Model: Model,
		Application: Model.extend({
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
						prevApp=currentApp
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
				},
				restoreCurrent:function(){
					this.current(prevApp)
				}
			}),
		User: Model.extend({
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
					return currentUser=this
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
						currentUser=me
						p.resolve(currentUser)
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
						currentUser=me
						p.resolve(currentUser)
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
				currentUser=null
				localStorage.removeItem('currentUser')
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
			urlRoot:'1/roles'
		},{}),
		Schema: Model.extend({
			urlRoot:'1/schemas'
		},{}),
		
		init: function(){
			$.ajaxSetup({
				dataType:'json',
				beforeSend:function(xhr, settings){
					var current=app.Application.current()
					xhr.setRequestHeader("X-Application-Id", 
						current&&current.get('apiKey')||'aglub19hcHBfaWRyCgsSBF9hcHAYAQw');
				}
			})
			
			var user=this.User.current()
			this.Application.all=this.Application.collection()
			return user ? Promise.when([this.init4User(user)]) : Promise.as()
		},
		init4User: function(user){
			return user.verify().then(_.bind(function(){
				return this.Application.all.fetch()
					.then(function(){
						app.Application.current(app.Application.all.first())
					})
			},this))
		},
		isLoggedIn: function(){
			return currentUser!=null
		}
	})

	var Application=app.Application,
		currentApp, 
		prevApp,
		User=app.User,
		currentUser
		
	return Model
})