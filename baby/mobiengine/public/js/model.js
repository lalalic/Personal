define(['app', 'jQuery','Underscore','Backbone'],function(app, $, _, Backbone){
	
	_.each("Tag,Child,Comment,Favorite,Post,Story,Task".split(','), function (o) {
		this[o] = app.createKind(new Backbone.Model({name : o }))
	}, app)

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

	var _init = app.init
	app.init = function () {
		Child.all = Child.collection()
		Favorite.all = Favorite.collection()
		Task.all = Task.collection()
		
		var args = arguments
		return (Tag.all = Tag.collection())
			.fetch()
			.then(function () {
				Tag.grouped = _.groupBy(Tag.all, function (t) {
					Tag.all[t.id] = t
					return t.get('category')
				})
			})
			.then(function () {
				return _init.apply(app, args)
			})
	}

	var _init4User = app.init4User
	app.init4User = function (user) {
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