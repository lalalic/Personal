window.$=$$
window.__={}//runtime information
empty=new Function()
article=function(){return Lungo.Element.Cache.article[0]}
form=function(){return $(article(),'form')[0]}
HTMLSelectElement.prototype.text=function(){return this.options[this.selectedIndex].text}
HTMLFormElement.prototype.object=function(o){
	o=this._object||(typeof(o)=='string'?Parse.object(o):o),
	$(this,':not([type=checkbox]):not([type=radio]):not(select):not([name=id])[name],[type=radio][name]:checked').each(function(i,el){o.set(el.name,el.value)})
	$(this,'select[name]').each(function(i,el){o[el.hasAttribute('multiple') ? 'addUnique':'set'](el.name,el.options[el.selectedIndex].value)})
	$(this,'[type=checkbox][name]:checked').each(function(i,el){o.addUnique(el.name,el.value)})
	for(var i=1,as=arguments,len=as.length;i<as.length;i+=2)
		o.set(as[i],as[i+1])
	return o
}
HTMLFormElement.prototype.set=function(o){
	this._object=o
	if(o==undefined){
		this.reset()
		return
	}
	$(this,':not([type=checkbox]):not([type=radio]):not(select):not([name=id])[name]').each(function(i,el){el.value=o.get(el.name)})
	$(this,'select[name]').each(function(i,el){o.has(el.name)&&$(el.options).each(function(i,op){op.value==o.get(el.name) && (el.selectedIndex=i)})})
	$(this,'[type=radio][name]').each(function(i,el){el.checked=el.value==o.get(el.name)})
	$(this,'[type=checkbox][name]').each(function(i,el,v){el.checked=(v=o.get(el.name))&&v.indexOf&&v.indexOf(el.value)!=-1})
	$(this,'[name=id]').each(function(i,el){el.value=o.id})
}
Date.fromTime=function(t){var a=new Date();a.setTime(t);return a}

function inherit(o,ex){
	if(ex){
		for(var i in ex)
			ex.hasOwnProperty(i)&&(o[i]=ex[i])
	}
	return o
}

$.fn.once=function(e,cb,a,b){a=this,b=function(){cb.apply(this,arguments);a.unbind(e,b)};a.bind(e,b)}

setTitle=function(t){$(Lungo.Element.Cache.section,'header h1').text(t)}
doing=function(){$('section.show [data-icon="refresh"]').addClass('doing')}
done=function(){$('.doing').removeClass('doing')}

function checkLogin(){
	if(!Parse.user())
		return setTimeout(function(){Lungo.Router.section('user')},1000)
	Parse.find('child','author',Parse.user().id,function(o){
			o && tmplChildren.build({loop:o}) && !__.currentChild && (__.currentChild=o[0])
		})
}
function savePost(p,newPost){
	doing()
	var dura=p.querySelector(':checked[name=duration]'),
		thumb=postEditor.getThumbnail()
	newPost=p.object('post',"category",__.cat.name,
		"duration", parseInt(dura.nextSibling.innerHTML),
		'content',postEditor.getContent())
	thumb && newPost.set('thumbnail',thumb)
	newPost.addUnique("tags", dura.value)
	newPost.addUnique("tags",__.cat.id)
	newPost.save().then(function(){p.reset();Lungo.Router.back();done()},Parse.error)
}

function _favorite(f){
	Parse.first('favorite','author',Parse.user().id,'post',__.post.id,f)
}
function _task(f){
	Parse.first('task','author',Parse.user().id,'post',__.post.id,'status',1,f)
}
function showPost(p){
	setTitle(p.get('title'))
	p._tags=[]
	var tags=p.get('tags')
	tags && $.each(tags, function(i,tag){
		//p._tags.push(window.tags[tag])
	})
	
	tmplPost.clean().build(__.post=p)
	_task(function(t,b){
		$(cmdtask)[((b=t&&t.get('status'))?'add':'remove')+'Class']('tasked')
		b&&($('#taskOption [value="'+t.get('type')+'"]')[0].checked=true)
	})
	_favorite(function(t){
		$(cmdfavorite)[(t&&t.get('status')?'add':'remove')+'Class']('favorited')
	})
	Parse.find('story','post',p.id,tmplStory)
}

function popup(el,e){
	$(el).show()
	e.stopPropagation()
	$(document).once('click',function(){$(el).hide()})
}

function toggleFavorite(){
	_favorite(function(f,a){
		(f=f||Parse.object('favorite','post',(a=__.post).id,'title',a.get('title'),'thumbnail',a.get('thumbnail')))
			.set('status',f.get('status')?0:1)
		f.save().then(function(){$(cmdfavorite)[(f.get('status')?'add':'remove')+'Class']('favorited');done()},Parse.error)
	})
}			
function addTask(e,v){
	e.checked && _task(function(t,a){
		(t=t||Parse.object('task','post',(a=__.post).id,'title',a.get('title'),'thumbnail',a.get('thumbnail'),'status',1))
			.set('type',v)
		t.save().then(function(){$(cmdtask).addClass('tasked');done()},Parse.error)
	})				
}

;(function(Parse){//extend Parse functions
	Parse.initialize("CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL","RwqvvbakVmWPhtO78QCUppfnclzfZ2SyUZ198ArG")
	Parse.object=function(f){
		var a=new Parse.Object(f);
		for(var i=1,as=arguments,len=as.length;i<as.length;i+=2)
			as[i]=='id'?(a.id=as[i+1]):a.set(as[i],as[i+1])
		return a
	}

	$.each(['find','first'],function(index,n){
		Parse[n]=function(a){
			doing()
			var f=new Parse.Query(Parse.Object.extend(a)).ascending('createdAt'),h,t,
				as=arguments,len=as.length
			if(len==1) 
				return f[n]()
			if(typeof(t=h=as[len-1])=='function')
				len--
			else if('SCRIPT'==h.nodeName){
				h.clean()
				h=function(o){t.build({loop:o});done()}
				len--
			}else
				h=null
			for(var i=1;i<len;i+=2)
				f.equalTo(arguments[i],arguments[i+1])
			f=f[n]()
			return h&&f.then(h,Parse.error)||f
		}
	})
	Parse.get=function(t,id){doing();return new Parse.Query(Parse.Object.extend(t)).get(id)}
	Parse.error=function(e){done();Lungo.Notification.error("Warn", e.message, 'cancel', 2)}
	Parse.user=function(){return Parse.User.current()}
	Parse.Object.prototype.ago=function(){
		var delta=parseInt((new Date().getTime()-this.createdAt.getTime())/1000),
			aday=24*60*60
		if(delta<aday){
			if(delta<60)
				return delta+'秒前'
			else if(delta<60*60)
				return parseInt(delta/60)+'分前'
			else
				return parseInt(delta/60/60)+"小时前"
		}else if (delta<aday*2)
			return '昨天'
		else if (delta<aday*3)
			return '前天'
		else
			return this.createdAt.getMonth()+1+"-"+this.createdAt.getDay()+1;
			
	}
})(Parse);

;(function(x){//extend Parse.offline to support offline
	;(function(){
		var _file=x.File.prototype.url
		x.File.prototype.url=function(){
			var _url=_file.apply(this,arguments)
			if(_url.indexOf('pending://')==0){
				x.offline.websql.run('select request from pending where rowid=?',[parseInt(_url.substr(10))])
			}
		}
	})();
	x.offline={//interface
		debug:false,
		classes:{
			GET:function(o){
				var sql=["select * from "+o.className], 
					where=[],values=[]
				for(var i in o.data.where){
					where.push(i+"=?")
					values.push(o.data.where[i])
				}
				
				where.length && sql.push(' where ' + where.join(' and '));
				if('order' in o.data)
					sql.push(' order by '+o.data.order)
				if('limit' in o.data)
					sql.push(' limit '+o.data.limit)
				sql=sql.join(' ')
				
				return x.offline.websql.run(sql,values,null,o)
					.then(function(tx,results, o){
							var data=[],
								schema=x.offline.schema[o.className].sample,
								promise = new Parse.Promise();
							for(var i=0,len=results.rows.length;i<len;i++){
								var ob={}, a=results.rows.item(i)
								for(var field in a)
									ob[field]=schema[field].toJSON(a[field])
								data.push(ob)
								delete ob.cachedAt
							}
							promise.resolve({results:data})
							return promise
						})
			},
			PUT: function(o){
				return x.offline.websql.pending([o.className,o.objectId,Date.now(),JSON.stringify(o)],null,o)
					.then(function(tx,results,o){
						var promise=new Parse.Promise(),
							sample=x.offline.schema[o.className].sample,
							fields=[],values=[],now=Date.now()
						for(var i in o.data){
							fields.push(i+'=?')
							values.push(sample[i].toDB(o.data[i]))
						}
						fields.push('updatedAt=?')
						values.push(now)
						values.push(o.objectId)
						x.offline.websql.run('update '+o.className+' set '+fields.join(',')+' where objectId=?',values)
						promise.resolve({updatedAt:Date.fromTime(now).toJSON()})
						return promise
					})
			},
			POST: function(o){
				return x.offline.websql.pending([o.className,null,Date.now(),JSON.stringify(o)],null,o)
					.then(function(tx,results,o){
						var promise=new Parse.Promise(),now=Date.now(),
							sample=x.offline.schema[o.className].sample,
							fields=[],values=[],marks=[], ob={}
						for(var i in o.data){
							marks.push('?')
							fields.push(i)
							values.push(sample[i].toDB(ob[i]=o.data[i]))
						}
						fields.push('createdAt')
						fields.push('updatedAt')
						values.push(now)
						values.push(now)
						fields.push('objectId')
						values.push(ob['objectId']=('pending'+now))
						ob.createdAt=ob.updatedAt=Date.fromTime(now).toJSON()
						x.offline.websql.run('insert into '+o.className+'('+fields.join(',')+')values('+marks.join(',')+')',values)
						promise.resolve(ob)
						return promise
					})
			}
		}, 
		files:{
			POST: function(o){
				return x.offline.websql.pending(['_file',null,Date.now(),JSON.stringify(o)],o)
						.then(function(tx,query,o){
							var promise=new Parse.promise()
							promise.resolve({name:o.data.name,url:"pending://"+query.insertId})
							return promise
						})
			}
		},
		users:{
		} 
	}
	
	x.offline.update2server=function(){
		if($.isOnline()){
			this.websql.run('select * from pending')
				.then(function(tx,query){
					for(var i=0,len=query.rows.length;i<len;i++)
						_request(JSON.parse(query.rows.item[i].request))
					x.offline.websql.run('delete from pending')
				})
		}
	}
	
	;(function(storage){//schema
		var _t={},_i={},_date={},_array=[_t], _file={}
			h=function(v){return v==undefined?null:v}
		_t.toDB=_t.toJSON=_i.toDB=_i.toJSON=h
		_file.type=_array.type=_t.type='text'
		_date.type=_i.type='integer'
		_date.toDB=function(v){return (v=h(v))?Parse._parseDate(v).getTime():v}
		_date.toJSON=function(v){return (v=h(v))?Date.fromTime(v):v}
		_file.toDB=function(v){return (v=h(v))?v.url:v}
		_file.toJSON=function(v){return (v=h(v))?{__type: "File",url:v,name:v.substr(v.lastIndexOf('/')+1)}:v}
		_array.toDB=function(v){
			if((v=h(v))){
				var me=this[0],vs=[]
				v.forEach(function(o){var a=me.toDB(o);a&&vs.push(a)})
				return vs.join(',')
			}
			return v
		}
		_array.toJSON=function(v){//v is a,b,c
			if((v=h(v))){
				var me=this[0],vs=[]
				v.split(',').forEach(function(o){
					switch(me){
					case _t:
						return vs.push(o)
					case _i:
						return vs.push(parseInt(o))
					case _date:
						return vs.push(Date.fromTime(parseInt(o)))
					case _file:
						return vs.push(_file.toJSON(o))
					}
				})
				return vs
			}
			return v
		}

		storage.schema={
			tag:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,category:_t,name:_t,posts:_i,time:_i},
				cachable:function(o){return o},
				trim:function(){}
			},
			User:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,username:_t,comments:_i,post:_i,score:_i},
				cachable:function(o){return o.objectId==Parse.user().id && o},
				trim:function(){}
			},
			child:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,birthday:_t,gender:_i,name:_t,photo:_file,author:_t,authorName:_t},
				cachable:function(o){return o.author==Parse.user().id && o},
				trim:function(){}
			},
			post:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,author:_t,authorName:_t,category:_t,title:_t,content:_t,comments:_i,duration:_i,tags:_array,thumbnail:_file},
				cachable:function(o){return o},
				trim:function(){
					storage.run('select objectId from post where objectId not in (select distinct post from task) and objectId not (select post from favorite) order by updatedAt desc',null,function(tx,results){
						if(results.length<50)
							return;
						var deleting=[]
						for(var i=results.length-1; i>50; i--)
							deleting.push("'"+results[i].objectId+"'")
						storage.run('delete from post where objectId in ('+deleting.join(',')+')')
						storage.run('delete from story where post in ('+deleting.join(',')+')')
						storage.run('delete from comments where post in ('+deleting.join(',')+')')
					})
				}
			},
			story:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,post:_t,author:_t,authorName:_t,category:_t,title:_t,content:_t,comments:_i,duration:_i,tags:_array,thumbnail:_t},
				indexes:{post:1},
				cachable:function(o){return o},
				trim:function(){}
			},
			task:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,author:_t,authorName:_t,post:_t,title:_t,planAt:_date,status:_i,time:_i,type:_i},
				indexes:{post:1},
				cachable:function(o){return o.author==Parse.user().id && o},
				trim:function(){}
			},
			favorite:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,post:_t,title:_t,status:_i,author:_t,authorName:_t},
				indexes:{post:1},
				cachable:function(o){return o.author==Parse.user().id && o},
				trim:function(){}
			},
			comments:{
				sample:{cachedAt:_date,objectId:_t,createdAt:_date,updatedAt:_date,author:_t,authorName:_t,post:_t,content:_t},
				indexes:{post:1},
				cachable: function(o){return o},
				trim:function(){}
			}
		}
	
	})(x.offline);
	
	;(function(storage){//websql storage implementation
		storage.websql=openDatabase('parse.supernaiba.1', '1.0', 'supernaiba database', 100 * 1024 * 1024,function(db){
			db.transaction(function(tx){
				for(var table in storage.schema){
					var sql=['create table if not exists',table,'('],
						fields=[],
						schema=storage.schema[table]
					for(var field in  schema.sample)
						fields.push(field+" "+schema.sample[field].type)
					fields.push('primary key(objectId)')
					sql.push(fields.join(','))
					sql.push(')')
					storage.websql.run(sql.join(' '),null,tx)
					storage.websql.run('create index '+table+'_updatedAt on '+table+'(updatedAt desc)')
					if('indexes' in schema){
						for(var field in schema.indexes)
							storage.websql.run('create index '+table+'_'+field+' on '+table+'('+field+(schema.indexes[field]?' desc':'')+')')
					}
				}
				storage.websql.run('create table if not exists pending(tablename text, objectId text, createdAt integer, request text)')
			})
		});
		storage.websql.run=function(sql,values,tx, data){
			var promise = new Parse.Promise(),
				h=function(tx){
					tx.executeSql(sql,values,function(tx,results){
							console.debug(sql)
							promise.resolve(tx,results, data)
						},function(tx,error){
							console.error(sql+"\n"+error.message)
							promise.reject(error)
						})
				};
			tx ? h(tx) : this.transaction(h)
			return promise
		};
		storage.websql.pending=function(values,data){
			return this.run('insert into pending(tablename,objectId,createdAt,request)values(?,?,?,?)',values,null,data)
		}
		storage.websql.cache=function(table,results){
			var schema=Parse.offline.schema[table],
				sql=["replace into "+table+"("],
				fields=[],values=[]			
			for(var i in schema.sample){
				fields.push(i)
				values.push('?')
			}
			sql.push(fields.join(','))
			sql.push(')values('+values.join(',')+')')
			sql=sql.join(' ')
			var objects=[], cachedAt=new Date().toJSON()
			results.forEach(function(o){
				if((o=schema.cachable(o))){
					o.cachedAt=cachedAt
					var values=[]
					fields.forEach(function(field){values.push(schema.sample[field].toDB(o[field]))})
					objects.push(values)
				}
			})			
			this.transaction(function(tx){
				objects.forEach(function(o){
					storage.websql.run(sql,o,tx)
				})
			})
		};
	})(x.offline);
		
	var _request=x._request
	x._request=function(o){
		if(!x.offline.debug && $.isOnline()){
			return _request.apply(null,arguments)
				.then(function(response){
					if(o.route=='classes'){
						switch(o.method){
						case 'GET':
							x.offline.websql.cache(o.className,response.results)
							break
						case 'PUT'://update
							var fields=[],values=[],sample=x.offline.schema[o.className].sample
							for(var i in o.data){
								fields.push(i+'=?')
								values.push(o.data[i])
							}
							fields.push('updatedAt=?')
							values.push(Parse._parseDate(response.updateAt).getTime())
							values.push(o.objectId)
							x.offline.websql.run('update '+o.className+' set '+fields.join(',')+' where objectId=?',values)
							break
						case 'DELETE'://delete
							x.offline.websql.run('delete from '+o.className+' where objectId=?',[o.objectId])
							break
						case 'POST'://add
							x.offline.websql.cache(o.className,[response])
							break
						}
					}
					return response
				})
		}
		return x.offline[o.route][o.method](o);
	}
})(Parse);

;(function(){//extend string for image resizer, need _imgSizer canvas element
	String.prototype.toImageDataURL=function(size){
		var tool=_imgSizer,
			ctx=tool.getContext('2d'),
			img=new Image();
		img.src=this;
		var wh=img.width/img.height;
		tool.width = wh>=1 ? (size<img.width ? size : img.width) : (size<img.height ? Math.floor(size*wh) : img.width);
		tool.height = wh<1 ? (size<img.height ? size : img.height) : (size<img.width ? Math.floor(size/wh) : img.height);
		tool.style.width=tool.width+"px"
		tool.style.height=tool.height+"px"
		ctx.drawImage(img,0,0,img.width,img.height,0,0,tool.width, tool.height);
		return tool.toDataURL("image/jpeg")
	}
	String.prototype.IMAGE_DATA_INDEX="data:image/png;base64,".length+1
	String.prototype.toImageData=function(size){
		return this.toImageDataURL(size).substr(this.IMAGE_DATA_INDEX)
	}
})();

;(function(){//editor
	if(!HTMLImageElement.prototype.isData)
		HTMLImageElement.prototype.isData=function(){
			return this.src.substr(0,4)=='data'
		}
		
	if(!HTMLImageElement.prototype.isDataJpeg)
		HTMLImageElement.prototype.isDataJpeg=function(){
			return this.src.substr(0,15)=='data:image/jpeg'
		}
		
	this.Editor=function(el){
		if(el['insertImage'])
			return;
		var savedRange,isInFocus=false;
		function saveSelection(){
			savedRange=getSelection ? getSelection().getRangeAt(0) : document.selection.createRange()
		}

		function restoreSelection(){
			isInFocus = true;
			if (savedRange != null) {
				if (window.getSelection){//non IE and there is already a selection
					var s = window.getSelection();
					if (s.rangeCount > 0) 
						s.removeAllRanges();
					s.addRange(savedRange);
				} else if (document.selection)//IE
					savedRange.select();
			}
		}
		
		function cancelEvent(e){
			if (isInFocus == false && savedRange != null) {
				if (e && e.preventDefault) {
					e.stopPropagation(); // DOM style (return false doesn't always work in FF)
					e.preventDefault();
				}else 
					window.event.cancelBubble = true;//IE stopPropagation
				restoreSelection();
				return false; // false = IE style
			}
		}
		
		el.addEventListener('blur',function(){isInFocus=false})
		el.addEventListener('mouseup',saveSelection)
		el.addEventListener('keyup',saveSelection)
		el.addEventListener('focus',restoreSelection)
		el.addEventListener('paste',function(e){
			document.execCommand('insertText',false,e.clipboardData.getData('text/plain').replace(/\r/g,''))
			e.preventDefault()
			return false
		})
		
		el.insertImage=function(f,reader){
			uploader.bind(el,{
					success:function(f){
							f._img.src=f.url()
							done()
						},
					error:Parse.error,
					size:1024,
					onSave: function(f,data){
							el.focus()
							restoreSelection();
							document.execCommand("insertHTML", false, "<br><img id='_editorImg'><br>");
							(f._img=_editorImg).src=data
							_editorImg.removeAttribute('id')
							saveSelection();
						}
				}).click()
		}
		
		el.getThumb=function(){
			if(el['thumb'])
				return el.thumb;
			var thumb=this.querySelector('img');
			if(!thumb || !thumb.isData())
				return null;
			return new Parse.File('thumb',thumb.src.toImageData(96));
		}

		el.getContent=function(imageSaver){
			return this.innerHTML.replace(Editor.TRIM_TAG,"\n").replace(Editor.TRIM_LINE,'\n\n');
		}
		return el
	}
	Editor.TRIM_TAG=/<\/?\s*(\w*?)\s*\/?>/g
	Editor.TRIM_LINE=/\n{3,}/gm
})(this);

function init(){
	$("script[type*=tmpl]").each(function(i,tmpl,b,e){
		this.target=$(this).data('target')||this.parentNode
		this.compiled=Mustache.compile((b=this.innerHTML))
		Mustache.compilePartial(this.id,b)
		this.innerHTML=""
		this.build=function(a,container){
			var el=$($.fragment(this.compiled(a))
				.map(function(el,i,old){
						if(el.nodeType!=3){
							if(el.id && (old=$('#'+el.id)).length){
								(old=old[0]).parentNode.replaceChild(el,old)
								$(el).addClass('tmpled')
								return null;
							}
							return el;
						}
					}))
				.addClass('tmpled')
			$(container||this.target||this.parentNode).append(el)
			Lungo.Boot.Data.init(el)
		}
		this.clean=function(container){
			$(container||this.target||this.parentNode,'.tmpled').remove()
			return this
		}
	})
	
	$("a[data-icon='refresh']").each(function(i,a){
		$(a).bind('click',function(){$(article()).trigger('load')})
	})
	
	$.each(["load","unload"],function(index,e){//support data-on-(un)load	
		$("[data-on-"+e+"]").each(function(i,el){
			(el=$(this)).bind(e, new Function('e,a,b,c',el.data('on-'+e)))
		})
	})
	
	Lungo.init({
		name:"SNB",
		history:false
	})
	
	
	checkLogin()
	
	uploader.bind=function(a,opt){
		this.opt=inherit({
				success: function(f){
					a && 'IMG'==a.nodeName && (a.src=(a.file=a.value=f).url())
					done()
				},
				error:Parse.error,
				size:1024
			},opt)
		return this			
	}
	
	uploader.save=function(){
		doing()
		var me=this,
			reader=new FileReader(), 
			i=0,len=this.files.length
		reader.onload=function(e){
			var f=new Parse.File("a.jpg",{base64:e.target.result.toImageData(me.opt.size)})
			me.opt['onSave'] && me.opt.onSave.call(me,f, e.target.result)
			f.save(me.opt)
			i<len && reader.readAsDataURL(me.files[i++])
		}
		reader.readAsDataURL(this.files[i++])
	}
}