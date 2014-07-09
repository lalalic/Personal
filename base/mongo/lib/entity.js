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
			this.app && (this.db = new mongo.Db(this.app._id, this.getMongoServer(),{w:0}))
		},
		run: function(command){
			var p = new Promise;
			this.db.open(_.bind(function(error, db){
				var convertNodeAsyncFunction = promise.convertNodeAsyncFunction
				var runCommand=convertNodeAsyncFunction(db.command)
				db.command(command,function(error,result){
					error ? p.reject(error) : p.resolve(result)
					db.close()
				})
			},this))
			return p;
		},
		reset: function(docs){
			var p = new Promise;
			this.db.open(_.bind(function(error, db){
				db.command({drop:this.kind},_.bind(function(error,result){
					if(error && error.errmsg=='ns not found')
						error=null;
					if(error) return p.reject(error)
					db.command({insert:this.kind,documents: docs}, function(error, result){
						error ? p.reject(error) : p.resolve(result)
						db.close()
					})
				},this))
			},this))
			return p;
		},
		get : function (query, options) {
			var p = new Promise;
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, function (error, collection) {
					if(error) return p.reject(error)
					collection[query._id ? 'findOne' : 'find'](query, options||{}, function (error, result) {
						if(error) return p.reject(error);
						query._id ? p.resolve(result) :
							result.toArray(function (error, docs) {
								error ? p.reject(error) : p.resolve(docs)
								db.close()
							})
					})
				})
			}, this))
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
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					
					promise.all(_.map(docs, function(doc){
						var p0 = new Promise,
							_error0=function(error){p0.reject(error)};
						!doc._id && (doc._id=new ObjectID())
						this.user && this.user._id && (doc.author=this.user._id)
						this.beforeCreate(doc,collection,db).then(_.bind(function(){
							doc.createdAt=doc.updatedAt=new Date()
							collection.insert(doc, _.bind(function (error) {
								if(error) return p0.reject(error)
								this.afterCreate(doc,collection,db).then(function(){
									p0.resolve(doc)
									db.close()
								}, _error0)
							},this))
						},this), _error0)
						return p0
					},this)).then(function(docs){
						p.resolve(docs.length==1 ? docs[0] : docs)
					},_error)
					
				},this))
			}, this))
			return p
		},
		beforeUpdate: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		afterUpdate:function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		update: function(id, doc){
			var p = new Promise,
				_error=function(error){	p.reject(error)};
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					doc.updatedAt=new Date()
					doc.lastModifier=this.user._id
					this.beforeUpdate(doc,collection,db).then(_.bind(function(){
						collection.update({_id:id},doc, _.bind(function (error) {
							if(error) return p.reject(error)
							this.afterUpdate(doc,collection,db).then(function(){
								p.resolve(doc)
								db.close()
							},_error)
						},this))
					},this),_error);
				},this))
			}, this))
			return p
		},
		beforeDelete: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		afterDelete: function(doc,collection,db){
			return this.cloudCode().beforeCreate.call(global, doc, collection, db)
		},
		delete: function(id){
			var p = new Promise,
				_error=function(error){	p.reject(error)};
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					this.beforeDelete(id,collection,db).then(_.bind(function(){
						collection.remove({_id:id},_.bind(function (error) {
							if(error) return p.reject(error)
							this.afterDelete(id,collection,db).then(function(){
								p.resolve()
								db.close()
							},_error)
						},this))
					},this),_error)
				},this))
			}, this))
			return p
		},
		cloudCode: function(){
			if(this._cloud)
				return this._cloud;
				
			var Module=module.constructor,
				appModule=Module._cache[id],
				id=__dirname+"/_app/"+this.app._id+".js";
			if(!appModule || appModule.updatedAt!=this.app.updatedAt){
				var Cloud=require("Cloud");
				appModule=new Module(".");
				appModule._compile("module.exports=function(Cloud){"+this.app.cloudCode+"; return Cloud;}", {filename: id});
				appModule.id=id;
				appModule.updatedAt=this.app.updatedAt;
				appModule.exports=appModule.exports(new Cloud());
			}
			return this._cloud=appModule.exports.asKindCallback(this.kind)
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
		routes : {
			"get reset": function(req, res){
				var service=new this(req,res);
				service.reset(require("../test/data/"+service.kind+".json"))
					.then(_.bind(function(result){
						this.send(res, result)
					},this),this.error(res))
			},
			"get :id?" : function (req, res) {
				var query = req.query.query ? JSON.parse(req.query.query, function (key, value) {
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

				// Providing an id overwrites giving a query in the URL
				if (req.params.id) {
					query = {
						'_id' : ObjectID.isValid(req.params.id) ? new ObjectID(req.params.id) : req.params.id 
					};
				}
				var options = req.params.options || {};

				var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

				for (o in req.query) {
					if (test.indexOf(o) >= 0) {
						try {
							options[o] = JSON.parse(req.query[o]);
						} catch (e) {
							options[o] = req.query[o];
						}
					}
				}

				new this(req, res)
				.get(query, options)
				.then(_.bind(function (data) {
						data=this.afterGet(data)
						this.send(res, query._id ? data : {results:data})
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
				new this(req, res)
					.update(req.params.id, req.body)
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
