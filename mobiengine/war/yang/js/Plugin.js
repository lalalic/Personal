/**
 *  To support plugin with a plugin data Parser, and extension interface
 *  It support load plugin from files, or from a zip
 *  @module Plugin
 */
define(["JSZip", 'specs', "module"], function(JSZip,Specs, module){
	var regI18N=/^i18n!/,
		cfg=module.config()||{},
		byFile=location.protocol=='file:' || !cfg.zipped,
		Parser=_.newClass(function(data){
				this.raw=data
				this.zip=new JSZip(data)
			},{
				define:"function define(a,b){a.splice(_.indexOf(a,'Plugin'),1,require('Plugin'));return b.apply(null,a)};",
				info:function(){
					return this._info ? this._info : 
						(this._info=new Backbone.Model(eval(this.define+this.zip.file('main.js').asText())))
				},
				cloud: function(){
					return this.zip.file('cloud/main.js').asText()
				},
				schema: function(){
					return this.zip.file('data/schema.js').asText()
				},
				data: function(){
					return this.zip.file('data/data.json').asText()
				},
				save: function(){
					
				}
			});
		
	(function(requestFileSystem){
		requestFileSystem(TEMPORARY,1024)
			.then(function(fs){
				var DirectoryEntry=fs.root.constructor
				_.extend(DirectoryEntry.prototype,{
					getDirectory:_.aopromise(DirectoryEntry.prototype.getDirectory,4),
					getFile: _.aopromise(DirectoryEntry.prototype.getFile,4)
				})
				_.extend(DirectoryEntry.prototype,{
					getDirectory:_.aop(DirectoryEntry.prototype.getDirectory,function(_raw){
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
					getFile:_.aop(DirectoryEntry.prototype.getFile,function(_raw){
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
						_.extend(FileEntry.prototype,{
							createWriter: _.aopromise(FileEntry.prototype.createWriter,2)
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
											writer.write(new Blob([zip.file(first).asArrayBuffer()]))
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
									writer.onwriteend=function(){p.resolve(rootPath.toURL())}
									writer.onerror=function(e){p.fail(e)}
									writer.write(new Blob([zip.file(first).asArrayBuffer()]))
									return p
								})
						})
				})
		}
	})(window.requestFileSystem=_.aopromise(window.requestFileSystem||window.webkitRequestFileSystem,4))
	
	
	return /**@lends Plugin*/{
		version:'0.1',
		/**
		 *  the plugin root path, which supports configuration from require
		 */
		root: cfg.root||'plugins/',
		description:'Plugin specification',
		Parser: Parser,
		parse: function(data){return new this.Parser(data)},
		
		features:new Backbone.Collection,
		_onModuleLoad: function(m,name,onload,root){
			m.id=m.name=name
			m.root=root
			m.init()
			this.features.add(_.omit(m,_.functions(m)))
			if(m.specs && m.specs.length){
				for(var i in m.specs)
					m.specs[i]=m.module(m.specs[i])
				m.specs.splice(0,0,Specs.length,0)
				Specs.splice.apply(Specs,m.specs)
				m.specs.splice(0,2)				
			}
			onload(m)
		},
		_loadFromURL: function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			config.paths[name]=root+'main'
			require([name],_.bind(function(a){
				this._onModuleLoad(a,name,onload,root)
			},this))
		},
		_loadFromZip: function(name, parentRequire, onload, config){
			var root=name,me=this
			$.ajax({
				url:parentRequire.toUrl(this.root+name),
				mimeType:'text/plain; charset=x-user-defined',
				processData:false,
				dataFilter:function(data,type){
					(new JSZip(data))
						.save2Local(root,"main.js")
						.then(function(rootUrl){
							var pluginName=name.replace('.zip','')
							config.paths[pluginName]=rootUrl+'/main'
							require([pluginName],function(a){
								me._onModuleLoad(a,pluginName,onload,rootUrl)
								require.undef(name)
							})
						})
					return null
				}
			})
		},
		load: function(name){
			if(/\.zip$/.test(name))
				this._loadFromZip.apply(this,arguments)
			else
				this._loadFromURL.apply(this,arguments)
		},
		extend: function(more){
			var newPlugin=$.extend({
				extend:this.extend,
				root: this.root,
				icon: "app",
				author:{
					name:'your name',
					email:'your email'
				},
				version:'0.1',
				description:'A plugin',
				depends:[],
				specs: [],
				init:function(){},
				module:function(name){return this.name+"!"+name},
				load:function(name, require, onload){return require([name],onload)},
				normalize:function(name){return this.root+name}
			},more||{});
			this.depends && (newPlugin.depends=_.uniq(_.union(this.depends,newPlugin.depends||[])));
			return newPlugin
		}
	}
})