define(["JSZip", "jQuery"], function(JSZip, $){
	var regI18N=/^i18n!/
	var plugin={
		root:'plugins/',
		description:'Plugin specification',
		features:new Backbone.Collection,
		extend: function(more){
			return $.extend({
				extend:this.extend,
				root: this.root,
				version:'0.1',
				description:'',
				init:function(){},
				load:function(name, parentRequire, onload, config){
					switch(location.protocol){
					case 'file:':
						require([name],onload)
					break
					default:
						var file=this.zip.file(this.fileName+".js")
						if(file!=null){
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
							onload.fromText(name, file.asText())
							window.define=_define
							require([name],onload)
						}else
							console.error(this.fileName+" doesn't exist in plugin "+this.name);
					}
				},
				normalize:function(name){
					this.fileName=name;
					return this.root+name;
				}
			},more||{})
		}
	}
	
	switch(location.protocol){
	case 'file:':
		plugin.load=function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			config.paths[name]=root+'main'
			require([name],function(a){
				a.name=name
				a.root=root
				a.init()
				plugin.features.add(a)
				onload(a)
			})
		}
	break
	default:
		plugin.load=function(name, parentRequire, onload, config){
			var root=this.root+name+'/'
			$.ajax({
				url:config.baseUrl+'/plugins/'+name+".zip",
				dataType:'arraybuffer',
				mimeType:'text/plain; charset=x-user-defined',
				dataFilter:function(data,type){
					var zip=new JSZip(data)
					onload.fromText(name,zip.file("main.js").asText())
					require([name],function(a){
						a.name=name
						a.root=root
						a.zip=zip
						a.init()
						plugin.features.add(a)
						onload(a)
					})
				}
			})
		}
	}
	
	return plugin
})