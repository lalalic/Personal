var Super=require("./entity"), _=require("underscore");
module.exports=Super.extend({
	kind:"users",
	encrypt: function(text){
		var hasher=require("crypto").createHash("MD5")
		hasher.update(text)
		return hasher.digest("base64")
	},
	beforeCreate: function(doc, collection, db){
		return Super.prototype.beforeCreate.apply(this,arguments)
			.then(_.bind(function(){
				if (!doc.username || !doc.password)
					throw new Error("user/password can't be empty.");
				doc.password=this.encrypt(doc.password);
			},this))
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
		
	}
},{
	afterPost: function(doc){
		return _.extend(Super.afterPost.call(this,doc),{
			sessionToken:this.createSessionToken(doc)
		})
	},
	routes:{
		"get /login": function(req, res){
			new this(req,res)
				.login(req.query.username, req.query.password)
				.then(function(user){
					delete user.password
					user.sessionToken=this.createSessionToken(user)
					this.send(res,user)
				}.bind(this),this.error(res))
		},
		"get /me": function(req, res){
			var user=new this(req,res).user
			delete user.password
			user.sessionToken=this.createSessionToken(user)
			this.send(res, user)
		},
		"put /requestPasswordReset": function(req, res){
			res.send(400, "not support yet")
		}
	},
	resolvSessionToken: function(token){
		return {username:token}
	},
	createSessionToken: function(user){
		return user.username
	}
})