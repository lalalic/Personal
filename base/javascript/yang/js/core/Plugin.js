/**
 *  To support plugin with a plugin data Parser, and extension interface
 *  It support load plugin from files, or from a zip
 *  <p>the folder structure of plugin:</p>
 *  <ul>
 *  <li>main.js[required]--plugin entry, to install/uninstall this plugin</li>
 *  <li>cloud[optional]<ul><li>main.js : cloud functions</li></ul></li>
 *  <li>...</li>
 *  </ul>
 *  @class Plugin
 *  @example
 *  //save the following content to main.js to create a plugin
 *  Plugin.extend({
 *  	title:'my feature',
 *  	description:'it's a test feature',
 *  	install:function(){},
 *  	uninstall: function(){}
 *  })
 */
define(['app',"JSZip", "module"], function(app, JSZip, module){
	var regI18N=/^i18n!/,
		cfg=module.config()||{},
		byFile=location.protocol=='file:' || !cfg.zipped,
		zipped=cfg.zipped,
		PluginParser=$.newClass(function(data){
				this.zip=new JSZip(data)
				this.info=eval(this.define+this.zip.file('main.js').asText())
				this.cloudCode=this.zip.file('cloud/main.js').asText()
				this.zip.remove('cloud')
				this.clientCode=this.zip.generate({type:'blob',compression:'DEFLATE'})
			},{
				define:"function define(a,b){a.splice(_.indexOf(a,'Plugin'),1,require('Plugin'));return b.apply(null,a)};"
			});
		
	(function(requestFileSystem){
		requestFileSystem(TEMPORARY,1024)
			.then(function(fs){
				var DirectoryEntry=fs.root.constructor
				$.extend(DirectoryEntry.prototype,{
					getDirectory:$.aopromise(DirectoryEntry.prototype.getDirectory,4),
					getFile: $.aopromise(DirectoryEntry.prototype.getFile,4)
				})
				$.extend(DirectoryEntry.prototype,{
					getDirectory:$.aop(DirectoryEntry.prototype.getDirectory,function(_raw){
						return function(name,o,a,b){
							var paths=_.compact(name.split('/'))
							if(paths.length==1)
								return _raw.apply(this,arguments)
							else{
								var last=paths.pop()
								return this.getDirectory(paths.join('/'),o)
									.then(function(d){return _raw.call(d,last,o,a,b)})
							}
						}
					}),
					getFile:$.aop(DirectoryEntry.prototype.getFile,function(_raw){
						return function(name,o,a,b){
							var paths=_.compact(name.split('/'))
							if(paths.length==1)
								return _raw.apply(this,arguments)
							var file=paths.pop()
							return this.getDirectory(paths.join('/'),o)
								.then(function(d){return _raw.call(d,file,o,a,b)})
						}
					})
				})
				fs.root.getFile('x',{create:true})
					.then(function(file){
						var FileEntry=file.constructor
						$.extend(FileEntry.prototype,{
							createWriter: $.aopromise(FileEntry.prototype.createWriter,2)
						})
					})
			})
	
		JSZip.prototype.save2Local=function(root,first){
			var zip=this, isDir=/\/$/, createOpt={create:true}
			return requestFileSystem(TEMPORARY,1024*1024)
				.then(function(fs){
					var p=fs.root.getDirectory(root,{create:true})
					p.then(function(rootPath){
						zip.filter(function(path, data){
							isDir.test(path) ? 
								rootPath.getDirectory(path,createOpt) : 
								rootPath.getFile(path, createOpt)
									.then(function(fileEntry){
										fileEntry.createWriter(function(writer){
											writer.write(new Blob([zip.file(path).asArrayBuffer()]))
										})
									})
						})
					})
					return p
				}).then(function(rootPath){
					return rootPath.getFile(first,createOpt)
						.then(function(firstFile){
							return firstFile.createWriter()
								.then(function(writer){
									var p=new $.Deferred()
									writer.onwriteend=function(){p.resolve(rootPath.toURL()+"/")}
									writer.onerror=function(e){p.fail(e)}
									writer.write(new Blob([zip.file(first).asArrayBuffer()]))
									return p
								})
						})
				})
		}
	})(window.requestFileSystem=$.aopromise(window.requestFileSystem||window.webkitRequestFileSystem,4));

	require.load=$.aop(require.load,function(_raw){
		return function(context, moduleName, url){
			if(/^filesystem:/.test(url)&&url.indexOf('.js?')==-1)
				url=url.replace('?','.js?')
			return _raw.call(this,context,moduleName,url)
		}
	})
	var Plugin= $.extend(/**@lends Plugin*/{
		version:'0.1',
		/**
		 *  the plugin root path, which supports configuration from require
		 */
		root: cfg.root||'plugins/',
		description:'Plugin specification',
		/**
		 *  the plugin will be installed right after it's loaded if it's true
		 */
		installOnLoad:true,
		/**
		 *  a shortcut to parse local zipped plugin
		 */
		parse: function(data){return new this.PluginParser(data)},
		/**
		 *  all loaded features in current session
		 *  @type {module:Backbone.Collection}
		 */
		features: null,
		/**
		 *  a status function to return if all features already loaded
		 *  @return {Promise}
		 */
		featuresLoaded: function(){return $.Deferred().resolve()},
		_onModuleLoad: function(m,name,onload,root){
			m.id=m.name=name
			m.root=root;
			if(m.specs && m.specs.length){
				var Specs=require('specs')
				for(var i in m.specs)
					m.specs[i]=m.module(m.specs[i])
				m.specs.splice(0,0,Specs.length,0)
				Specs.splice.apply(Specs,m.specs)
				m.specs.splice(0,2)				
			}
			this.installOnLoad && m.install()
			onload(m)
			
			if(this.features==null)
				this.features=new Backbone.Collection
			
			this.features.add(_.omit(m,_.functions(m)))
		},
		_loadFromURL: function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			config.paths[name]=root+'main'
			require([name],(function(a){
				this._onModuleLoad(a,name,onload,root)
			}).bind(this))
		},
		_loadFromZip: function(name, parentRequire, onload, config){
			var me=this,
				pluginName=name.split('/').pop().replace('.zip','')
			$.ajax({
				url:name.charAt(0)=='/' ? name : parentRequire.toUrl(this.root+name),
				mimeType:'text/plain; charset=x-user-defined',
				processData:false,
				dataFilter:function(data,type){
					(new JSZip(data))
						.save2Local(app.localPath()+"/plugins/"+pluginName,"main.js")
						.then(function(rootUrl){
							config.paths[pluginName]=rootUrl+'main'
							require([pluginName],function(a){
								me._onModuleLoad(a,pluginName,onload,rootUrl)
								a.zipped=true
								require.undef(name)
							})
						})
					return null
				}
			})
		},
		load: function(name){
			if(zipped || /\.zip$/.test(name))
				this._loadFromZip.apply(this,arguments)
			else
				this._loadFromURL.apply(this,arguments)
		},
		/**
		 *  to create new plugin
		 *  @example
		 *  Plugin.extend({})
		 */
		extend: function(more){
			var newPlugin=$.extend(/**@lends Plugin.prototype*/{
				extend:this.extend,
				root: this.root,
				/**
				 *  a status to indicate if this plugin is installed
				 */
				installed:false,
				refcount:0,
				/**
				 *  a font icon for the plugin, which will be shown in #feature page
				 *  @default app
				 */
				icon: "app",
				/**
				 *  author information
				 *  @example
				 *  {name:"Raymond", email:"raymond@emc.com"}
				 */
				author:{
					name:'Raymond Li',
					email:'your email'
				},
				/**
				 *  version of plugin
				 */
				version:'0.1',
				/**
				 *  plugin description, which will be shown in #feature page
				 */
				description:'A plugin',
				/**
				 *  what modules are the plugin depended on
				 *  @type external:Array
				 */
				depends:[],
				/**
				 *  Bahavior test driven specification modules
				 *  @example
				 *  [this.module("spec/plugin"),this.module("spec/imageloader")]
				 */
				specs: [],
				/**
				 *  how to install the plugin
				 */
				install:function(){},
				/**
				 *  how to uninstall the plugin
				 */
				uninstall: function(){},
				module:function(name){return this.name+"!"+name},
				load:function(name, require, onload){
					return require([name],onload)
				},
				normalize:function(name){
					return this.root+name
				},
				/**
				 *  get all dependents of the plugin
				 */
				getDepends: function(){
					return _.uniq(_.flatten(_.map(this.depends,function(a,plugin){
						var ds=((require.defined(a) && (plugin=require(a))) && plugin.getDepends() || [])
						ds.push(a)
						return ds
					})))
				}
			},more||{});
			$.extend(newPlugin,{
				install:$.aop(newPlugin.install,function(_raw){
					return function(){
						$.each(this.getDepends(),function(index,a){
							require.defined(a) && require(a).install()
						})
						
						if(!this.installed){
							_raw&&_raw.apply(this,arguments)
							this.installed=true
							Plugin.trigger('install',this.id)
						}
						this.refcount<0 && (this.refcount=0)
						this.refcount++
					}
				}),
				uninstall: $.aop(newPlugin.uninstall,function(_raw){
					return function(){
						$.each(this.getDepends(),function(index,a){
							require.defined(a) && require(a).uninstall()
						})
						this.refcount--
						this.refcount<0 && (this.refcount=0)
						if(this.refcount==0 && this.installed){
							_raw&&_raw.apply(this,arguments)
							this.installed=false
							Plugin.trigger('uninstall',this.id)
						}
						return true
					}
				})
			})
			return newPlugin
		},
		upload: function(name,file){},
		download: function(name){}
	},Backbone.Events);
	return Plugin
})