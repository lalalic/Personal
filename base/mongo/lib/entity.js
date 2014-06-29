var _ = require("underscore"),
	mongo = require("mongodb"),
	Promise = require("node-promise").Promise,
	ObjectID = mongo.ObjectID,
	Super = require("./service");

module.exports = Super.extend({
		constructor : function (req, res) {
			Super.apply(this,arguments);
			req.params.collection && (this.kind = req.params.collection)
			this.db = new mongo.Db(this.app.dbName, this.getMongoServer())
		},
		run: function(command){
			var p = new Promise;
			this.db.open(_.bind(function(error, db){
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
					collection[query._id ? 'findOne' : 'find'](query, options, function (error, result) {
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
		beforeCreat: function(collection, doc){},
		afterCreat: function(collection, doc){},
		post : function (doc) {
			var p = new Promise;
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					!doc._id && (doc._id=new ObjectID())
					this.beforeCreat(collection, doc)
					doc.createdAt=doc.updatedAt=new Date()
					doc.author={_id:this.user._id, name:this.user.name}
					collection.insert(doc, _.bind(function (error) {
						if(error) return p.reject(error)
						this.afterCreat(collection, doc)
						p.resolve(doc)
						db.close()
					},this))
				},this))
			}, this))
			return p
		},
		beforeUpdate: function(collection, doc){},
		afterUpdate:function(collection, doc){},
		put: function(id, doc){
			var p = new Promise;
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					this.beforeUpdate(collection, doc)
					doc.updatedAt=new Date()
					doc.lastModifier={_id:this.user._id, name:this.user.name}
					collection.update({_id:id},doc, _.bind(function (error) {
						if(error) return p.reject(error)
						this.afterUpdate(collection, doc)
						p.resolve(doc)
						db.close()
					},this))
				},this))
			}, this))
			return p
		},
		beforeDelete: function(collection, id){},
		afterDelete: function(collection, id){},
		delete: function(id){
			var p = new Promise;
			this.db.open(_.bind(function (error, db) {
				if(error) return p.reject(error)
				db.collection(this.kind, _.bind(function (error, collection) {
					if(error) return p.reject(error)
					this.beforeDelete(collection, id);
					collection.remove({_id:id},_.bind(function (error) {
						if(error) return p.reject(error)
						this.afterDelete(collection, id);
						p.resolve()
						db.close()
					},this))
				},this))
			}, this))
			return p
		}
	}, {
		url : "/:collection",
		routes : {
			"get reset": function(req, res){
				var service=new this(req,res);
				service.reset(require("../test/data/"+service.kind+".json"))
					.then(_.bind(function(result){
						this.send(res, result)
					},this))
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
						this.send(res, query._id ? data : {results:data})
					}, this))
			},
			"post" : function(req, res){
				if(!req.body) return this.send();
				new this(req, res)
					.post(req.body)
					.then(_.bind(function(doc){
						this.send(res, _.pick(doc,'createdAt', 'updatedAt', '_id'))
					},this))
			},
			"put :id": function(req, res){
				if(!req.body) return this.send();
				new this(req, res)
					.put(req.params.id, req.body)
					.then(_.bind(function(doc){
						this.send(res, _.pick(doc,'updatedAt'))
					},this))
			},
			"delete :id": function(req, res){
				new this(req, res)
					.delete(req.params.id)
					.then(_.bind(function(num){
						this.send(res, true)
					},this))
			}		}
	})
