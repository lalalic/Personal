define('app',function(){
	var VERSION="0.1"
	window._=Parse._
	window.Promise=Parse.Promise
	$.os.phonegap=_.has(window,'_cordovaNative')
	
	if($.os.phonegap){
		document.writeln('<s'+'cript src="file:///android_asset/www/phonegap.js"></s'+'cript>')
		//document.writeln('<s'+'cript src="http://192.168.2.5:8080/target/target-script-min.js"></s'+'cript>')
	}
	
	$.isOffline=function(){
		if(location.protocol.match(/^file/))
			return (Date.now()-$.isOffline.lastCheckAt)<5000
		return false
	}
	$.isOffline.lastCheckAt=0
	
	var _ajax=Parse._ajax
	Parse._ajax=function(){
		var p=_ajax.apply(this,arguments)
		p.then(null,function(e){
			if(e.status==0)
				$.isOffline.lastCheckAt=Date.now()
		})
		return p
	}
	
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
				urlArgs: "bust="+VERSION,
				deps: ['view/splash','tool/offline'],
				callback: function(splash,offline){
					splash.show()
					offline.init().then(function(){						
						var startApp=function (){
							splash.show()
							var _start=function(){					
								require(['view/children'],function(children){
									children[$.media=='tablet'?'show':'hide']()
								})
								splash.remove()
								Parse.history.start()
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
					if(o.length)
						Child.current=localStorage['childCurrent'] ? Child.all.get(localStorage['childCurrent']) : o[0]
					else
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
		}
	},Parse.Events)
	
	//entities
	_.each("Tag,Child,Comment,Favorite,Post,Story,Task".split(','),
		function(o){this[o]=Parse.Object.extend(o.toLowerCase())},app)
	var Tag=app.Tag, Post=app.Post, Child=app.Child, Favorite=app.Favorite,Task=app.Task
	Post.prototype.getTags=function(f){
		return this.has('tags') && 
			_.map(this.get('tags'),function(t){return Tag.all[t].get('name')})
				.join(',') ||''
	}
	
	//router
	var router=new Parse.Router()
	_.each([//route name, url, view name
		'home,,categories',
		'createChild,child,child',
		'updateChild,child/:id/:name,child',
		'favorites,favorites,favorites',
		'tasks,tasks,tasks',
		'post,create/:catId/:catname,post',
		'update,update/:id,post',
		'showpost,show/:id,post1',
		'comments,comments/:id,comments',
		'posts,category/:id/:name,posts',
		'user,user/:action,user',
		'test,test,test',
		'syncOffline,sync,sync'],function(r){
		router.route((r=r.split(','))[1],r[0],function(){
			var args=arguments
			require(['view/'+r[2]],function(page){page.show.apply(page,args)})
		})
	})
	return app
})