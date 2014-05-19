/**
 * starter plugin to config app, routes, and extend models
 * test
 * @module starter
 */
define(['Plugin', 'app', 'specs','JSZip','UI','plugins/model'],function(Plugin, app, specs, JSZip,UI){
var defaultAppMain=function(name, key){
return function(Plugin,app){
	return Plugin.extend({
		name:"bootstrap",
		install:function(){
			//configure application
			_.extend(app,{
				name:"_name_",
				title:"[application title]",
				version:"[application version]",
				description:"[describe your application]",
				apiKey:"_key_"
			});
			/**
			 *  route configuration
			 *  @example
			 *  app.route('main','',this.module('view/main'))
			 */
			 
			 /**
			  *  more extensions, such as extending models, change app.init, and etc
			  *  @example
			  *  var Post=app.Post=app.createKind(new Backbone.Model({name : 'Post' }))
			  *  app.init4User=_.aop(app.init4User,function(_raw){
			  *  	console.debug("start initializing for user")
			  *  	var r=_raw.apply(this,arguments)
			  *  	console.debug("initialized for user")
			  *  	return r
			  *  })
			  */
		},
		uninstall:function(){
			
		}
	})
}.toString().replace('_name_',name).replace('_key_',key);
}
	return Plugin.extend({
		description:'manage applications',
		install: function(){
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
			app.route('plugins','plugins',this.module('view/plugins'),true)
			
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
						function switchAppKey(e,xhr){
							var current=app.Application.current()
							current && xhr.setRequestHeader("X-Application-Id", current.get('apiKey'))
						}
						$(document).on('ajaxSend', switchAppKey)
						return (new FileReader()).readAsArrayBuffer(file).then(function(data){
							var zip=new JSZip(data),temp, 
								form=new FormData(), cloudCode;
							(cloudCode=zip.file('cloud/main.js')) && 
								form.append('cloudCode',(cloudCode=cloudCode.asText()));
							if(temp=zip.file('data/schema.js')){
								var _user, _role, _plugin
								temp=_.map(JSON.parse(temp.asText()),function(table,tableName, a){
									_.each(table,function(field, fieldName){
										this.fields.push(_.extend(field,{name:fieldName}))
									},(a={name:tableName,fields:[]}))
									return a
								})
								form.append('schema',JSON.stringify(temp))
							}
							
							//(temp=zip.file('data/data.json')) && form.append('data',temp.asText());
							zip.remove('cloud')
							zip.remove('data')
							form.append('file',zip.generate({type:'blob'}))
							return $.ajax({
								url: app.File.want2upload(me.urlRoot()+"/upload"),
								data:form,
								dataType:'json',
								cache: false,
								contentType : false,
								processData: false,
								type: 'POST',
								dataFilter:function(data,type){
									me.set('cloudCode',cloudCode)
									me.set(JSON.parse(data))
									return null
								},
								complete: function(){
									$(document).off('ajaxSend', switchAppKey)
								}
							}).then(function(data){
								return me
							})
						})
					},
					download: function(){
						return (this.has('clientCode') ? new app.File({url:this.get('clientCode')}).download() : $.Deferred().resolve())
						.then(_.bind(function(data){
							var zip=new JSZip(data),currentApp=this;
							if(!zip.file('main.js'))
								zip.file('main.js','define(["Plugin","app"],'+defaultAppMain(this.get('name'),this.get('apiKey'))+')',{type:"text/script"})
								
							zip.file("cloud/main.js", this.get('cloudCode')||'//put your cloud code here')
							this.exportSchema().then(function(schema){
								zip.file("data/schema.js",JSON.stringify(schema,null, "\t"))
								var data={}
								return $.when(_.chain(_.keys(schema)).map(function(table){
									return currentApp.exportData(table)
										.then(function(collection){
											collection.length && (data[table]=collection)
										})
								}).value()).then(function(){
									zip.file("data/data.json",JSON.stringify(data,null, "\t"))
								})
							}).then(function(){
								UI.util.save(zip, currentApp.get('name')+'.zip')
							})
						},this))
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
							return (m=localStorage.getItem('currentApp')) 
								&& (m=Application.all.get(parseInt(m))) 
								&&  this.current(m) 
								|| null
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