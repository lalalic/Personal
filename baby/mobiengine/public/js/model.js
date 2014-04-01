define(['app', 'jQuery','Underscore','Backbone'],function(app, $, _, Backbone){
	
	_.each("Tag,Child,Comment,Favorite,Post,Story,Task".split(','), function (o) {
		this[o] = app.createKind(new Backbone.Model({name : o }))
	}, app)

	var Tag = app.Tag,
		Post = app.Post,
		Child = _.extend(app.Child,/** @lends app.Child */{
			current: function(child){
				if(child!=undefined){
					currentChild=child
					Child.all.trigger('current',currentChild)
				}
				return currentChild
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
			.then(function (o) {
				Tag.grouped = _.groupBy(o, function (t) {
					Tag.all[t.id] = t
					return t.get('category')
				})
			})
			.then(function () {
				return _init.apply(this, args)
			})
	}

	var _init4User = app.init4User
	app.init4User = function (user) {
		return _init4User.apply(this,arguments).then(function(){
			return $.when(
				new Query(Child).equalTo('author',user.id).fetch()
					.then(function(o){
						Child.all.reset(o)
						if(o.length){
							var v=localStorage.getItem('currentChild')
							localStorage.setItem('currentChild',
								Child.current(v ? Child.all.get(parseInt(v)) : o[0]).id)
						}else
							Child.current(null)
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