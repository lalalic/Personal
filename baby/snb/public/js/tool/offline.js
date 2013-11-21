define('tool/offline',['schema','tool/uploader'],function(schema){
	var _schema=schema
	var IMAGE_DATA_SCHEME="data:image/jpeg;base64,"
	Array.prototype.union=function(a,from){for(var i=from||0;i<(a||[]).length;i++) this.push(a[i]);return this}
	Array.prototype.fill=function(a,times){for(var i=times-1;i>=0;i--) this.push(a);return this} 
	Date.fromTime=function(t){var a=new Date();a.setTime(t);return a}
	var _request=Parse._request
	Parse._request=function(o){
		if(!$.isOnline())
			return offline[o.route][o.method](o);
		var promise=_request.apply(null,arguments)
		switch(o.route){
		case 'classes':
			return promise.then(function(response){
				switch(o.method){
				case 'GET':
					websql.cache(o.className,response.results)
					break
				case 'PUT'://update
					var fields=[],values=[],table=schema[o.className].fields
					_.each(o.data,function(value,field){
						fields.push(field+'=?')
						values.push(table[field].toDB(value))
					})
					fields.push('updatedAt=?')
					values.push(Parse._parseDate(response.updateAt).getTime())
					values.push(o.objectId)
					websql.run('update '+o.className+' set '+fields.join(',')+' where objectId=?',values)
					break
				case 'DELETE'://delete
					websql.run('delete from '+o.className+' where objectId=?',[o.objectId])
					break
				case 'POST'://add
					websql.cache(o.className,[response])
					break
				}
				return response
			})
		break;
		default:
			return promise;
		}
	}

	if(!('needSync' in localStorage))
		localStorage['needSync']=false
	var DataType={}
	{//supported data types
	var h=function(v){return v==undefined?null:v},
		TEXT=DataType.TEXT={type:'text',toDB:h,toJSON:h,
			extend:function(p){return _.extend({},this,p)}
		},
		INT=DataType.INT=TEXT.extend({type:'integer'}),
		DATE=DataType.DATE=INT.extend({
			toDB:function(v){return (v=h(v))?Parse._parseDate(v).getTime():v},
			toJSON:function(v){return (v=h(v))?Date.fromTime(v).toISOString():v}
		}),
		FILE=DataType.FILE=TEXT.extend({
			toDB:function(v){return (v=h(v))?v.url:v},
			toJSON:function(v){return (v=h(v))?{__type: "File",url:v,name:v.substr(v.lastIndexOf('/')+1)}:v}
		}),
		ARRAY=DataType.ARRAY=_.extend([TEXT],{
			type:'text',
			toDB:function(v){
				return ((v=h(v)) && _.has(v,'objects')) ? _.compact(_.map(v.objects,function(o){return this.toDB(o)},this[0])).join(',') :v
			},
			toJSON:function(v){//v is a,b,c
				return (v=h(v)) ?_.map(v.split(','),function(o){
						return this.toJSON(this.type=='integer'?parseInt(o):o)
					},this[0]) : v
			}
		}),
		TABLE=DataType.TABLE={fields:{cachedAt:DATE,createdAt:DATE,updatedAt:DATE,objectId:TEXT},indexes:{},
			cachable:function(o){return o},
			trim:function(){},
			destroy:function(objectId,tableName){
				var tickets=[]
				tickets.push(websql.run('delete from pending where objectId=?',[objectId]))
				tickets.push(websql.run('delete from '+tableName+' where objectId=?',[objectId]))
				return Promise.when(tickets)
			},
			sync:function(request){return _request(request)},
			syncID:function(request,fields){
				_.each(fields,function(field){
					if(request.data[field] && request.data[field].match(/^pending/))
						request.data[field]=pended[request.data[field]]
				})
			},
			extend: function(p){
				var extended=_.extend({},this,p)
				_.each('fields,indexes'.split(','),function(o){
					if(o in p)
						_.extend(extended[o],this[o],p[o])
				},this)
				return extended
			}
		}
	}
		
	var websql;
	function extendWebsql(){
		_.extend(websql,{
			run: function(sql,values,tx){
				var promise = new Promise(),
					args=arguments,
					h=function(tx){
						tx.executeSql(sql,values,function(tx,results){
								console.debug(sql)
								promise.resolve.apply(promise,[tx,results].union(args,3))
							},function(tx,error){
								console.error(sql+"\n"+error.message)
								promise.reject(error)
							})
					};
				tx ? h(tx) : this.transaction(h)
				return promise
			},
			pending: function(values,tx){
				localStorage['needSync']=true
				return this.run.apply(this,['insert into pending(tablename,objectId,createdAt,request,title)values(?,?,?,?,?)',values,tx].union(arguments,2))
			},
			cache:function(tableName,objects){
				var table=schema[tableName],cachedAt=new Date().toJSON(),
					sql=["replace into "+tableName+"("],fields=[]
				_.each(table.fields,function(data,field){ fields.push(field)})
				
				sql.push(fields.join(','))
				sql.push(')values('+[].fill('?',fields.length).join(',')+')')
				sql=sql.join(' ');
				
				(function(sql,values){
					//slow sync, so have to create function
					this.transaction(function(tx){
						_.each(values,function(params){websql.run(sql,params,tx)})
					})
				}).call(this,sql,
					_.compact(_.map(objects,function(o){
						if(!(o=table.cachable(o))) 
							return 
						o.cachedAt=cachedAt
						var values=_.map(fields,function(field){
							return table.fields[field].toDB(o[field])
						})
						delete o.cachedAt
						return values
					}))
				);
			}
		})
	}
	var pended={}, dbName='parse.supernaiba',stoppedSync=false
	var offline=_.extend({
		websql:websql,
		stopSync: function(){
			stoppedSync=true
		},
		needSync: function(){
			return localStorage['needSync']
		},
		classes:{
			GET:function(o){
				var sql=["select * from "+o.className], 
					where=[],values=[], table=schema[o.className].fields	
				if(_.has(o,'objectId')){
					where.push('objectId=?')
					values.push(o.objectId)
				}
				if(_.has(o,'data')){
					if(_.has(o.data,'where')){	
						_.each(o.data.where,function(value,field){
							where.push(field+'=?')
							values.push(table[field].toDB(value))
						})
					}
					where.length && sql.push(' where ' + where.join(' and '));
					if(_.has(o.data,'order'))
						sql.push(' order by '+o.data.order)
					if(_.has(o.data,'limit'))
						sql.push(' limit '+o.data.limit)	
				}else
					where.length && sql.push(' where ' + where.join(' and '));
					
				sql=sql.join(' ')
				
				return websql.run(sql,values)
					.then(function(tx,results){
							var data=[],
								table=schema[o.className].fields,
								promise = new Promise();
							for(var i=0,len=results.rows.length;i<len;i++){
								var ob={}, a=results.rows.item(i)
								for(var field in a)
									ob[field]=table[field].toJSON(a[field])
								data.push(ob)
								delete ob.cachedAt
							}
							promise.resolve(_.has(o,'objectId') ? (data.length&&data[0]||null) :{results:data})
							return promise
						})
			},
			PUT: function(o){
				return websql.pending([o.className,o.objectId,Date.now(),JSON.stringify(o),"update "+o.className+"="+o.objectId],null,o)
					.then(function(tx,results,o){
						var promise=new Promise(),
							table=schema[o.className].fields,
							fields=[],values=[],now=Date.now()
						_.each(o.data,function(value,field){
							fields.push(field+'=?')
							values.push(table[field].toDB(value))
						})
						fields.push('updatedAt=?')
						values.push(now)
						values.push(o.objectId)
						websql.run('update '+o.className+' set '+fields.join(',')+' where objectId=?',values)
						promise.resolve({updatedAt:Date.fromTime(now).toJSON()})
						return promise
					})
			},
			POST: function(o){
				var now=Date.now()
				return websql.pending([o.className,'pending'+now,now,JSON.stringify(o),"create new "+o.className])
					.then(function(tx,results){
						var promise=new Promise(),
							table=schema[o.className].fields,
							fields=[],values=[], ob={}
						_.each(o.data,function(value,field){
							fields.push(field)
							values.push(table[field].toDB(ob[field]=value))
						})

						fields.push('createdAt')
						fields.push('updatedAt')
						fields.push('cachedAt')
						values.fill(now,3)
						fields.push('objectId')
						values.push(ob['objectId']=('pending'+now))
						ob.createdAt=ob.updatedAt=table.updatedAt.toJSON(now)
						if('author' in table){
							var user=Parse.User.current()
							fields.push('author'), values.push(user.id)
							fields.push('authorName'), values.push(user.get('username'))
						}
						websql.run('insert into '+o.className+'('+fields.join(',')+')values('
							+[].fill('?',fields.length).join(',')+')',values,tx)
							.then(function(){
									promise.resolve(ob)		
								},function(e){
									promise.reject(e.message)
								})
						return promise
					})
			},
			DELETE: function(o){
				if(o.objectId && o.objectId.match(/^pending/)){
					return schema[o.className].destroy(o.objectId, o.className)
				}else{
					var p=new Promise
					websql.pending([o.className,null,Date.now(),JSON.stringify(o), "delete "+o.className+"="+o.objectId],null,o)
						.then(function(tx){
							websql.run('delete from '+o.className+' where objectId=?',[o.objectId],tx)
								.then(function(){
									p.resolve()
								})
						})
					return p
				}
			}
		}, 
		files:{
			POST: function(o){
				return Promise.as({name:o.className,url:IMAGE_DATA_SCHEME+o.data.base64})
			}
		},
		users:{},
		trim:function(){
			var all=[]
			for(var i in schema)
				all.push(schema[i].trim())
			return Promise.when(all)
		},
		sync:function(){
			if(!$.isOnline())
				return Promise.as()
			return this.websql.run('select * from pending')
			.then(function(tx,query){
				query.rows.length && offline.trigger('sync',query)
				var pendings=[],
					handler=function(request,a, promise){
						schema[request.className]
							.sync(request,a.objectId)
							.then(function(newObject){
								websql.run('delete from pending where id=?',[a.id])
								if(request.route=='classes' && request.method=='POST')
									pended[a.objectId]=newObject.objectId
								console.debug('synced '+request.method+' to '+request.className)
								offline.trigger('syncedOne',a,newObject)
								promise.resolve()
							},function(e){promise.reject(e)})
					}
				for(var i=0,len=query.rows.length;i<len;i++){
					if(stoppedSync){
						promise.resolve()
						return
					}
					var a=query.rows.item(i), 
						promise=new Promise(),
						request=a.request=JSON.parse(a.request)
					pendings.push(promise)
					offline.trigger('syncingOne',a)
					switch(request.route){
					case 'classes':
						handler(request,a,promise)
					}
				}
				var finished=Promise.when(pendings)
				finished.then(function(){localStorage['needSync']=false})
				return finished
			})
		},
		pendings:function(){
			var promise=new Promise()
			this.websql.run('select * from pending')
				.then(function(tx,rs){
					var o=[];
					for(var i=0,len=rs.rows.length,a;i<len;i++){
						o.push(a=rs.rows.item(i))
						a.request=JSON.parse(a.request)
					}
					promise.resolve(o)
				})
			return promise
		},
		init:function(myschema,name, size){
			var ready=[]
			this.websql=websql=openDatabase(name||dbName, '', '', size||(7 * 1024 * 1024))
			extendWebsql()
			schema=(myschema||_schema)(DataType,_request)
			return this.changeVersion10()
		},
		changeVersion10:function(){
			switch(websql.version){
			case '':
				var promises=[]
				_.each(schema,function(table){
					promises.push(new Promise)
					_.each(table.indexes,function(){promises.push(new Promise)})
				})
				promises.push(new Promise)
				
				websql.changeVersion('','1.0',function(tx){
					var i=promises.length-1
					_.each(schema,function(table,tableName){
						var sql=['create table if not exists',tableName,'('], fields=[]
						_.each(table.fields,function(data,field){
							fields.push(field+" "+data.type)
						})
						
						fields.push('primary key(objectId)')
						sql.push(fields.join(','))
						sql.push(')')
						websql.run(sql.join(' '),null,tx)
						var v1=promises[i--]
						promises.push(v1)
						websql.run('create index '+tableName+'_updatedAt on '+tableName+'(updatedAt desc)',null,tx)
							.then(function(){v1.resolve()},function(e){v1.reject(e.message)})
						
						_.each(table.indexes,function(desc,field){
							var v1=promises[i--]
							promises.push(v1)
							websql.run('create index '+tableName+'_'+field+' on '+tableName+'('+field+(desc?' desc':'')+')',null,tx)
								.then(function(){v1.resolve()},function(e){v1.reject(e.message)})
						})
					})
					var v1=promises[i]
					promises.push(v1)
					websql.run('create table if not exists pending(id integer primary key autoincrement,\
						tablename text, objectId text, createdAt integer, request text, title text)',null,tx)
						.then(function(){v1.resolve()},function(e){v1.reject(e.message)})
				});
				return Promise.when(promises);
			case '1.0':
				return Promise.as()
			}
		},
		clear: function(myschema,name){
			var db=openDatabase(name||dbName, '', '', 1),
				schema=(myschema||_schema)(DataType,_request)
			switch(db.version){
			case '1.0':
				var promises=[new Promise]
				_.each(schema,function(){promises.push(new Promise)})
				db.changeVersion('1.0','',function(tx){
					var i=promises.length-1
					_.each(schema,function(table,name){
						var p=promises[i--]
						tx.executeSql('drop table '+name,null,function(){
							p.resolve()
						},function(tx,e){
							if(e.message.indexOf('no such table')!=-1)
								p.resolve()
							else
								p.reject(e.message)
						})
					})
					var p=promises[i]
					tx.executeSql('drop table pending',null,function(){
						p.resolve()
					},function(tx,e){
						if(e.message.indexOf('no such table')!=-1)
							p.resolve()
						else
							p.reject(e.message)
					})
				})
				return Promise.when(promises)
			case '':
				return Promise.as()
			}
		}
	},Parse.Events);
	
	return Parse.offline=offline
})