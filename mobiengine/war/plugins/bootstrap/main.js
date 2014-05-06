/**
 * starter plugin to config app, routes, and extend models
 * @module starter
 */
define(['Plugin', 'app', 'specs','JSZip','plugins/model'],function(Plugin, app, specs, JSZip){
	return Plugin.extend({
		description:'manage applications',
		init: function(){
			$.extend(app,{
				apiKey:'agp3d3ctemlwd2VichELEgRfYXBwGICAgICAgIAKDA',
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
			
			specs.push(this.module('spec/application'))
			
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
					},
					upload: function(file){
						var me=this
						return (new FileReader()).readAsArrayBuffer(file).then(function(){
							var zip=new JSZip(data),temp, form=new FormData();
							(temp=zip.file('cloud/main.js')) && form.append('cloudCode',temp.asText());
							(temp=zip.file('data/schema.js')) && form.append('schema',temp.asText());
							(temp=zip.file('data/data.json')) && form.append('data',temp.asText());
							zip.remove('cloud')
							zip.remove('data')
							form.append('file',zip.generate({type:'blob'}))
							return $.ajax({
								url: $.ajax((new app.File()).urlRoot()+'/want2upload/'+encodeURIComponent(this.urlRoot()+"/upload"),
									{async:false,dataType:'text'}).responseText,
								data:form,
								contentType : false,
								processData: false,
								type: 'POST',
								dataFilter:function(data,type){
									currentApp.fetch()
									return null
								}
							}).then(function(){
								return me
							})
						})
					},
					exportSchema: function(schemas){
						return (schemas ? $.Deferred().resolve() : ((schemas=app.Schema.collection())&&schemas.fetch()))
							.then(function(){
								var schema={},
									internal_fields="id,createdAt,updatedAt,ACL".split(',')
								schemas.each(function(a){
									var fields=schema[a.get('name')]={}
									_.chain(a.get('fields'))
										.reject(function(a){return internal_fields.indexOf(a.name)!=-1})
										.each(function(a){fields[a.name]=_.omit(a,'name')})
								})
								return $.Deferred().resolve(schema)
							})
					},
					exportData: function(table){
						table=app.Model.extend({className:table}).collection()
						return table.fetch().then(function(){
							return $.Deferred().resolve(table)
						})
					},
					localPath: function(){
						return 'app/'+this.get('url')
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
					},
					download: function(){
					
					},
					upload: function(){
					
					},
					localPath: function(){
						this.current().localPath()
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
			
			
			_.extend(app,{
				init4User:_.aop(app.init4User, function(_init4User){
					return function(){
						return _init4User.apply(this,arguments)
						.then(function(){
							return Application.all.fetch()
								.then(function(){
									Application.current(Application.all.first())
								})
						})
					}
				}),
				init: _.aop(app.init,function(_init){
					return function(){
						this.Application.all=this.Application.collection()
						return _init.apply(this,arguments)
					}
				}),
				localPath: function(){
					return Application.localPath()
				}
			})
		}
	})
})