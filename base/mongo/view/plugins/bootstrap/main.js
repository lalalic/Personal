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
					$.extend(app,{
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
					  *  var Post=app.Post=app.Model.extend({className : 'Post' })
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
				apiKey:'admin',
				title:'Mobile Engine',
				asideView:this.module('view/menu'),
				shortcutView:this.module('view/applist')
			})

			app.route('main','',this.module('view/main'),true)
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
					className:'apps',
					urlRoot: function(){
						return this.version+'/'+this.className;
					},
					upload: function(file){
						return (new FileReader()).readAsArrayBuffer(file)
							.then(_.bind(function(raw){
								var zip=new JSZip(raw), 
									cloudCode=zip.file('cloud/main.js');
								cloudCode=cloudCode && cloudCode.asText() || ''
								zip.remove('cloud')
								
								var indexes=zip.file("data/indexes.js")
								indexes=indexes&&new Function("","return "+indexes.asText())()
								zip.remove('data/indexes.js')
								
								return (new app.File({data:zip.generate({type:'blob'}), name:this.id+".zip"}))
									.save()
									.then(_.bind(function(file){
										return this.save({'clientCode':file.url(), cloudCode:cloudCode||''},{patch:true})
											.then(function(){
												return !_.isEmpty(indexes) && new app.Schema(indexes).save()
											})
									},this))
									.then(_.bind(function(){
										return this
									},this))
							},this))
					},
					download: function(){
						return (this.has('clientCode') ? new app.File({url:this.get('clientCode')}).download() : $.Deferred().resolve())
						.then(_.bind(function(data){
							var zip=new JSZip(data),currentApp=this;
							if(!zip.file('main.js'))
								zip.file('main.js','define(["Plugin","app"],'+defaultAppMain(this.get('name'),this.get('apiKey'))+')',{type:"text/script"})
								
							zip.file("cloud/main.js", this.get('cloudCode')||'//put your cloud code here')
							this.exportIndexes().then(function(indexes){
								zip.file("data/indexes.js",JSON.stringify(indexes,null, "\t"))
							}).then(function(){
								UI.util.save(zip, currentApp.get('name')+'.zip')
							})
						},this))
					},
					exportIndexes: function(){
						return $.get(this.version+"/indexes")
					},
					exportData: function(table){
						table=app.Model.extend({className:table}).collection()
						return table.fetch().then(function(){
							return $.Deferred().resolve(table)
						})
					},
					localPath: function(){
						return 'app/'+this.get('name')
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
			app.Schema.prototype.idAttribute="name"
			
			$.extend(app,{
				init4User:$.aop(app.init4User, function(_init4User){
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
				init: $.aop(app.init,function(_init){
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