var _=require("underscore"), promise=require("node-promise");
module.exports=function(){
	var callbacks={}, self=this;
	_.each("before,after".split(","),function(a){
		_.each("Create,Update,Delete".split(","),function(b){
			self[a+b]=function(kind, callback, c){
				c=callbacks[kind]||(callbacks[kind]={})
				c=(c[a+b]||(c[a+b]=[]))
				c.push(function(){return callback.apply(this,arguments)})
			}
		},self)
	})
	
	this.asKindCallback=function(kind){
		var kindCallbacks=callbacks[kind]||{}, o={}
		_.each("before,after".split(","),function(a){
			_.each("Create,Update,Delete".split(","),function(b){
				self[a+b]=function(){
					return promise.seq(kindCallbacks[a+b]||[])
				}
			},o)
		})
		return o
	}
	
	this.define=function(url, handler){
		
	}
}