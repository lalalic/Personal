var Super=require("./entity"),
	_=require('underscore'),
	promise=require("node-promise"),
	defaults=require('./schema');
  
module.exports=Super.extend({
	kind:"apps",
	checkOwner: function(){
		return true
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
		return Super.prototype.update.apply(this,arguments)
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
	_getCollectionSchema: function(name, db){
		var p=new promise.Promise();
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
					return me._getCollectionSchema(info.name, db)
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
	},
	makeSchema: function(indexes){
		this.checkOwner()
		
		_.each(indexes,function(items, kind){
			delete indexes[kind]
			var index=indexes[kind]={}
			_.each(items, function(item){
				var name=""
				for(var i in item)
					i!="$option" && (name+=("_"+i+"_"+item[i]))
				index[name.substr(1)]=item
			})
		})
		
		
		var p=this.dbPromise(),
			_error=function(error){
				p.reject(error)
			};
		this.db.open(function(error, db){
			if(error) return _error(error)
			db.collection("system.indexes",function(error, collection){
				collection.find({name:{$ne:"_id_"}}, function(error, info){
					info.toArray(function(error, items){
						promise.allOrNone(_.compact(_.map(items, function(index){
							var kind=index.ns.split('.')[1],
								key=index.key,
								p0=new promise.Promise();
							if(!indexes[kind] || !indexes[kind][index.name]){
								db.dropIndex(kind, index.name, function(error){
									if(error) 
										p0.reject(error)
									else
										p0.resolve()
								});
								return p0
							}else
								delete indexes[index.name]
							return
						}))).then(function(){
							var tasks=[]
							_.each(indexes, function(items, kind){
								_.each(items, function(key,name){
									var option=key['$option'];
									if(option)
										delete key['$option']
									var p1=new promise.Promise()
									tasks.push(p1)
									db.createIndex(kind, key, option||{}, function(error){
										if(error)
											p1.reject(error)
										else
											p1.resolve()
									})
								})
							})
							
							promise.allOrNone(tasks).then(function(m){p.resolve(m)}, _error)
						}, _error)
					})
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
		return doc.name
	},
	resolveAppKey: function(Accesskey){
		return {name:Accesskey||"baby", author:"lalalic"}
	},
	routes:{
		"get /my/:app":function(req, res){this.send(res, req.path)},
		"get /my/:app/bootstrap":function(req, res){this.send(res, req.path)},
		"all /functions/:func":function(req, res){
			var me=this,service=new this(req,res);
			service.getCloudCode()
				.run(req.params.func, 
					{params:req.body||{},user:service.user}, 
					{success: function(o){me.send(o)},
						error: function(error){me.error(res)(error)}})
		},
		"get /schemas": function(req, res){
			(new this(req, res))
				.getSchema()
				.then(function(schema){
					this.send(res, {results:schema})
				}.bind(this),this.error(res))
		},
		"delete /schemas/:id": function(req, res){
			new this(req, res)
				.drop(req.params.id)
				.then(function(names){
					this.send(res,names)
				}.bind(this),this.error(res))
		},
		"post /schemas":function(req, res){
			(new this(req, res))
				.makeSchema(req.body)
				.then(function(){
					this.send(res)
				}.bind(this),this.error(res))
		},
		"get /createIndex": function(req, res){
			var service=new this(), mongo=require("mongodb")
			service.db=new mongo.Db("admin", service.getMongoServer(),{w:1})
			service.checkOwner=function(){return true}
			service.makeSchema(require("../data/schema"))
		}
	},		
	init: function(){
		Super.init.apply(this,arguments)
		if(require("../server").config.autoCreateIndex){
			var service=new this(), mongo=require("mongodb")
			service.db=new mongo.Db("admin", service.getMongoServer(),{w:0})
			service.checkOwner=function(){return true}
			service.makeSchema(require("../data/schema"))
		}
	}
})