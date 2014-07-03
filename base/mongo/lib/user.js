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
				if (!doc._id || !doc.password)
					throw new Error("user/password can't be empty.");
				doc.password=this.encrypt(doc.password);
			},this))
	},
	login: function(name, password){
		if (!name || !password)
			throw new Error("name or password can't be empty.");
		
		return this.get({_id: name})
			.then(_.bind(function(doc){
				if(doc==null)
					throw new Error("username or password is not correct.");
				
				if (this.encrypt(password)==doc.password)
					return doc
				
				throw new Error("username or password is not correct.");
			},this))
		
	}
},{
	beforePost: function(doc){
		doc._id=doc.username;
		delete doc.username;
		return doc
	},
	afterPost: function(doc){
		return _.extend(Super.afterCreate(doc),{sessionToken:this.createSessionToken(user)})
	},
	routes:{
		"get /login": function(req, res){
			new this(req,res)
				.login(req.query.username, req.query.password)
				.then(_.bind(function(user){
					delete user.password
					user.sessionToken=this.createSessionToken(user)
					this.send(res,user)
				},this),this.error(res))
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
		return {_id:token||"anonymouse"}
	},
	createSessionToken: function(user){
		return user._id
	},
	schema:{
		_id: "users", 
		fields:{_id:"String",createdAt:"Date",updatedAt:"Date",ACL:"Object"},
		indexs:{author:1}
	}
})