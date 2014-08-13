var Super=require("./entity"), _=require("underscore");
module.exports=Super.extend({
	kind:"users",
	encrypt: function(text){
		var hasher=require("crypto").createHash("MD5")
		hasher.update(text)
		return hasher.digest("base64")
	},
	beforeCreate: function(doc){
		if (!doc.username || !doc.password)
				throw new Error("user/password can't be empty.");
		doc.password=this.encrypt(doc.password);	
		return Super.prototype.beforeCreate.apply(this,arguments)
	},
	login: function(name, password){
		if (!name || !password)
			throw new Error("name or password can't be empty.");
		
		return this.get({username: name},{limit:1})
			.then(function(doc){
				if(doc==null)
					throw new Error("username or password is not correct.");
				
				if (this.encrypt(password)==doc.password)
					return doc
				
				throw new Error("username or password is not correct.");
			}.bind(this))
		
	},
	getUserInfo: function(){
		return this.get(this.user,{limit:1})
	},
	_reset: function(){
		if(this.db.databaseName=='admin')
			this.noSupport()
			
		return Super.prototype._reset.apply(this,arguments)
	}
},{
	url:"/users",
	afterPost: function(doc){
		delete doc.password
		return _.extend(doc,{
			sessionToken:this.createSessionToken(doc)
		})
	},
	routes:{
		"get reset4Test": Super.routes['get reset4Test'],	
		"post": Super.routes['post'],
		"get /login": function(req, res){
			new this(req,res)
				.login(req.query.username, req.query.password)
				.then(function(user){
					delete user.password
					user.sessionToken=this.createSessionToken(user)
					this.send(res,user)
				}.bind(this),this.error(res))
		},
		"get me": function(req, res){
			new this(req,res).getUserInfo()
				.then(function(user){
					if(user){
						delete user.password
						user.sessionToken=this.createSessionToken(user)
						this.send(res, user)	
					}else
						this.error(res)("Invalid Session")
				}.bind(this),this.error(res))
			
		},
		"post /requestPasswordReset": function(req, res){
			this.error(res)("Not support yet")
		},
		"all /functions/:func":function(req, res){
			var service=new this(req,res);
			service._req.params=req.body||{}
			var cloud=service.getCloudCode();
			cloud.run(req.params.func, service._req, service._res)
		},
		
	},
	resolvSessionToken: function(token){
		return {_id:token||"test", username:token||"test"}
	},
	createSessionToken: function(user){
		return user.username
	}
})