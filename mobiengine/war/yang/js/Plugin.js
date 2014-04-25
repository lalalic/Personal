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
				}
			})
	/*
	(function(requestFileSystem){
		requestFileSystem(TEMPORARY,1024,function(fs){
			var DirectoryEntry=fs.root.constructor
			_.extend(DirectoryEntry.prototype,{
				getDirectory:_.aop(DirectoryEntry.prototype.getDirectory,function(_raw){
					return function(name, o, success, fail){
						var p=new $.Deferred()
						_raw.call(this,name,o,function(d){
								success&&success(d)
								p.resolve(d)
							},function(e){
								fail&&fail(e)
								p.fail(e)
							})
						return p
					}
				}),
				getFile: _.aop(DirectoryEntry.prototype.getFile,function(_raw){
					return function(name, o, success, fail){
						
						var p=new $.Deferred()
						_raw.call(this,name,o,function(d){p.resolve(d)},function(e){p.fail(e)})
						return p
					}
				})
			})
		})
	})(requestFileSystem||webkitRequestFileSystem);*/
	
	JSZip.prototype.save2Local=function(root,first){
		var zip=this, p=new $.Deferred(), me=this
		var requestFileSystem=requestFileSystem||webkitRequestFileSystem;
		requestFileSystem(TEMPORARY,1024*1024,function(fs){
			fs.root.getDirectory(root,{create:true},function(rootPath){
				first && rootPath.getFile(first, {create:true},function(fileEntry){
					fileEntry.onwriteend=function(){
						p.resolve(rootPath.toURL())
					}
					fileEntry.createWriter(function(writer){
						writer.write(new Blob([me.file(first).asArrayBuffer()]))
					})
					
				});
				/*
				zip.filter(function(path, data){
					data.isPath() ? 
						rootPath.getDirectory(path,{create:true}) : 
						rootPath.getFile(path, {create:true}, function(fileEntry){
							fileEntry.createWriter(function(writer){
								writer.write(data.asArrayBuffer())
							})
						})
				})*/
			})
		})
		return p
	}
	
	return {
		version:'0.1',
		root: cfg.root||'plugins/',
		description:'Plugin specification',
		parse: function(data){return new Parser(data)},
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
			var root=name
			$.ajax({
				url:parentRequire.toUrl(this.root+name),
				mimeType:'text/plain; charset=x-user-defined',
				processData:false,
				dataFilter:_.bind(function(data,type){
					(new JSZip(data)).save2Local(root,"main.js")
						.then(function(rootUrl){
							config.paths[name]=rootUrl+'/main'
							require([name],_.bind(function(a){
								this._onModuleLoad(a,name.replace('.zip',''),onload,rootUrl)
								define(name.replace('.zip',''),a)
								require.undef(name)
							},this))
						})
					/*
					onload.fromText(zip.file("main.js").asText())
					require([name],_.bind(function(a){
						a.zip=zip
						this._onModuleLoad(a,name,onload,root)
					},this))*/
					return null
				},this)
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
				load:function(name, parentRequire, onload, config){
					//if(byFile)
						return parentRequire([name],onload)
					var file=this.zip.file(this.fileName+".js")
					if(file==null)
						return console.error(this.fileName+" doesn't exist in plugin "+this.name)
					var _define=window.define,
						pluginName=this.name,
						fileName=this.fileName
					window.define=function(moduleName, deps, callback) {
						var paths=fileName.split('/')
						paths.pop()
						var ds=($.isArray(moduleName)&&moduleName)||($.isArray(deps)&&deps)
						ds && $.each(ds,function(i,dep){
							var bI18N=regI18N.test(dep)
							bI18N && (dep=dep.substr(5))
							if(dep.substr(0,1)!=='.')
								return;
							var currentPaths=dep.split('/'),realPath=[]
							currentPaths=paths.concat(currentPaths)
							
							for(var len=currentPaths.length,k=len-1,p;k>-1;k--){
								if((p=currentPaths[k]).substr(0,1)=='.')
									k=k-p.length+1;
								else
									realPath.unshift(p)
							}
							ds[i]=(bI18N ? 'i18n!' : '')+pluginName+"!"+realPath.join('/')
						})
						ds && console.debug(name + "("+fileName+".js) depends on "+ds.join(","))
						_define.apply(null, arguments)
					}
					try{
						onload.fromText(name, file.asText())
					}finally{
						window.define=_define
					}
					require([name],onload)							
				},
				normalize:function(name){
					this.fileName=name;
					return this.root+name;
				}
			},more||{});
			this.depends && (newPlugin.depends=_.uniq(_.union(this.depends,newPlugin.depends||[])));
			return newPlugin
		}
	}
})