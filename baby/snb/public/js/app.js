define(function(){
	window._=Parse._
	window.Promise=Parse.Promise
	$.os.phonegap=_.has(window,'cordova')
	
	var _then=Promise.prototype.then
	Promise.prototype.then=function(passed,failed){
		return _then.call(this,passed,failed||function(e){e&&alert(JSON.stringify(e))})
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
	  
	$(window).bind('resize',function(){
		if($('#media').length==0)
			$('body').append('<div id="media" class="outview"></div>')
		$.media=$('#media').width()==1 ? 'phone' : 'tablet'
		$('body').data('device',$.media)
	}).resize()	
	
  var app=_.extend({
		init: function(){
			var user=Parse.User.current(),
				tagPromise=new Promise()
			new Parse.Query(Tag).find()
				.then(function(o){
					Tag.all=o
					Tag.grouped=_.groupBy(o,function(t){
						Tag.all[t.id]=t 
						return t.get('category')
					})
					tagPromise.resolve()
				})
			
			Child.all=new Parse.Collection
			Child.current=null
			Favorite.all=new Parse.Collection
			Task.all=new Parse.Collection
			return user?Promise.when([this.init4User(user),tagPromise]):tagPromise
		},
		init4User: function(user){
			var ps=[],childPromise=new Promise
			new Parse.Query(Child).equalTo('author',user.id).find()
				.then(function(o){
					Child.all.reset(o)
					if(o.length)
						Child.current=localStorage['childCurrent'] ? Child.all.get(localStorage['childCurrent']) : o[0]
					else
						Child.current=null
					childPromise.resolve()
				})
			ps.push(childPromise)
			
			var favoritePromise=new Promise
			new Parse.Query(Favorite).equalTo('author',user.id).find()
				.then(function(favorites){
					Favorite.all.reset(favorites)
					favoritePromise.resolve()
				})
			ps.push(favoritePromise)
			
			var taskPromise=new Promise
			new Parse.Query(Task).equalTo('author',user.id).find()
				.then(function(tasks){
					Task.all.reset(tasks)
					taskPromise.resolve()
				})
			ps.push(taskPromise)
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