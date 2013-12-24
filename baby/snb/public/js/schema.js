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
				cachable:MINE,
			}),
			child:TABLE.extend({
				fields:{birthday:TEXT,gender:INT,name:TEXT,photo:FILE,author:TEXT,authorName:TEXT},
				foreigns:['author'],
				refered:{story:'child',task:'child'},
				cachable:MINE,
				sync:function(request,pendingId){
					var data=request.data,photo=data.photo
					if(!uploader.isLocalImage(photo))
						return TABLE.sync(request,pendingId)
						
					return uploader.upload(photo)
						.then(function(newFile){
							photo.url=newFile.url
							photo.name=newFile.name
							TABLE.syncField(request,'photo')
							return TABLE.sync(request,pendingId)
						})
				}
			}),
			post:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,category:TEXT,title:TEXT,content:TEXT,comments:INT,duration:INT,tags:ARRAY,thumbnail:FILE},
				foreigns:['author'],
				refered:{favorite:'post',task:'post',story:'post',comment:'post'},
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
					return TABLE.syncLocalImages(request,'content')
						.then(function(){
							return TABLE.sync(request,pendingId)
						})
				}
			}),
			story:TABLE.extend({
				fields:{post:TEXT,author:TEXT,authorName:TEXT,child:TEXT, childName:TEXT, content:TEXT,comments:INT,thumbnail:TEXT},
				indexes:{post:1},
				foreigns:['author','post','child'],
				sync: function(){
					return TABLE.syncLocalImages(request,'content')
						.then(function(){
							return TABLE.sync(request,pendingId)
						})
				}
			}),
			task:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,post:TEXT,title:TEXT,planAt:DATE,status:INT,time:INT,type:INT,child:TEXT},
				indexes:{post:1,child:1},
				cachable:MINE,
				foreigns:['author','post','child']
			}),
			favorite:TABLE.extend({
				fields:{post:TEXT,title:TEXT,status:INT,author:TEXT,authorName:TEXT},
				indexes:{post:1},
				cachable:MINE,
				foreigns:['author','post']
			}),
			comment:TABLE.extend({
				fields:{author:TEXT,authorName:TEXT,post:TEXT,content:TEXT},
				indexes:{post:1},
				foreigns:['author','post']
			})
		}
	}
})