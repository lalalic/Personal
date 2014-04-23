define(["JSZip", "module"], function(JSZip,module){
	var regI18N=/^i18n!/, 
		cfg=module.config()||{},
		byFile=location.protocol=='file:' || !cfg.zipped
		
	var plugin={
		version:'0.1',
		root: cfg.root||'plugins/',
		description:'Plugin specification',
		features:new Backbone.Collection,
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
				init:function(){},
				module:function(name){return this.name+"!"+name},
				load:function(name, parentRequire, onload, config){
					if(byFile)
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
	
	if(byFile){
		plugin.load=function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			config.paths[name]=root+'main'
			require([name],function(a){
				a.id=a.name=name
				a.root=root
				onload(a)
				a.init()
				plugin.features.add(_.omit(a,_.functions(a)))
			})
		}
	}else{
		plugin.load=function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			$.ajax({
				url:config.baseUrl+'/'+plugin.root+name+".zip",
				dataType:'arraybuffer',
				mimeType:'text/plain; charset=x-user-defined',
				dataFilter:function(data,type){
					var zip=new JSZip(data)
					onload.fromText(zip.file("main.js").asText())
					require([name],function(a){
						a.id=a.name=name
						a.root=root
						a.zip=zip
						onload(a)
						a.init()
						plugin.features.add(_.omit(a,_.functions(a)))
					})
				}
			})
		}
	}
	
	return plugin
})