define(['Plugin', 'app','plugins/model'],function(Plugin, app){
	return Plugin.extend({
		description:"help play with your children",
		install:function(){
			//application configuration
			$.extend(app,{
				apiKey:'baby',
				title:'Super Daddy',
				shortcutView:this.module('view/children'),
				init:$.aop(app.init, function(_init){
					return function(){
						Child.all = Child.collection()
						Favorite.all = Favorite.collection()
						Task.all = Task.collection()
						
						var args = arguments
						return (Tag.all = Tag.collection())
							.fetch()
							.then(function () {
								Tag.grouped=Tag.all.groupBy('category')
							}).then(function () {
								return _init.apply(app, args)
							})
					}
				}),
				init4User:$.aop(app.init4User,function(_init4User){
					return function (user) {
						return _init4User.apply(this,arguments).then(function(){
							return $.when(
								new Query(Child).equalTo('author',user.id).fetch()
									.then(function(children){
										Child.all.reset(children)
										Child.current(Child.all.first())
									}),
								new Query(Favorite).equalTo('author',user.id).fetch()
									.then(function(favorites){
										Favorite.all.reset(favorites)
									}),
							
								new Query(Task).equalTo('author',user.id).fetch()
									.then(function(tasks){
										Task.all.reset(tasks)
									})
								)
						})
					}
				})
			})

			//route configuration
			app.route('main','',this.module('view/categories'))
			app.route('child','child(/:id/:name)',this.module('view/child'),true)
			app.route('categoryPost','category/:id/:name',this.module('view/posts'),false)
			//app.route('search','posts/:query',this.module('view/main'))
			app.route('post','create(/:catId/:catname)',this.module('view/post'),true)
			app.route('update','update/:id',this.module('view/post'),true)
			app.route('showpost','show/:id',this.module('view/post1'))
			app.route('comments','comments/:kind/:id',this.module('view/comments'))
			app.route('story','story/:post(/:id)',this.module('view/story'),true)

			
			//extends models
			$.each("Tag,Child,Comment,Favorite,Post,Story,Task".split(','),
				function(index,kind){
					app[kind]=app.Model.extend({className:kind})
				})

			var Tag = app.Tag,
				Post = app.Post,
				Child = _.extend(app.Child,/** @lends app.Child */{
					current: function(m){
						switch(m){
						case undefined:
							if(currentChild!=null)
								return currentChild
							return (m=localStorage.getItem('currentChild')) && (m=Child.all.get(parseInt(m))) &&  this.current(m) || null
						case null:
							localStorage.removeItem('currentChild')
							currentChild=null
							Child.all.trigger('current')
							return null
						default:
							currentChild=m
							localStorage.setItem('currentChild',m.id)
							Child.all.trigger('current',m)
							console.log('set current child')
							return m
						}
					}
				}), currentChild,
				Favorite = app.Favorite,
				Task = app.Task,
				Story = app.Story,
				User = app.User,
				Query = app.Query
			
			Post.prototype.getTags=function(){
				return _.map(this.get('tags'),function(id){return Tag.all.get(id).get('name')})
			}
		}
	})
})