var _=require("underscore"), promise=require("node-promise");
function Cloud(){
	var callbacks={}, self=this;
	_.each("before,after".split(","),function(a){
		_.each("Create,Update,Remove".split(","),function(b){
			this[a+b]=function(kind, callback, c){
				c=callbacks[kind]||(callbacks[kind]={})
				c=(c[a+b]||(c[a+b]=[]))
				c.push(function(){return callback.apply(this,arguments)})
			}
		},self)
	})
	
	this.asKindCallback=function(service){
		var kindCallbacks=callbacks[service.kind]||{}, o={}
		_.each("before,after".split(","),function(a){
			_.each("Create,Update,Remove".split(","),function(b){
				this[a+b]=function(){
					return promise.all(kindCallbacks[a+b]||[])
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
	require("vm").runInNewContext(app.cloudCode, {
		Cloud:cloud,
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
			sharedModules[path](m.exports,parentRequire,m)
			
			if(path=='backbone')
				m.exports.ajax=ajax(app)
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
		if(Module.isShareModule(request) && !sharedModules[request])
			sharedModulesPath[path]=request;
		return path
	}
	
	var __compile=Module.prototype._compile
	Module.prototype._compile=function(content){
		var r=__compile.apply(this,arguments), request=sharedModulesPath[this.filename];
		if(request && Module.isShareModule(request) && !sharedModules[request]){
			delete sharedModulesPath[this.filename];
			sharedModules[request]=new Function("exports,require,module",content.replace(/^\#\!.*/, ''))
		}
		return r
	}	
}
