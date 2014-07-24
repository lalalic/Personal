var Super=require("./entity"),
	_=require('underscore'),
	promise=require("node-promise"),
	defaults=require('./schema');
  
module.exports=Super.extend({
	constructor:function(req, res){
		Super.call(this,req,res);
	},
	kind:"apps",
	checkOwner: function(){
		return true
		if(this.app.author!=this.user._id)
			Super.noSupport();
	},
	beforeCreate:function(doc){
		if(!doc.name){
			var p=new promise.Promise()
			p.reject(new Error("application name can't be empty"))
			return p
		}
		return this.asPromise()
	},
	afterCreate:function(){
		return this.asPromise()
	},
	beforeUpdate:function(doc){
		var attr=doc.doc, changes=attr['$set']||attr,temp;
		if((temp=changes.cloudCode)){
			try{
				new Function("Cloud",temp)
			}catch(error){
				var p=new promise.Promise()
				p.reject(error);
				return p
			}
		}
		this.author=_.pick(this.user,"_id","username")
		return this.asPromise()
	},
	afterUpdate:function(){
		return this.asPromise() 
	},
	beforeRemove: function(){
		return this.asPromise()
	},
	afterRemove: function(){
		return this.asPromise()
	},
	update: function(id, doc){
		this.checkOwner();
		return Super.prototype.update.apply(this,arguments)
	},
	remove: function(){
		this.checkOwner();
		return Super.remove.call(this,arguments)
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
				p.resolve(doc && Object.keys(doc) || [])
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
								delete indexes[kind][index.name]
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
									db.createIndex(kind, key, option||{}, function(error,indexName){
										if(error || indexName==null)
											p1.reject(error)
										else
											p1.resolve(kind+"."+name)
									})
								})
							})
							
							promise.allOrNone(tasks).then(function(m){
								p.resolve(m)
							}, _error)
						}, _error)
					})
				})
			})
		})
		
		return p
	},
	getIndexes: function(){
		var p=this.dbPromise()
		this.db.open(function(error, db){
			if(error) return p.reject(error)	
			db.collection("system.indexes",function(error, collection){
				collection.find({name:{$ne:"_id_"}}, function(error, info){
					if(error) return p.reject(error)
					info.toArray(function(error, items){
						if(error) return p.reject(error)	
						var indexes={}
						_.each(items, function(index){
							var kind=index.ns.split('.')[1],
								key=index.key;
							(indexes[kind]=indexes[kind]||[]).push(key)
							if(index.unique)
								key['$option']={unique:true}
						})
						p.resolve(indexes)
					})
				})
			})
		})
		
		return p
	},
	_reset: function(docs){
		var p=this.dbPromise()
		this.db.open(function(error, db){
			if(error) return p.reject(error)	
			db.collection(this.kind,function(error, collection){
				if(error) return p.reject(error)
				collection.remove({author:"_test"}, function(error){
					if(error) return p.reject(error)
					collection.remove({author:"__test"}, function(error){
						if(error) return p.reject(error)
						collection.insert(docs,function(error){
							if(error) return p.reject(error)
							p.resolve({ok:1,n:docs.length})
						})
					})
				})
			})
		}.bind(this))
		
		return p
	}
},{
	afterPost: function(doc){
		var r=Super.afterPost.call(this,doc)
		r.apiKey=this.createAppKey(doc)
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
	resolveAppKey: function(key){
		var service=new this()
		service.db=this.getAdminDB()
		service.checkOwner=function(){return true}
		return service.get({name:key},{limit:1})
	},
	routes:_.extend({},Super.routes,{
		"get reset4Test": function(req, res){
			var service=new this(req,res),
				path=__dirname+"/../test/data/"+service.kind+".json",
				fs=require('fs'),
				exists=fs.existsSync(path),
				content=exists ? require('fs').readFileSync(path, 'utf8') : null,
				data=content ? JSON.parse(content) : null;
				
			service.db=this.getAdminDB();
				
			service._reset(data)
				.then(_.bind(function(result){
					this.send(res, result)
				},this),this.error(res))
		},
		"get /my/:app":function(req, res){
			this.send(res, req.path)
			
		},
		"get /my/:app/bootstrap":function(req, res){this.send(res, req.path)},
		"all /functions/:func":function(req, res){
			var me=this,service=new this(req,res);
			service.getCloudCode()
				.run(req.params.func, 
					{params:req.body||{},user:service.user}, 
					{success: function(o){me.send(res, o)},
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
		"get /indexes": function(req, res){
			(new this(req, res))
				.getIndexes()
				.then(function(indexes){
					this.send(res, indexes)
				}.bind(this), this.error(res))
		}
	}),		
	init: function(){
		Super.init.apply(this,arguments)

		var service=new this()
		service.db=this.getAdminDB({w:1});
		service.checkOwner=function(){return true}
		//create admin db indexes
		if(require('../server').config.autoCreateIndex)
			service.makeSchema(JSON.parse(JSON.stringify(require("../data/schema"))))
				.then(function(){
					console.info("indexes are updated")
				},function(error){
					console.error(error.message)
				})
	}
})