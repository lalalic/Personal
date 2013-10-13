window.$=$$
window.__={}
empty=new Function()
article=function(){return Lungo.Element.Cache.article[0]}
form=function(){return $(article(),'form')[0]}
Parse.initialize("CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL","RwqvvbakVmWPhtO78QCUppfnclzfZ2SyUZ198ArG")
HTMLSelectElement.prototype.text=function(){return this.options[this.selectedIndex].text}
HTMLFormElement.prototype.object=function(o){
	o=this._object||(typeof(o)=='string'?Parse.object(o):o),
	$(this,':not([type=checkbox]):not([type=radio]):not(select):not([name=id])[name],[type=radio][name]:checked').each(function(i,el){o.set(el.name,el.value)})
	$(this,'select[name]').each(function(i,el){o.set(el.name,el.options[el.selectedIndex].value)})
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
function inherit(o,ex){
	if(ex){
		for(var i in ex)
			ex.hasOwnProperty(i)&&(o[i]=ex[i])
	}
	return o
}

$.fn.once=function(e,cb,a,b){a=this,b=function(){cb.apply(this,arguments);a.unbind(e,b)};a.bind(e,b)}
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
setTitle=function(t){$(Lungo.Element.Cache.section,'header h1').text(t)}
doing=function(){$('section.show [data-icon="refresh"]').addClass('doing')}
done=function(){$('.doing').removeClass('doing')}
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
function checkLogin(){
	if(!Parse.user())
		return setTimeout(function(){Lungo.Router.section('user')},1000)
	Parse.find('child','author',Parse.user().id,function(o){
			o && tmplChildren.build({loop:o}) && !__.currentChild && (__.currentChild=o[0])
		})
}
function savePost(p,newPost){
	doing()
	newPost=p.object('post',"category",__.cat.name,"duration", parseInt(p.duration.text()),'content',postEditor.getContent())
	newPost.addUnique("tags", p.duration.value)
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


//editor
(function(){
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
			var thumb=this.querySelector('img');
			if(!thumb || !thumb.isData())
				return null;
			return thumb.src.toImageData(96);
		}

		el.getContent=function(imageSaver){
			return this.innerHTML.replace(Editor.TRIM_TAG,"\n").replace(Editor.TRIM_LINE,'\n\n');
		}
		return el
	}
	Editor.TRIM_TAG=/<\/?\s*(\w*?)\s*\/?>/g
	Editor.TRIM_LINE=/\n{3,}/gm
})(this)

debugi=0