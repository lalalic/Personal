function Cloud(){
	var _=require("underscore"), promise=require("node-promise");
	var callbacks={}, self=this;
	_.each("before,after".split(","),function(a){
		_.each("Create,Update,Remove".split(","),function(b){
			this[a+b]=function(kind, callback, c){
				c=callbacks[kind]||(callbacks[kind]={})
				c=(c[a+b]||(c[a+b]=[]))
				c.push(callback)
			}
		},self)
	})
	
	this.asKindCallback=function(service){
		var kindCallbacks=callbacks[service.kind]||{}, o={}
		_.each("before,after".split(","),function(a){
			_.each("Create,Update,Remove".split(","),function(b){
				this[a+b]=function(){
					var args=arguments
					return promise.allOrNone(_.map(kindCallbacks[a+b]||[], function(callback){
						return callback.apply(o,args)
					}))
				}
			},o)
		})
		return o
	}
	
	var functions={}		
	this.define=function(url, handler){
		functions[url]=handler
	}
	
	this.run=function(url, req, res){
		try{
			functions[url](req, res)
		}catch(error){
			res.error(error)
		}
	}
}

exports.load=function(app, filename){
	var cloud=new Cloud(),parentRequire=require, 
		thisLoadedShare={}, ajax=require('./ajax'),
		Module=require('module');
	var log=function(m,level){
			if((app.logLevel||0)<=(level||0))
				app.logs.push({createdAt:new Date(), message:m, level:level||0})
		};
	require("vm").runInNewContext(app.cloudCode, {
		Cloud:cloud,
		console: {
			log: function(m){log(m,0)},
			info: function(m){log(m,0)},
			warn:function(m){log(m,1)},
			error:function(m){log(m,2)}
		},
		require: function(path){
			if(!Module.isShareModule(path))
				throw new Error(path+" module is not found.")
			
			if(path=='ajax')
				return ajax(app)
			
			if(thisLoadedShare[path])
				return thisLoadedShare[path];
				
			if(!sharedModules[path]) 
				parentRequire(path);
			var m={exports:{}};
			sharedModules[path] && sharedModules[path](m.exports,parentRequire,m)
			
			if(path=='backbone')
				m.exports.ajax=ajax(app).ajax
			return thisLoadedShare[path]=m.exports
		},
		exports:null,
		module:null,
		__dirname: null,
		__filename: null,
		root: null
	}, filename);
	return cloud;
}

exports.compile=function(code){
	new Function("Cloud",code);
}

var sharedModules={}, config=require('../server').config
exports.support=function(){
	var Module=require("module")
	Module.isShareModule=function(path){
		return config.sharedModules.indexOf(path)!==-1
	}
	
	var _resolveFilename=Module._resolveFilename,
		sharedModulesPath={};
	Module._resolveFilename=function(request){
		var path=_resolveFilename.apply(this,arguments)
		if(Module.isShareModule(request) && !sharedModules[request]){
			sharedModulesPath[path]=request;
		}
		return path
	}
	
	var __compile=Module.prototype._compile
	Module.prototype._compile=function(content, filename){
		var r=__compile.apply(this,arguments), request=sharedModulesPath[filename];
		if(request && Module.isShareModule(request) && !sharedModules[request]){
			console.log("loaded shared "+request)
			delete sharedModulesPath[filename];
			sharedModules[request]=new Function("exports,require,module",content.replace(/^\#\!.*/, ''))
		}
		return r
	}
}
