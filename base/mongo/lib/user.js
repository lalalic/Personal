var Super=require("./entity");
module.exports=Super.extend({
	kind:"users",
	encrypt: function(text){
		var hasher=require("cypto").creatHash("MD5")
		hasher.update(text)
		return hasher.digest("base64")
	},
	beforeCreate: function(collection, user){
		var name=user.username
		if (name == null || name.length() == 0)
			throw new Error("user name can't be empty.");
		var password=user.password
		if (password == null || password.length() == 0)
			throw new Error("password can't be empty.");
		
		if(this.exists("username", name))
			throw new Error("user name has already been registered.");
		
		user.password=this.encrypt(password)
	},
	login: function(name, password){
		if (name == null || name.length() == 0)
			throw new Error("user name can't be empty.");
		
		if (password == null || password.length() == 0)
			throw new Error("password can't be empty.");
		
		return this.get({username: name}, {limit:1})
			.then(_.bind(function(user){
				if(user==null)
					throw new Error("username or password is not correct.");
				
				if (this.encrypt(password)==user.password))
					return user
				
				throw new Error("username or password is not correct.");
			},this))
		
	}
},{
	routes:{
		"post" : function(req, res){
			if(!req.body) return this.send();
			new this(req, res)
				.post(req.body)
				.then(_.bind(function(user){
					this.send(res, _.extend(_.pick(doc,'createdAt', 'updatedAt', '_id'),{
						sessionToken:this.createSessionToken(user)}))
				},this))
		},
		"get /login": function(req, res){
			new this(req,res)
				.login(req.query.username, req.query.password)
				.then(_.bind(function(user){
					delete user.password
					user.sessionToken=this.createSessionToken(user)
					this.send(res,user)
				},this))
		},
		"get /me": function(req, res){
			var user=new this(req,res).user
			delete user.password
			user.sessionToken=this.createSessionToken(user)
			this.send(res, user)
		},
		"put /requestPasswordReset": function(req, res){
			this.send(res,"not support yet")
		}
	},
	resolvSessionToken: function(token){
		return {_id:token||"anonymouse"}
	},
	createSessionToken: function(user){
		return user._id
	}
})