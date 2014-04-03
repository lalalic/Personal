define(function(){
	return function(TYPE,parseRequest, uploader){
		var TEXT=TYPE.TEXT,INT=TYPE.INT,
			DATE=TYPE.DATE,FILE=TYPE.FILE,
			ARRAY=TYPE.ARRAY,TABLE=TYPE.TABLE
		var MINE=function(o){return o.author==Parse.User.current().id && o}
		return{
			tag:TABLE.extend({
				fields:{category:TEXT,name:TEXT,posts:INT,time:INT}
			}),
			User:TABLE.extend({
				fields:{username:TEXT,comments:INT,post:INT,score:INT},
				cachable:function(o){return o.objectId==Parse.user().id && o}
			}),
			child:TABLE.extend({
				fields:{birthday:TEXT,gender:INT,name:TEXT,photo:FILE,author:TEXT,authorName:TEXT},
				cachable:MINE,
				sync:function(request,pendingId){
					var data=request.data,
						photo=data.photo,
						promise=new Promise,
						submitRequest=function(){
							var p=parseRequest(request);
							switch(request.method){
							case 'POST':
								p.then(function(newChild){
									var websql=Parse.offline.websql
									websql.run('update child set objectId=?, photo=? where objectId=?',
										[newChild.objectId,photo&&photo.url||null,pendingId])
									websql.run('update task set child=? where child=?',[newChild.objectId,pendingId])
									promise.resolve(newChild)
								});
								break
							default:
								promise.resolve()
							}
							return p
						}
					if(uploader.isLocalImage(photo)){
						uploader.upload(photo)
						.then(function(newFile){
							photo.url=newFile.url
							photo.name=newFile.name
							submitRequest()
						},function(error){promise.reject(error)})
					}else
						submitRequest()
					return promise
				}
			}),
			post:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,category:TEXT,title:TEXT,content:TEXT,comments:INT,duration:INT,tags:ARRAY,thumbnail:FILE},
				trim:function(){
				/*
					var websql=Parse.offline.websql
					websql.run('select objectId from post where objectId not in (select distinct post from task) and objectId not (select post from favorite) order by updatedAt desc')
						.then(function(tx,results){
							if(results.rows.length<50)
								return;
							var deleting=[]
							for(var i=results.rows.length-1; i>50; i--)
								deleting.push("'"+results.rows.item(i).objectId+"'")
							websql.run('delete from post where objectId in ('+deleting.join(',')+')',null,tx)
							websql.run('delete from story where post in ('+deleting.join(',')+')',null,tx)
							websql.run('delete from comments where post in ('+deleting.join(',')+')',null,tx)
						})*/
				},
				sync:function(request,pendingId){
					var data=request.data,
						content=data.content,
						resultPromise=new Promise(),
						promises=[]
					var splitted=content.splitByImageData()
						
					for(var i=1,len=splitted.length;i<len;i+2){
						promises.push(
							uploader.upload(splitted[i])
							.then(function(newFile){
								splitted[i]='<img src="'+newFile.url+'">'
							}));
					}
					Promise.when(promises)
						.then(function(){
							data.content=splitted.join('')
							var promise=parseRequest(request);
							switch(request.method){
							case 'POST':
								promise.then(function(newPost){
									var websql=Parse.offline.websql
									websql.run('update post set objectId=? where objectId=?',[newPost.objectId,pendingId])
									websql.run('update favorite set post=? where post=?',[newPost.objectId,pendingId])
									websql.run('update task set post=? where post=?',[newPost.objectId,pendingId])
									websql.run('update story set post=? where post=?',[newPost.objectId,pendingId])
									resultPromise.resolve(newPost)
								});
								break
							default:
								resultPromise.resolve()
							}
						})
					return resultPromise
				}
			}),
			story:TABLE.extend({
				fields:{post:TEXT,author:TEXT,authorName:TEXT,category:TEXT,title:TEXT,content:TEXT,comments:INT,duration:INT,tags:ARRAY,thumbnail:TEXT},
				indexes:{post:1},
				sync:function(request){
					this.syncID(request,['post'])
					return parseRequest(request)
				}
			}),
			task:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,post:TEXT,title:TEXT,planAt:DATE,status:INT,time:INT,type:INT,child:TEXT},
				indexes:{post:1,child:1},
				cachable:MINE,
				sync:function(request){
					this.syncID(request,['child','post'])
					return parseRequest(request)
				}
			}),
			favorite:TABLE.extend({
				fields:{post:TEXT,title:TEXT,status:INT,author:TEXT,authorName:TEXT},
				indexes:{post:1},
				cachable:MINE,
				sync:function(request){
					this.syncID(request,['post'])
					return parseRequest(request)
				}
			}),
			comment:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,post:TEXT,content:TEXT},
				indexes:{post:1},
				sync:function(request){
					this.syncID(request,['post'])
					return parseRequest(request)
				}
			})
		}
	}
})