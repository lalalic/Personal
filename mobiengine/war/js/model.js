define(['app', 'jQuery','Underscore','Backbone', 'Promise'],function(app, $, _, Backbone, Promise){
	_.extend(app,{// extend app schema
		Application: app.Model.extend({
				className:'_app',
				urlRoot:'1/apps'
			},{
				current:function(m){
					switch(m){
					case undefined:
						if(currentApp!=null)
							return currentApp
						return (m=localStorage.getItem('currentApp')) && (m=Application.all.get(parseInt(m))) &&  this.current(m) || null
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
				},
				collection:function(){
					if(!this.Collection){
						this.Collection=Backbone.Collection.extend({model:this})
						this.Collection.prototype.fetch=function(){
							if(User.current()==null){
								if(!this.isEmpty())
									this.reset()
								return Promise.as();
							}
							return Backbone.Collection.prototype.fetch.apply(this,arguments)
						}
					}
					return new this.Collection()
				}
			}),
		User: app.Model.extend({
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
		Role: app.Model.extend({
			className:'_role',
			urlRoot:'1/roles'
		},{}),
		Schema: app.Model.extend({
			className:'_schema',
			urlRoot:'1/schemas',
			addColumn:function(column){
				var me=this
				Backbone.sync('update',this, {
					url:this.urlRoot+'/'+this.id+'/column',
					attrs:column,
					success:function(){
						var fields=me.get('fields'), i=fields.length-3
						fields.splice(i,0,column)
						me.trigger('addColumn',column, i)
					}
				})
			}
		},{
			collection:function(){
				if(!this.Collection){
						this.Collection=Backbone.Collection.extend({model:this})
						this.Collection.prototype.fetch=function(){
							if(Application.current()==null){
								if(!this.isEmpty())
									this.reset()
								return Promise.as();
							}
							return Backbone.Collection.prototype.fetch.apply(this,arguments)
						}
					}
					return new this.Collection()
			}
		}),	
		init: function(){
			$.ajaxSetup({
				dataType:'json',
				headers: {"X-Application-Id": this.apiKey}
			})
			
			var user=this.User.current()
			this.Application.all=this.Application.collection()
			return user ? Promise.when([this.init4User(user)]) : Promise.as()
		},
		init4User: function(user){
			return user.verify()
			.then(_.bind(function(){
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
	app._app=app.Application
	app._user=app.User
	app._role=app.Role
	app._schema=app.Schema

	var Application=app.Application,
		currentApp, 
		prevApp,
		User=app.User,
		currentUser
		
	return app.Model
})