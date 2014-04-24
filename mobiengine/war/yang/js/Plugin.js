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
	
	JSZip.prototype.save2Local=function(){
		
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
			var root=this.root+name+'/'
			$.ajax({
				url:config.baseUrl+'/'+this.root+name+".zip",
				dataType:'arraybuffer',
				mimeType:'text/plain; charset=x-user-defined',
				dataFilter:_.bind(function(data,type){
					var zip=new JSZip(data)
					onload.fromText(zip.file("main.js").asText())
					require([name],_.bind(function(a){
						a.zip=zip
						this._onModuleLoad(a,name,onload,root)
					},this))
				},this)
			})
		},
		load: function(){
			byFile? this._loadFromURL.apply(this,arguments) : this._loadFromZip.apply(this,arguments)
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
})