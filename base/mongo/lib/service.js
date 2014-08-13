var _=require("underscore"),
	mongo=require("mongodb"),me;

_.extend((me=module.exports=_.extend(function(request, response){
		if(!(request && request.header)){
			this.app=request;
			this.user=response;
		}else{
			this.app=request.application
			this.user=require("./user").resolvSessionToken(request.header("X-Session-Token")||request.query['X-Session-Token'])
			this._req={user:this.user};
			this._res={
				success: function(o){
					me.send(response, o)
				}, 
				error: function(error){
					me.error(response)(error)
				}
			};
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
		_.extend(child, parent, staticProps);

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
				root=this.url ? this.url : "/"+this.prototype.kind,
				url=/^\//.test(path) ? path : (/\/$/.test(root)||path.length==0 ? root : root+"/")+path;
			if(!_.isFunction(handler))
				handler=function(req,res){
					this.send(res,req.path)
				}.bind(this);
			app[verb]("/"+this.version+url,function(req, res, next){
				try{
					this.checkUrl(req,res)
					require("./app").resolveAppKey(req.header('X-Application-Id')||req.query['X-Application-Id'])
					.then(function(app){
						try{
							this.checkApp(req.application=app);
							(app.logs || (app.logs=[])).push(res.log={
								createdAt:new Date(), 
								level:9,
								message:{
									remote:	req.ip||req._remoteAddress||(req.connection&&req.connection.remoteAddress),
									method: req.method,
									path: req.originalUrl || req.url,
									httpVersion: req.httpVersionMajor + '.' + req.httpVersionMinor,
									referrer: req.headers['referer'] || req.headers['referrer'],
									userAgent: req.headers['user-agent']
								}
							})
							
							handler.call(this,req, res, next)
						}catch(error){
							this.error(res)(error)
						}	
					}.bind(this),this.error(res))
				}catch(error){
					this.error(res)(error)
				}
			}.bind(this))
			console.log("added route: "+verb+" "+url)
		},this)
		console.log("\n\r")
	},
	checkUrl:function(){},
	checkApp:function(app){
		if(!app)
			this.noSupport()
	},
	send: function(res, data){
		if(res._sended)
			return
		res.header('Content-Type', 'application/json');
		res.log && (res.log.message.status=200)
		res.send(data||{})
		res._sended=true
	},
	error: function(res){
		return function(error){
			if(res._sended) return;
			res.log && (res.log.message.status=400)
			res.send(400, error.message||error);	
			res._sended=true
		}
	},
	noSupport: function(){
		throw new Error("No hack.")
	}
})).prototype,{
	getMongoServer: function(){
		var config=require("../server").config
		return new mongo.Server(config.db.host, config.db.port, {'auto_reconnect':true,safe:true})
	},
	getCloudCode: function(){
		var Module=module.constructor,
			filename=__dirname+"/_app/"+this.app.name+".js",
			appModule=Module._cache[filename];
		if(!appModule || appModule.updatedAt!=this.app.updatedAt){
			var cloud=require("./cloud").load(this.app,filename);
			appModule=new Module(filename);
			appModule.exports=cloud;
			appModule.filename=filename;
			appModule.updatedAt=this.app.updatedAt||this.app.createdAt;
			Module._cache[filename]=appModule; 
		}
		return appModule.exports;
	},
	isAbleTo: function(doc, caps){
		return true
	}
})
