var _ = require("underscore"),
	mongo = require("mongodb"),
	promise = require("node-promise"),
	Promise = promise.Promise,
	ObjectID = mongo.ObjectID,
	Super = require("./service");

module.exports = Super.extend({
		constructor : function (req, res) {
			Super.call(this,req,res);
			req && req.header && req.params.collection && (this.kind = req.params.collection)
			this.app && (this.db = new mongo.Db(this.app.name, this.getMongoServer(),{w:1}))
		},
		run: function(command){
			var p = this.dbPromise();
			this.db.open(_.bind(function(error, db){
				var convertNodeAsyncFunction = promise.convertNodeAsyncFunction
				var runCommand=convertNodeAsyncFunction(db.command).bind(db)
				db.command(command,function(error,result){
					error ? p.reject(error) : p.resolve(result)
				})
			},this))
			return p;
		},
		reset: function(docs){
			var p = this.dbPromise();
			this.db.open(function(error, db){
				if(error) return p.reject(error)
				db.command({drop:this.kind},function(error,result){
					if(error && error.errmsg=='ns not found')
						error=null;
					if(error) return p.reject(error)
					db.command({insert:this.kind,documents: docs}, function(error, result){
						error ? p.reject(error) : p.resolve(result)
					})
				}.bind(this))
			}.bind(this))
			return p;
		},
		get : function (query, options) {
			var p = this.dbPromise();
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					var op=query._id||(options&&options.limit==1) ? 'findOne' : 'find';
					collection[op](query, options||{}, function (error, result) {
						if(error) return p.reject(error);
						op=='findOne' ? p.resolve(result) :
							result.toArray(function (error, docs) {
								error ? p.reject(error) : p.resolve(docs)
							})
					})
				})
			}.bind(this))
			return p
		},
		dbPromise: function(){
			var p=new Promise(),
				closeDB=function(){this.db.close()}.bind(this);
			p.then(closeDB,closeDB)
			return p
		},
		asPromise: function(){
			var p=new Promise()
			p.resolve()
			return p
		},
		beforeCreate: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		afterCreate: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		create : function (docs) {
			var p = new Promise,
				_error=function(error){	p.reject(error)};
			docs=_.isArray(docs) ? docs: [docs];
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind,function (error, collection) {
					if(error) return p.reject(error)
					
					promise.all(_.map(docs, function(doc){
						var p0 = new Promise,
							_error0=function(error){p0.reject(error)};
						!doc._id && (doc._id=new ObjectID())
						this.beforeCreate(doc,collection,db).then(function(){
							doc.createdAt=doc.updatedAt=new Date()
							collection.insert(doc, function (error) {
								if(error) return p0.reject(error)
								this.afterCreate(doc,collection,db).then(function(){
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
		beforeUpdate: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		afterUpdate:function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		patch: function(id, doc){
			return this.update(id, {$set:doc})
		},
		update: function(id, doc){
			var p = this.dbPromise(),
				_error=function(error){	p.reject(error)};
			ObjectID.isValid(id) && (id=new ObjectID(id));
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					var changes=doc['$set']||doc
					delete changes._id
					changes.updatedAt=new Date()
					this.beforeUpdate({_id:id,doc:doc},collection,db).then(function(){
						collection.update({_id:id},doc, function (error) {
							if(error) return p.reject(error)
							this.afterUpdate({_id:id,doc:doc},collection,db).then(function(){
								p.resolve(changes)
							},_error)
						}.bind(this))
					}.bind(this),_error);
				}.bind(this))
			}.bind(this))
			return p
		},
		beforeDelete: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		afterDelete: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		delete: function(id){
			var p = this.dbPromise(),
				_error=function(error){	p.reject(error)};
			ObjectID.isValid(id) && (id=new ObjectID(id));
			this.db.open(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					this.beforeDelete(id,collection,db).then(function(){
						collection.remove({_id:id},function (error) {
							if(error) return p.reject(error)
							this.afterDelete(id,collection,db).then(function(){
								p.resolve()
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
		}
	}, {
		url : "/classes/:collection",
		beforePost:function(doc){
			if(_.isArray(doc))
				throw Error("Don't support post array!")
			return doc
		},
		afterPost:function(doc){
			return _.pick(doc,'createdAt', 'updatedAt', '_id')
		},
		afterGet: function(doc){
			return doc
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
			"get reset": function(req, res){
				var service=new this(req,res);
				service.reset(require("../test/data/"+service.kind+".json"))
					.then(_.bind(function(result){
						this.send(res, result)
					},this),this.error(res))
			},
			"get :id?" : function (req, res) {
				var service=new this(req, res)
				var query=this.parseQuery(req.params.id,req.query);
				service.get.apply(service, query)
				.then(_.bind(function (data) {
						data=this.afterGet(data)
						this.send(res, query[0]._id ? data : {results:data})
					}, this),this.error(res))
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
					.delete(req.params.id)
					.then(_.bind(function(num){
						this.send(res, true)
					},this),this.error(res))
			}
		}
	})
