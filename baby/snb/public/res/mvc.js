(function(_,$){
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
		String.prototype.IMAGE_DATA_SCHEME="data:image/jpeg;base64,"
		String.prototype.toImageData=function(size){
			return this.substr.call(size?this.toImageDataURL(size):this,this.IMAGE_DATA_SCHEME.length)
		}
		String.prototype.isImageData=function(){return this.substr(0,this.IMAGE_DATA_SCHEME.length)==this.IMAGE_DATA_SCHEME}
		String.prototype.IMAGE_DATA_PATTERN=new RegExp('<img\s+src="data:image/jpeg;base64,(.*?)"\s*>', "gim")
		String.prototype.splitByImageData=function(){return this.split(this.IMAGE_DATA_PATTERN)}
	})();
	
	Parse.initialize("CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL","RwqvvbakVmWPhtO78QCUppfnclzfZ2SyUZ198ArG")
	_.templateSettings = {
		evaluate    : /<%([\s\S]+?)%>/g,
		interpolate : /\{\{([\s\S]+?)\}\}/g,
		escape      : /\{\{\{([\s\S]+?)\}\}\}/g
	  };
	
	Parse.Object.prototype.getUrl=function(a){return this.has(a)?this.get(a).url():null}
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
	var Tag=Parse.Object.extend('tag'),
		Child=Parse.Object.extend('child'),
		Comment=Parse.Object.extend('comment'),
		Favorite=Parse.Object.extend('favorite'),
		Post=Parse.Object.extend('post'),
		Story=Parse.Object.extend('story'),
		Task=Parse.Object.extend('task')
	
	Post.prototype.getTags=function(){
		return "tag here"
	}
		
	var Page=Parse.View.extend({
			clazz:'Page',
			tagName:'section',
			className:'show',
			title:'Default Page',
			navs:'<a class="on-left" onclick="history.go(-1)"><span class="icon left-sign"></span></a><a class="on-right"><span class="icon refresh"></span></a>',
			content:'empty content',
			cmds:'No command',
			template:_.template('<header><h1 class="title centered">{{title}}</h1><nav>{{navs}}</nav></header><article class="active scroll">{{content}}</article><footer><nav>{{cmds}}</nav></footer>'),
			events:{'click header .refresh': 'refresh'},
			initialize: function(){
				$(document.body).append(this.$el.html(this.template(this)))
			},
			loading: function(a){
				this.$('span.refresh').parent()[a===false?'removeClass':'addClass']('doing')
			},
			refresh: function(){},
			setTitle:function(t){
				this.$('header h1').html(t)
			}
		}),
		ListPage=Page.extend({
			content:'<ul/>',
			itemTemplate:false,
			initialize: function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$list=this.$('article>ul')
				this.$('article').addClass('list')
				if(_.isString(this.itemTemplate))
					this.itemTemplate=_.template($(this.itemTemplate).html())
				this.collection.on('reset',this.render, this)
				this.refresh()
			},
			render:function(items){
				this.empty()
				items.each(function(a){this.$list.append(this.itemTemplate(a))},this)
				this.loading(false)
			},
			empty: function(){
				this.$list.empty()
				return this
			},
			refresh: function(){
				if(this.collection.query){
					this.loading()
					this.collection.fetch()
				}
			},
			setQuery: function(q){
				this.collection.query=q;
				this.refresh()
			}
		}),
		router=new Parse.Router()
	Page.create=function(cz){
		$('body>section').removeClass('show')
		Page.instances=Page.instances||{}
		var clazz=cz.prototype.clazz
		if(clazz in Page.instances){
			Page.instances[clazz].$el.addClass('show')
			return Page.instances[clazz]
		}else
			return Page.instances[clazz]=new cz
	}
	
	;(function(){//splash screen
		var SplashPage=Page.extend({
			clazz:'SplashPage',
			template: _.template('<article class="active"><a href="#categories">start</a></article>'),
		});
		router.route('','splash',function(){Page.create(SplashPage)})
	})();
	
	;(function(){//categories list
		router.route('categories','categories',function(){return Page.create(CategoriesPage)})
		var CategoriesPage= ListPage.extend({
			clazz:'CategoriesPage',
			title:'SNB',
			cmds:'<a href="#favorites"><span class="icon star"/></a><a href="#tasks"><span class="icon list"/></a>',
			itemTemplate:'#tmplCates',
			collection:new (Parse.Collection.extend({
				model:Tag,
				query: (new Parse.Query(Tag)).equalTo('category','category').ascending('createdAt')
			})),
			initialize: function(){
				ListPage.prototype.initialize.apply(this,arguments)
				this.$('article').addClass('indented')
			}
		})
	})();
		
	;(function(){//posts list
		router.route('category/:name','category',function(name){
			Page.create(PostsPage).empty()
				.setQuery((new Parse.Query(Post)).equalTo('category',name).ascending('createdAt'))
		});
		var PostsPage=ListPage.extend({
			clazz:'PostsPage',
			itemTemplate:'#tmplPosts',
			collection:new (Parse.Collection.extend({model:Post}))
		})
	})();
	;(function(){//favorite
		router.route('favorites','favorites',function(){Page.create(FavoritesPage)})
		var FavoritesPage=ListPage.extend({
			clazz:'FavoritesPage',
			title:'My Favorites',
			itemTemplate:'#tmplPostRef',
			collection: new (Parse.Collection.extend({model:Favorite})),
			initialize: function(){
				this.collection.query=(new Parse.Query(Favorite)).equalTo('author',Parse.User.current().id).ascending('createdAt')
				ListPage.prototype.initialize.apply(this,arguments)
			}
		})
	})();
	
	;(function(){//task
		router.route('tasks','tasks',function(){Page.create(TasksPage)})
		var TasksPage=ListPage.extend({
			clazz:'TasksPage',
			title:'My Tasks',
			itemTemplate:'#tmplPostRef',
			collection: new (Parse.Collection.extend({model:Task})),
			initialize: function(){
				this.collection.query=(new Parse.Query(Task)).equalTo('author',Parse.User.current().id).ascending('createdAt')
				ListPage.prototype.initialize.apply(this,arguments)
			}
		})
	})();

	;(function(){//post
		var
		PostPage=Page.extend({
			clazz:'PostPage',
			setCategory: function(cate){
				this.category=cate
			}
		}),	
		PostShowPage=Page.extend({
			clazz:'PostShowPage',
			cmds:'<a href="#comments"><span class="icon comment"/></a>\
				<a href="#story"><span class="icon file"/></a>\
				<a><span class="icon star"/></a>\
				<a><span class="icon menu"/></a>',
			events:{
				'click span.star':'toggleFavorite',
				'click span.menu':'showTaskOption',
				'click #taskOption input':'addTask'
			},
			model: new Post,
			initialize: function(){
				Page.prototype.initialize.apply(this,arguments)
				this.content=_.template($('#tmplPost').html())
				this.$('article').attr('id','show')
				this.$el.append(taskOption)
			},
			render: function(id){
				this.model.clear()
				this.$('article').empty()
				this.model.id=id
				var me=this
				this.model.fetch()
					.then(function(m){
						me.$('article').append(me.content(m))
					})
			},
			toggleFavorite:function(){
				var me=this
				(new Parse.Query(Favorite))
					.equalTo('author',Parse.User.current().id)
					.equalTo('post',this.model.id)
					.first()
					.then(function(f){
						f=f||new Favorite({post:me.model.id,title:me.model.get('title'),thumbnail:me.model.get('thumbnail')})
						f.set('status',f.get('status')?0:1)
						f.save()
							.then(function(){
								me.$('a span.star')[(f.get('status')?'add':'remove')+'Class']('favorited')
							})
					})
			},
			showTaskOption:function(){
				$(taskOption).show()
			},
			addTask: function(ev){
				var e=ev.srcElement
				if(e.checked){
					(new Parse.Query(Task))
					.equalTo('author',Parse.User.current().id)
					.equalTo('post',this.model.id)
					.equalTo('child',Child.current.id)
					.first()
					.then(function(f){
						f=f||new Task({post:me.model.id,title:me.model.get('title'),thumbnail:me.model.get('thumbnail'),status:1,child:Child.current.id})
						f.set('type',e.value)
						f.save()
							.then(function(){
								me.$('a span.menu').addClass('tasked')
							})
					})
				}
			}
		}),
		StoryPage=PostPage.extend({
			clazz:'StoryPage'
		}),
		CommentsPage=ListPage.extend({
			clazz:'CommentsPage'
		})
		router.route('create/:cate/*','post',function(cate){Page.create(PostPage).setCategory(cate)})
		router.route('show/:id','postshow',function(id){Page.create(PostShowPage).render(id)})
		router.route('update/:id/*','postupdate',function(id){Page.create(PostPage).render(id)})
		router.route('story/create/:id/*','story',function(id){Page.create(StoryPage).render(id)})
		router.route('story/update/:id/*','storyupdate',function(id){Page.create(StoryPage).render(id)})
		router.route('comments/:id/*','comments',function(id){Page.create(CommentsPage).render(id)})
	})();
		
	var ChildrenAside=(function(){//child
		router.route('child','createChild',function(){Page.create(ChildPage).clear()})
		router.route('child/:id/:name', 'updateChild',function(id,name){Page.create(ChildPage).render(id,name)})
		var ChildPage=Page.extend({
			clazz:'ChildPage',
			cmds:'<a><button type="submit" form="childForm"><span class="icon ok-sign"/></button></a>',
			events:{
				'submit form':'save',
				'change form *[name]':'change',
				'click form img':'selectPhoto'
			},
			model: new Child,
			initialize:function(){
				this.content=$('#tmplChild').html()
				Page.prototype.initialize.apply(this,arguments)	
			},
			render:function(id,name){
				this.clear()
				if(id){
					var me=this
					this.model.id=id
					this.model.fetch()
						.then(function(){
							me.populate()
						})
				}
			},
			save: function(){
				this.model.save()
					.then(function(){
						history.go(-1)
					})
				return false
			},
			clear: function(){
				var f=this.$('form').get(0)
				f.reset()
				this.model.clear()
				this.$('form img').get(0).src=""
			},
			populate: function(){
				var f=this.$('form').get(0)
				f.name.value=this.model.get('name')
				f.id.value=this.model.id
				f.birthday.value=this.model.get('birthday')
				if(this.model.has('photo'))
					f.photo.src=this.model.get('photo').url()
				this.$('form select[name=gender]').val([this.model.get('gender')])
			},
			change: function(e){
				var el=e.srcElement
				switch(el.name){
				case 'gender':
					this.model.set('gender',parseInt(el.value))
					break
				default:
					this.model.set(el.name,el.value)
				}
			},
			selectPhoto: function(){
				var me=this,
					img=this.$('form img').get(0)
				ImageUploader.getInstance()
					.bind(img,{
						onSave:function(f,dataUri){
							img.src=dataUri
							me.model.set('photo',f)
						},
						size:150
					}).click()
			}
		});
		return ListPage.extend({
			clazz:'ChildrenAside',
			tagName:'aside',
			className:'show box',
			itemTemplate:'#tmplChildren',
			cmds:'<a href="#"><span class="icon signout"/></a><a href="#child"><span class="icon plus"/></a>',
			events:{'click footer span.signout': 'signout'},
			collection: new (Parse.Collection.extend({model: Child})),
			initialize:function(){
				this.collection.query=(new Parse.Query(Child)).equalTo('author',Parse.User.current().id)
				ListPage.prototype.initialize.apply(this,arguments)
				this.$('header').remove()
				this.$('article').removeClass('scroll')
			},
			render: function(childs){
				ListPage.prototype.render.apply(this,arguments)
				Child.current=childs[0]
			},
			signout: function(){
				Parse.User.logOut()
				.then(function(){
					Parse.history.navigate('#categories',{replace:true,trigger:true})
				})
				return false
			}
		})
	})();

	;(function(){//user
		router.route('user/:action','user',function(action){Page.create(UserPage).setAction(action)})
		var UserPage=Page.extend({
			clazz:'UserPage',
			title:'SNB Account',
			cmds:'<a><button type="submit"><span class="icon ok-sign"/></button></a>',
			events:{
				'submit form#signin':'signin',
				'submit form#signup':'signup',
				'submit form#password':'password'
			},
			initialize:function(){
				this.content=$('#tmplUser').html(),
				Page.prototype.initialize.apply(this,arguments)
				this.$('header')
					.after('<nav data-control="groupbar">\
						<a href="#user/signin">Sign In</a>\
						<a href="#user/signup">Sign Up</a>\
						<a href="#user/password">Forget Password</a>\
						</nav>');
				var me=this
				this.$('form').submit(function(){
					me[this.id]()	
					return false;
				})
			},
			setAction:function(a){
				this.$('form').hide()
					.filter('form#'+a).show()
				this.$('nav[data-control=groupbar]>a').removeClass('active')
					.filter('[href$='+a+']').addClass('active')
				this.$('footer button[type=submit]').attr('form',a)
			},
			signin: function(){
				try{
					var f=this.$('form#signin').get(0),
						user=new Parse.User({username:f.username.value,password:f.password.value})
					user.logIn()
						.then(function(){
							Parse.history.navigate('#categories',{trigger:true,replace:true})
						})
				}catch(e){
					console.error(e)
				}
				return false
			},
			signup: function(){
				try{
					var f=this.$('form#signup').get(0),
						user=new Parse.User({username:f.username.value,password:f.password.value})
					user.signUp()
						.then(function(){
							Parse.history.navigate('#child',{trigger:true,replace:true})
						})
				}catch(e){
					console.error(e)
				}
				return false
			},
			password: function(){
				Parse.User.requestPasswordReset(this.$('form#signup').get(0).email.value)
				return false
			}
		})
	})();
	
	var ImageUploader=function(){
		if($('#uploader').length)
			return
		$(document.body)
			.append('<input type="file" id="uploader" class="outview" onchange="this.save()">')
			.append('<canvas id="_imgSizer" class="outview"></canvas>')
		_.extend(uploader,{
			bind:function(a,opt){
				this.opt=_.extend({
						success: function(f){
							a && 'IMG'==a.nodeName && (a.src=f.url())
						},
						error:Parse.error,
						size:1024
					},opt)
				return this			
			},
			save:function(){
				var me=this,
					reader=new FileReader(), 
					i=0,len=this.files.length
				reader.onloadend=function(e){
					var file=me.files[i-1],
						data={base64:e.target.result.toImageData(me.opt.size)}
						f=new Parse.File(file.name,data,file.type),
						needSave=true
					me.opt['onSave'] && (needSave=me.opt.onSave.call(me,f, String.prototype.IMAGE_DATA_SCHEME+data.base64))
					needSave!==false && f.save(me.opt)
					i<len ? reader.readAsDataURL(me.files[i++]) : (me.value="")
				}
				reader.readAsDataURL(this.files[i++])
			}
		})
		ImageUploader.getInstance=function(){return uploader}
	};

	var Editor=(function(){//editor
		if(!HTMLImageElement.prototype.isData)
			HTMLImageElement.prototype.isData=function(){
				return this.src.isImageData()
			}
		var TRIM_TAG=/<\/?\s*(\w*?)\s*\/?>/g,
			TRIM_LINE=/\n{3,}/gm
		
		return function(el){
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
				ImageUploader.getInstance().bind(el,{
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
								saveSelection()
							}
					}).click()
			}
			
			el.getThumb=function(){
				if(el['thumb'])
					return el.thumb;
				var thumb=this.querySelector('img');
				if(!thumb)
					return null;
				return new Parse.File('thumb',thumb.src.toImageData(96));
			}

			el.getContent=function(imageSaver){
				return this.innerHTML.replace(TRIM_TAG,"\n").replace(TRIM_LINE,'\n\n');
			}
		}
	})();
	
	$(function(){
		ImageUploader()
		Parse.history.start()
		new ChildrenAside()
	})
}).call(this,Parse._,Parse.$)