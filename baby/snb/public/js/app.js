define('app',function(){
	var VERSION="0.1"
	window._=Parse._
	window.Promise=Parse.Promise
	$.os.phonegap=_.has(window,'_cordovaNative')
	window.reject=function(p){return function(e){p.reject()}}

	;(function(){//check offline status
		$.isOffline=function(){
			if(location.protocol.match(/^file/))
				return (Date.now()-$.isOffline.lastCheckAt)<5000
			return false
		}
		$.isOffline.lastCheckAt=0
		
		var _ajax=Parse._ajax,
			fallback=function(e){
				if(e.status==0)
					$.isOffline.lastCheckAt=Date.now()
			}
		Parse._ajax=function(){
			var p=_ajax.apply(this,arguments)
			p.then(null,fallback)
			return p
		}
		var _$ajax=$.ajax
		$.ajax=function(options){
			if(options.error){
				var _error=options.error
				options.error=function(xhr){
					fallback(xhr)
					_error.apply(this,arguments)
				}
			}else
				options.error=fallback
			return _$ajax.apply(this,arguments)
		}
	})();
	
	
	;(function(){// extend _.template
		_.templateSettings = {
			evaluate    : /<%([\s\S]+?)%>/g,
			interpolate : /\{\{([\s\S]+?)\}\}/g,
			escape      : /\{\{\{([\s\S]+?)\}\}\}/g
		  };
		
		var _template=_.template, templates={}
		_.template=function(text,data,setting){
			if(text.charAt(0)=='#'){
				var name=text.substr(1);
				if(!(name in templates)){
					templates[name]=_template($(text).html())
					$(text).remove()
				}
				if(data!=undefined)
					return templates[name](data,setting)
				return templates[name]
			}else
				return _template(text,data,setting)
		}
	})();
	
	function media(){
		$(window).bind('resize',function(){
			if($('#media').length==0)
				$('body').append('<div id="media" class="outview"></div>')
			$.media=$('#media').width()==1 ? 'phone' : 'tablet'
			$('body').data('device',$.media)
		}).resize()	
	}  
	var app=_.extend({
		start: function(){
			Parse.initialize("CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL","RwqvvbakVmWPhtO78QCUppfnclzfZ2SyUZ198ArG")
			media()
			require.config({
				baseUrl:'./js',
				urlArgs: "v=0.3",//+Date.now(),//VERSION,
				deps: ['view/splash','tool/offline','lib/i18n!nls/all'],
				callback: function(splash,offline,i18n){
					window.text=function(a){return  ((a=a.toLowerCase()) in i18n) ? i18n[a] : (i18n[a]=a)}
					document.title=text("Super Daddy")
					splash.show()
					offline.init().then(function(){						
						var startApp=function (){
							splash.show()
							var _start=function(){					
								require(['view/children'],function(children){
									children[$.media=='tablet' ? 'show' : 'hide']()
								})
								Parse.history.start()
								splash.remove()
							}
							app.init().then(_start,_start)
						};
						if(offline.needSync()){
							require(['view/sync'],function(syncPage){
								syncPage.show().start(true).then(startApp,startApp)
							})
						}else
							startApp()				
					})
				}
			})			
		},
		init: function(){
			var user=Parse.User.current(),
				tagPromise=new Parse.Query(Tag).find()
					.then(function(o){
						Tag.all=o
						Tag.grouped=_.groupBy(o,function(t){
							Tag.all[t.id]=t 
							return t.get('category')
						})
					})
			
			Child.all=new Parse.Collection
			Child.current=null
			Favorite.all=new Parse.Collection
			Task.all=new Parse.Collection
			return user?Promise.when([this.init4User(user),tagPromise]):tagPromise
		},
		init4User: function(user){
			var ps=[]
			ps.push(new Parse.Query(Child).equalTo('author',user.id).find()
				.then(function(o){
					Child.all.reset(o)
					if(o.length){
						var v=localStorage.getItem('childCurrent')
						v && (v=Child.all.get(v))
						Child.current=v||o[0]
						localStorage.setItem('childCurrent',Child.current.id)
					}else
						Child.current=null
				}))
			
			ps.push(new Parse.Query(Favorite).equalTo('author',user.id).find()
				.then(function(favorites){
					Favorite.all.reset(favorites)
				}))
			
			ps.push(new Parse.Query(Task).equalTo('author',user.id).find()
				.then(function(tasks){
					Task.all.reset(tasks)
				}))
			return Promise.when(ps)
		},
		clear4User: function(){
			Child.all.reset([])
			Favorite.all.reset([])
			Task.all.reset([])
		},
		isLoggedIn: function(){
			return Parse.User.current()!=null
		}
	},Parse.Events)
	
	//entities
	_.each("Tag,Child,Comment,Favorite,Post,Story,Task".split(','),
		function(o){this[o]=Parse.Object.extend(o.toLowerCase())},app)
	var Tag=app.Tag, Post=app.Post, Child=app.Child, Favorite=app.Favorite,Task=app.Task,Story=app.Story
	
	//router
	var router=new Parse.Router
	_.each([//route name, url, view name
		'categories,categories,categories',
		'createChild,child,child,user',
		'updateChild,child/:id/:name,child,user',
		'favorites,favorites,favorites,user',
		'tasks,tasks,tasks,user',
		'post,create/:catId/:catname,post,user',
		'update,update/:id,post,user',
		'showpost,show/:id,post1',
		'updateStory,story/:post/:id,story,user',
		'createStory,story/:post,story,user',
		'comments,comments/:id,comments',
		'posts,category/:id/:name,posts',
		'test,test,test',
		'syncOffline,sync,sync,user'],function(r){
		router.route((r=r.split(','))[1],r[0],function(){
			var args=arguments
			if(r.length==4 && r[3]=='user' && Parse.User.current()==null)//need login
				require(['view/user'],function(page){page.show('signin')})
			else
				 require(['view/'+r[2]],function(page){page.show.apply(page,args)})
		})
	})
	router.route('','home',function(){
		router.navigate((app.isLoggedIn() ? 'tasks' : 'categories'),{trigger:true,replace:true})
	})
	return app
})