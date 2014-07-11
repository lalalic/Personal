var _=require("underscore"),
	mongo=require("mongodb");

_.extend((module.exports=_.extend(function(request, response){
		if(!(request && request.header)){
			this.app=request;
			this.user=response;
		}else{
			this.app=require("./app").resolveAppKey(request.header('X-Application-Id'))
			this.user=require("./user").resolvSessionToken(request.header("X-Session-Token"))
		}
	},{
	version:"1",
	routes:{},
	extend: function(protoProps, staticProps) {
		var parent = this;
		var child;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call the parent's constructor.
		if (protoProps && _.has(protoProps, 'constructor')) {
		  child = protoProps.constructor;
		} else {
		  child = function(){ return parent.apply(this, arguments); };
		}

		// Add static properties to the constructor function, if supplied.
		_.extend(child, parent, staticProps, {routes:_.extend({},this.routes,staticProps.routes||{})});

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		var Surrogate = function(){ this.constructor = child; };
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (protoProps) _.extend(child.prototype, protoProps);

		// Set a convenience property in case the parent's prototype is needed
		// later.
		child.__super__ = parent.prototype;
		
		return child;
	  },
	init: function(){
		var app=require("../server").app;
		_.each(this.routes,function(handler, key){
			var info=key.split(" "),
				verb=info[0],
				path=info.length>1 ? info[1] :"",
				root=this.prototype.kind ? "/"+this.prototype.kind : this.url,
				url=/^\//.test(path) ? path : (/\/$/.test(root)||path.length==0 ? root : root+"/")+path;
			if(!_.isFunction(handler))
				handler=function(req,res){this.send(res,req.path)}.bind(this);
			app[verb]("/"+this.version+url,function(req, res, next){
				try{
					handler.apply(this,arguments)
				}catch(error){
					this.error(res)(error)
				}
			}.bind(this))
			console.log("added route: "+verb+" "+url)
		},this)
	},
	send: function(res, data){
		res.header('Content-Type', 'application/json');
		res.send(data)
	},
	error: function(res){
		return function(error){
			res.send(400,error.message);	
		}
	}
})).prototype,{
	getMongoServer: function(){
		var config=require("../server").config
		return new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true,safe:true})
	}
})
