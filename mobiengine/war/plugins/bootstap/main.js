/**
 * starter plugin to config app, routes, and extend models
 * @module starter
 */
define(['Plugin', 'app', 'plugins/model'],function(Plugin, app){
	return Plugin.extend({
		description:'manage applications',
		init: function(){
			$.extend(app,{
				apiKey:'aglub19hcHBfaWRyCgsSBF9hcHAYAQw',
				title:'Mobile Engine',
				asideView:this.module('view/menu'),
				shortcutView:this.module('view/applist')
			})

			app.route('main','',this.module('view/main'),true)
			app.route('createApp','app',this.module('view/app'),true)
			app.route('settings','settings',this.module('view/app'),true)
			app.route('schema','data(/:table)',this.module('view/data'),true)
			app.route('analytics','analytics',this.module('view/analytics'),true)
			app.route('cloudcode','cloudcode',this.module('view/cloudcode'),true)
			
			require(['Plugin!Test.zip'])	
			var User=app.User,
				currentApp, 
				prevApp,
				/**
				 *  @class
				 *  @memberof app
				 *  @augments app.Model
				 */
				Application=app.Application=app._app=app.Model.extend({
					className:'_app',
					urlRoot: function(){
						return this.version+'/apps'
					},
					saveCloudCode: function(){
						return Backbone.sync('update',this, {
							context:this,
							url:this.url(),
							attrs:{cloudCode:this.get('cloudCode')}
						}).then(function(r){
							this.set(r,{parse:true})
						})
					},
					save: function(a){
						var cloudCode=this.attributes['cloudCode']
						delete this.attributes['cloudCode']
						var r=this._super().save.apply(this,arguments)
						cloudCode && (this.attributes['cloudCode']=cloudCode)
						return r
					}
				},/** @lends app.Application */{
					/** 
					 * get current user 
					 * @returns {app.User} 
					 */
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
					/**
					 *  restore to previous application when cancel create new application
					 */
					restoreCurrent:function(){
						this.current(prevApp)
					},
					/**
					 *  create Application Collection 
					 */
					collection:function(){
						if(!this.Collection){
							this.Collection=Backbone.Collection.extend({model:this})
							this.Collection.prototype.fetch=function(){
								if(User.current()==null){
									if(!this.isEmpty())
										this.reset()
									return $.Deferred().resolve();
								}
								return Backbone.Collection.prototype.fetch.apply(this,arguments)
							}
						}
						return app.Model.collection.apply(this,arguments)
					}
				});

			app.Schema.collection=function(){
				if(!this.Collection){
					this.Collection=Backbone.Collection.extend({model:this})
					this.Collection.prototype.fetch=function(){
						if(Application.current()==null){
							if(!this.isEmpty())
								this.reset()
							return $.Deferred().resolve();
						}
						return Backbone.Collection.prototype.fetch.apply(this,arguments)
					}
				}
				return app.Model.collection.apply(this,arguments)
			}
			
			var _init4User=app.init4User
			app.init4User=function(){
				return _init4User.apply(this,arguments)
					.then(function(){
						return Application.all.fetch()
							.then(function(){
								Application.current(Application.all.first())
							})
					})
			}
			
			var _init=app.init
			app.init=function(){
				this.Application.all=this.Application.collection()
				return _init.apply(this,arguments)
			}
		
		}
	})
})