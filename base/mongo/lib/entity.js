var _ = require("underscore"),
	mongo = require("mongodb"),
	promise = require("node-promise"),
	Promise = promise.Promise,
	ObjectID = mongo.ObjectID,
	Super = require("./service"),
	Internal_API=require("../server").config.Internal_API;

module.exports = Super.extend({
		constructor : function (req, res) {
			Super.call(this,req,res);
			if(req && req.header && req.params.collection){
				this.kind = req.params.collection
				if(this.app.name=='admin' && this.kind=='apps')
					throw new Error("no hack");		
			}
			if(this.app){
				this.db = new mongo.Db(this.app.name, this.getMongoServer(),{w:1});
				var log=function(){
					res.log && (res.log.message.contentLenth=(res._headers||{})['content-length'])
					this.saveLogs()
					delete res.log
				}.bind(this)
				if(res){
					res.on('finish', log);
      				res.on('close', log);
				}
			}
		},
		_reset: function(docs){
			var p = this.dbPromise();
			this.db.open(function(error, db){
				if(error) return p.reject(error)
				db.command({drop:this.kind},{writeCommand:true},function(error,result){
					if(error && error.errmsg=='ns not found')
						error=null;
					if(error) return p.reject(error)
					
					if(!docs || docs.length==0) return p.resolve({ok:1, n:0});
					
					db.command({insert:this.kind,documents: docs}, {writeCommand:true}, function(error, result){
						error ? p.reject(error) : p.resolve(result)
					})
				}.bind(this))
			}.bind(this))
			return p;
		},
		get : function (query, options) {
			var p = this.dbPromise();
			query = _.isString(query) ? (ObjectID.isValid(query) ? {_id:new ObjectID(query)}: {_id:query}) : query;
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					var op=query._id||(options&&options.limit==1) ? 'findOne' : 'find';
					collection[op](query, options||{}, function (error, result) {
						if(error) return p.reject(error);
						if(op=='findOne'){
							if(query._id && !result)
								p.reject("Not exists")
							else
								p.resolve(result)
						}else{
							result.toArray(function (error, docs) {
								error ? p.reject(error) : p.resolve(docs)
							})
						} 
					})
				})
			}.bind(this))
			return p
		},
		dbPromise: function(){
			var p=new Promise();
			p.addBoth(function(){this.db.close()}.bind(this))
			return p
		},
		saveLogs: function(){
			if(this.app && this.app.logs && this.app.logs.length){
				var p=this.dbPromise();
				this.db.open(function (error, db) {
					if(error) return p.reject(error)
					db.collection("logs",function(error, collection){
						if(error) return p.reject(error);
						collection.insert(this.app.logs,function(error){
							if(error) 
								return p.reject(error)
							this.app.logs=[]
							p.resolve()
						}.bind(this))
					}.bind(this))
				}.bind(this))
			}
		},
		asPromise: function(v){
			var p=new Promise();
			(v instanceof Error) ? p.reject(v) : (v==='new' ? p : p.resolve(v))
			return p
		},
		beforeCreate: function(doc,collection){
			return this.cloudCode().beforeCreate(_.extend({object:doc},this._req), this._res)
		},
		afterCreate: function(doc,collection){
			return this.cloudCode().afterCreate(_.extend({object:doc},this._req), this._res)
		},
		beforeUpdate: function(doc,collection){
			return this.checkACL(doc,collection,['update'])
				.then(function(old){
					return this.cloudCode().beforeUpdate(_.extend({object:doc,old:old},this._req), this._res)	
				}.bind(this))
		},
		afterUpdate:function(doc,collection){
			return this.cloudCode().afterUpdate(_.extend({object:doc},this._req), this._res)
		},
		beforeRemove: function(doc,collection){
			return this.checkACL(doc,collection,['remove'])
			.then(function(doc){
				return this.cloudCode().beforeRemove(_.extend({object:doc},this._req), this._res)
			}.bind(this))
		},
		afterRemove: function(doc,collection){
			return this.cloudCode().afterRemove(_.extend({object:doc},this._req), this._res)
		},
		create : function (docs) {
			var p = this.dbPromise(),
				_error=function(error){	p.reject(error)};
			docs=_.isArray(docs) ? docs: [docs];
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind,function (error, collection) {
					if(error) return p.reject(error)
					
					promise.allOrNone(_.map(docs, function(doc){
						var p0 = new Promise,
							_error0=function(error){p0.reject(error)};
						!doc._id && (doc._id=new ObjectID())
						this.beforeCreate(doc,collection).then(function(){
							doc.createdAt=doc.updatedAt=new Date()
							collection.insert(doc,function (error) {
								if(error) return p0.reject(error)
								this.afterCreate(doc,collection).then(function(){
									p0.resolve(doc)
								}, _error0)
							}.bind(this))
						}.bind(this), _error0)
						
						return p0
					},this))
					.then(function(docs){
						p.resolve(docs.length==1 ? docs[0] : docs)
					},_error)
				}.bind(this))
			}.bind(this))
			return p
		},
		patch: function(id, doc){
			return this.update(id, {$set:doc})
		},
		update: function(id, doc){
			var p = this.dbPromise(),
				_error=function(error){	
					p.reject(error)
				};
			ObjectID.isValid(id) && (id=new ObjectID(id));
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					doc._id=id;
					this.beforeUpdate(doc,collection).then(function(){
						var changes=doc['$set']||doc
						changes.updatedAt=new Date()
						delete doc._id;
						collection.findAndModify({_id:id}, null, doc, {new:true}, function (error,doc) {
							if(error) return p.reject(error)
							this.afterUpdate(doc, collection).then(function(){
								p.resolve(changes)
							},_error)
						}.bind(this))
					}.bind(this),_error);
				}.bind(this))
			}.bind(this))
			return p
		},
		remove: function(id){
			var p = this.dbPromise(),
				_error=function(error){	p.reject(error)};
			ObjectID.isValid(id) && (id=new ObjectID(id));
			var doc={_id:id}
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					this.beforeRemove(doc,collection).then(function(){
						collection.findAndRemove(doc,function (error,removed) {
							if(error) return p.reject(error)
							this.afterRemove(removed,collection).then(function(){
								p.resolve(removed)
							},_error)
						}.bind(this))
					}.bind(this),_error)
				}.bind(this))
			}.bind(this))
			return p
		},
		cloudCode: function(){
			if(this._cloud)
				return this._cloud;
				
			return this._cloud=this.getCloudCode().asKindCallback(this)
		},
		checkACL: function(doc, collection, caps){
			var p=this.asPromise('new')
			collection.findOne({_id:doc._id},function(error, doc){
				if(error) return p.reject(error);
				try{
					this.isAbleTo(doc,caps)
				}catch(error){
					return p.reject(error)
				}
				return p.resolve(doc)
			}.bind(this))
			return p
		},
		dump: function(){
			throw new Error("Not support yet")
		}
	}, {
		url : "/classes/:collection",
		checkUrl: function(req,res){
			if(req.params.collection && Internal_API.indexOf(req.params.collection)!=-1)
				this.noSupport()
		},
		beforePost:function(doc){
			if(_.isArray(doc))
				throw Error("Don't support post array!")
			return doc
		},
		afterPost:function(doc){
			return _.pick(doc,'createdAt', 'updatedAt', '_id')
		},
		afterGet: function(doc){
			return _.isArray(doc) ? {results:doc} : doc
		},
		getAdminDB: function(option){
			return new mongo.Db("admin", this.prototype.getMongoServer.call(),option||{w:0})
		},
		parseQuery: function(id, query){
			var filter = query.query ? JSON.parse(query.query, function (key, value) {
					var a;
					if (typeof value === 'string') {
						a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
						if (a) {
							return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
									+a[5], +a[6]));
						}
					}
					return value;
				}) : {};
			
			id && (filter={'_id' : ObjectID.isValid(id) ? new ObjectID(id) : id })
		
			var options = {};

			var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

			for (o in query) {
				if (test.indexOf(o) >= 0) {
					try {
						options[o] = JSON.parse(query[o]);
					} catch (e) {
						options[o] = query[o];
					}
				}
			}
			return [filter,options]
		},
		routes : {
			"get reset4Test": function(req, res){
				var service=new this(req,res),
					path=__dirname+"/../test/data/"+service.kind+".js",
					fs=require('fs'),
					exists=fs.existsSync(path),
					content=exists ? require('fs').readFileSync(path, 'utf8') : null,
					data=content ? (new Function("","return "+content))() : null;
					
				if(service.db.databaseName!="test")
					return this.noSupport()
					
				service._reset(data)
					.then(_.bind(function(result){
						this.send(res, result)
					},this),this.error(res))
			},
			"get :id?" : function (req, res) {
				var service=new this(req, res)
				var query=this.parseQuery(req.params.id,req.query);
				service.get.apply(service, query)
				.then(function (data) {
						this.send(res, this.afterGet(data))
					}.bind(this),this.error(res))
			},
			"post" : function(req, res){
				if(!req.body) 
					return this.send();
				new this(req, res)
					.create(this.beforePost(req.body))
					.then(_.bind(function(doc){
						this.send(res, this.afterPost(doc))
					},this),this.error(res))
			},
			"put :id": function(req, res){
				if(!req.body) return this.send();
				delete req.body._id;
				new this(req, res)
					.update(req.params.id, req.body)
					.then(_.bind(function(doc){
						this.send(res, _.pick(doc,'updatedAt'))
					},this),this.error(res))
			},
			"patch :id": function(req, res){
				if(!req.body) return this.send();
				new this(req, res)
					.patch(req.params.id, req.body)
					.then(_.bind(function(doc){
						this.send(res, _.pick(doc,'updatedAt'))
					},this),this.error(res))
			},
			"delete :id": function(req, res){
				new this(req, res)
					.remove(req.params.id)
					.then(function(num){
						this.send(res, true)
					}.bind(this),this.error(res))
			}
		}
	})
