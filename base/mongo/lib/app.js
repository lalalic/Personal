var Super=require("./entity"),
	_=require('underscore'),
	promise=require("node-promise"),
	defaults=require('./schema');
  
module.exports=Super.extend({
	kind:"apps",
	checkOwner: function(){
		if(this.app.author!=this.user._id)
			throw new Error("DON'T hack me. You are NOT the application owner.");
	},
	beforeCreate:function(doc){
		return this.asPromise()
	},
	afterCreate:function(){
		return this.asPromise()
	},
	beforeUpdate:function(){
		return this.asPromise()
	},
	afterUpdate:function(){
		return this.asPromise() 
	},
	beforeDelete: function(){
		return this.asPromise()
	},
	afterDelete: function(){
		return this.asPromise()
	},
	updateCloudCode: function(doc){
		this.checkOwner();
	},
	update: function(){
		this.checkOwner();
		return Super.update.call(this,arguments)
	},
	delete: function(){
		this.checkOwner();
		return Super.delete.call(this,arguments)
	},
	drop: function(name){
		this.checkOwner();
		var p=this.dbPromise()
		this.db.open(function(error, db){
			if(error) return p.reject(error);
			db.dropCollection(name,function(error, names){
				if(error) return p.reject(error);
				p.resolve(names)
			})
		})
		return p
	},
	getCollectionSchema: function(name, db){
		var p=this.dbPromise();
		db.collection(name,function(error, collection){
			if(error) return p.reject(error)
			collection.findOne({},function(error, doc){
				if(error) return p.reject(error)
				p.resolve(Object.keys(doc))
			})
		})
		return p
	},
	getSchema: function(){
		this.checkOwner();
		var p=this.dbPromise(), me=this;
		this.db.open(function(error, db){
			if(error) return p.reject(error);
			db.collectionNames(function(error, collections){
				if(error) return p.reject(error);
				var now=new Date()
				promise.all(_.filter(_.map(collections,function(info){
					if((info.name=info.name.split(".")[1])=='system')
						return false
					return me.getCollectionSchema(info.name, db)
						.then(function(schema){
							info.fields=schema
							info.createdAt=now
							return info
						})
				}), function(a){return a}))
				.then(function(schema){
					p.resolve(schema)
				}, function(error){
					p.reject(error)
				})
			})
		})
		return p
	}
},{
	afterPost: function(doc){
		var r=Super.afterPost.call(this,doc)
		r.apiKey=this.createAppKey(r)
		return r;
	},
	afterGet: function(doc){
		if(_.isArray(doc)){
			_.each(doc, function(d){
				d.apiKey=this.createAppKey(d)
			}.bind(this));
		}else
			doc.apiKey=this.createAppkey(doc)
		return doc;
	},
	createAppKey: function(doc){
		return doc._id
	},
	resolveAppKey: function(Accesskey){
		return {_id:Accesskey||"baby"}
	},
	routes:{
		"get /my/:app":function(req, res){this.send(res, req.path)},
		"get /my/:app/bootstrap":function(req, res){this.send(res, req.path)},
		"all /functions/:func":function(req, res){this.send(res, req.path)},
		"get /schemas": function(req, res){
			(new this(req, res))
				.getSchema()
				.then(function(schema){
					this.send(res, {results:schema})
				}.bind(this),this.error(res))
		},
		"delete /schemas/:id": function(req, res){
			new this(req, res).drop(req.params.id)
			.then(function(names){
				this.send(res,names)
			}.bind(this))
		}
	}
})