var _=require("underscore"),
	mongo=require("mongodb");

module.exports=_.extend(function(request, response){
		this.app=require("./app").resolveAppKey(request.header('X-Application-Id'))
		this.user=require("./user").resolvSessionToken(request.header("X-Session-Token"))
	},{
	routes:{
		"get /version": function(req, res){
			res.send("1.0")
		}
	},
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
	init: function(app, config){
		if(!this.prototype.getMongoServer)
			this.prototype.getMongoServer=function(){
				return new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true})
			}
		
		_.each(this.routes,function(value, key){
			var info=key.split(" "),
				verb=info[0],
				url=info.length>1 ? info[1] :"";
			app[verb]((this.prototype.kind ? "/"+this.prototype.kind : this.url)+url,_.bind(value,this))
		},this)
	},
	send: function(res, data){
		res.header('Content-Type', 'application/json');
		res.send(data)
	}
})
